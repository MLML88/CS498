import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
import PieChartWithKey from "./PieChartWithKey";
import List from "./List";
import { getTimeForUrl, getAllDailyData, getAllTags, createTag, deleteTag, addDomainToTag, removeDomainFromTag } from "../background";
import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
// import { storage } from '#imports';

function MainPage() {
  const navigate = useNavigate();

  interface TimeData {
   timeData: Record<string, number>; 
  }

  interface DataEntry {
    name: string;
    numValue: number;
    strValue: string;
  }

  const [domain, setDomain] = useState<string>("");
  const [time, setTime] = useState<number | null>(null);
  const [timeData, setTimeData] = useState<TimeData | null>(null);
  const [dataEntry, setDataEntry] = useState<DataEntry[]>([]);
  const [timeFrame, setTimeFrame] = useState<"today" | "week" | "allTime">("today");
  const [allTags, setAllTags] = useState<Record<string, string[]>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

    //Get active tab URL and time spent
    async function init() { 
      console.log("from init"); 
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      if (!tab.url || tab.url === "about:blank") {
        console.log("Invalid tab URL.");
        return;
      }
      console.log(tab.url);
      setDomain(tab.url);
      var timeSpent = await getTimeForUrl(tab.url);
      console.log(timeSpent);
      setTime(timeSpent);
    }

    useEffect(() => {
      init();
    }, []);

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getAllTags();
      setAllTags(tags);
    };
    fetchTags();
  }, []);

  const CaptureChart = async () => {
    try {
      const element = document.getElementById("image-container");
      if (!element) {
        navigate("/share");
        return;
      }

      const isDark = document.body.className === "dark";

      element.style.backgroundColor = isDark ? "#1e1e1e" : "#f3f4f6";
      element.style.color = isDark ? "white" : "black";

      const canvas = await html2canvas(element, { scale: 2 });

      element.style.backgroundColor = "";
      element.style.color = "";

      const image = canvas.toDataURL("image/jpeg", 1.0);
      sessionStorage.setItem("chartImage", image);
      sessionStorage.setItem("chartData", JSON.stringify(dataEntry));

  } catch (err) {
    console.error("Screenshot failed: ", err);
  }
    navigate("/share");
  };

  // Converts the time from milliseconds to days:hours:minutes
  function convertTime(milliseconds: number): string {
    let hours: number = Math.floor(milliseconds/ 3600000); // milliseconds in an hour
    let millisecondsLeft = milliseconds %  3600000
    let minutes: number = Math.floor(millisecondsLeft / 60000); // milliseconds in a minute
    millisecondsLeft = millisecondsLeft % 60000
    let seconds: number = Math.floor(millisecondsLeft / 1000); // milliseconds in a day

    let result: string = `${hours}h:${minutes}m:${seconds}s`;
    return result;
  }

  // Filter date keys by timeframe, converting UTC dates to local timezone
  function getDateKeysForTimeFrame(frame: "today" | "week" | "allTime", allDates: string[]): string[] {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; // timezone offset in milliseconds
    
    // Get local today's midnight
    const localTodayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const localTomorrowMidnight = new Date(localTodayMidnight.getTime() + 24 * 60 * 60 * 1000);
    console.log("Local today start:", localTodayMidnight.toISOString(), "Local tomorrow start:", localTomorrowMidnight.toISOString());

    // Convert local dates to UTC to find matching UTC date keys
    const utcTodayStart = new Date(localTodayMidnight.getTime() + offset);
    const utcTodayEnd = new Date(localTomorrowMidnight.getTime() + offset);
    const utcTodayStartKey = utcTodayStart.toISOString().split('T')[0];
    const utcTodayEndKey = utcTodayEnd.toISOString().split('T')[0];
    console.log("UTC today start:", utcTodayStartKey, "UTC today end:", utcTodayEndKey);

    // For week, get 7 days ago in local time, then convert to UTC
    const localWeekAgoMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
    const utcWeekAgoStart = new Date(localWeekAgoMidnight.getTime() + offset);
    const utcWeekAgoStartKey = utcWeekAgoStart.toISOString().split('T')[0];
    console.log("UTC week ago start:", utcWeekAgoStartKey, "UTC today end:", utcTodayEndKey);
    
    return allDates.filter(dateKey => {
      switch (frame) {
        case "today":
          return dateKey >= utcTodayStartKey && dateKey <= utcTodayEndKey;
        case "week":
          return dateKey >= utcWeekAgoStartKey && dateKey <= utcTodayEndKey;
        case "allTime":
          return true;
      }
    });
  }   

  
  // On popup open get timeData from local storage
  useEffect(() => {
    console.log("Fetching data for timeframe:", timeFrame, "tag:", selectedTag);

    const fetchData = async () => {
      try {
        const allDailyData = await getAllDailyData();
        console.log("All daily data:", allDailyData);
        
        // log output
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = today.toISOString().split('T')[0];
        console.log("todayKey:", todayKey);
        console.log("available keys:", Object.keys(allDailyData));
        // log output

        const dateKeys = getDateKeysForTimeFrame(timeFrame, Object.keys(allDailyData));
        console.log("Filtered date keys:", dateKeys);

        // Aggregate by domain across selected dates
        let aggregated: Record<string, number> = {};
        dateKeys.forEach(dateKey => {
          const dayData = allDailyData[dateKey];
          Object.entries(dayData).forEach(([domain, duration]) => {
            aggregated[domain] = (aggregated[domain] || 0) + (duration as number);
          });
        });

        // Filter by tag if one is selected
        if (selectedTag && allTags[selectedTag]) {
          const domainsInTag = allTags[selectedTag];
          aggregated = Object.fromEntries(
            Object.entries(aggregated).filter(([domain]) => domainsInTag.includes(domain))
          );
        }

        console.log("Aggregated data:", aggregated);

        // Convert to the format the PieChart expects
        const formatted: DataEntry[] = Object.entries(aggregated)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(
          ([domain, time]) => ({
            name: domain,
            numValue: time as number,
            strValue: convertTime(time as number),
          })
        );

        console.log("Formatted for Piechart: ", formatted);

        setDataEntry(formatted);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      
    };

    fetchData();

  }, [timeFrame, selectedTag, allTags]);

  return (
    <>
      {/*<div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">*/}
      <div className="relative p-4 bg-gray-100 rounded-lg shadow-md w-[700px] h-[550px]">

        {/* Header */}
        <div className="pb-2 mb-4 border-b border-black flex justify-between items-center">
          <h1 className="text-xl font-semibold">WebTrack</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setTimeFrame("today")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                timeFrame === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFrame("week")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                timeFrame === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFrame("allTime")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                timeFrame === "allTime"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              All Time
            </button>

            <select
              value={selectedTag || ""}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="px-3 py-1 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100"
            >
              <option value="">All Tags</option>
              {Object.keys(allTags).map(tagName => (
                <option key={tagName} value={tagName}>
                  {tagName}
                </option>
              ))}
            </select>
          </div>
        </div>

            {/* Middle section */}
          <div className="flex items-start justify-center gap-4">
            {/* Left Side */}
            <div className="ml-4 flex justify-center items-start w-[300px]">
                <div className="mt-4 w-[300px] h-[300px] min-w-[300px] min-h-[300px] text-center">
                  <h2 style={{ width: 'auto', whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '10px', fontWeight: 'medium' }}>Most Viewed Web Pages</h2>
                <PieChartWithKey data={dataEntry?.slice(0, 8) ?? []} />
              </div>
            </div>

            {/* Right Side */}
            <div className="ml-2 flex justify-center w-[330px]">
              <div className="w-[400px] h-[425px] rounded-xl shadow p-4"
              style={{ backgroundColor: "#e9e5e8" }}>
                <List data={dataEntry} />
              </div>
            </div>
          </div>
        
        </div>

          {/* Footer */}
        <div className="fixed bottom-0 left-0 z-50 w-full h-12 bg-neutral-primary-soft">
        <div className="grid h-full grid-cols-2 gap-2 px-2 font-medium">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
              >
                Settings
              </button>
              
              <button
                type="button"
                onClick={CaptureChart}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
              >
                Share
              </button>

              {/* add template */}

              
              



              
        </div>
        </div>

    </>
  );
}

function SharePage() {
  const navigate = useNavigate();

  const downloadChart = () => {
    const image = sessionStorage.getItem("chartImage");
    if (!image) return;

    const link = document.createElement("a");
    link.href = image;
    link.download = "webtrack-data.jpeg";
    link.click();
  };

  const downloadCSV = () => {
    const raw = sessionStorage.getItem("chartData");
    if (!raw) return;

    const data = JSON.parse(raw);

    // CSV header
    const header = ["Domain", "Time (ms)"];

    // Convert rows
    const rows = data.map((entry: any) => [
      entry.name,
      entry.numValue
    ]);

    // Combine into CSV string
    const csvContent = [header, ...rows].map(row => row.join(",")).join("\n");

    // Create blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "webtrack-data.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
    <div className="relative p-4 bg-gray-100 rounded-lg shadow-md w-[700px] h-[550px]">

        {/* Header */}
        <div className="pb-2 mb-4 border-b border-black">
          <h1 className="text-xl font-semibold">WebTrack</h1>
        </div>

      <div className="w-full flex flex-col items-center justify-center gap-4 h-[400px]">
        <h1 className="text-3xl font-bold underline">Share this!</h1>

        <button
          onClick={downloadChart}
          className="w-36 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded">
            Download jpeg
        </button>

        <button
          onClick={downloadCSV}
          className="w-36 bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-4 border-b-4 border-purple-800 hover:border-purple-600 rounded"
        >
          Download CSV
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-36 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
        >
        Back to Main
      </button>
      </div>
      </div>
    </>
  );
}

function SettingsPage({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();

  return (
    <div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold underline">Settings</h1>

      {/*Toggle Switch*/}
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="text-lg">Dark Mode</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
          className="w-5 h-5"
        />
      </label>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">
        <button
          type="button"
          onClick={() => navigate("/tags")}
          className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
        >
          Manage Tags
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-4 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded w-full"
      >
        Back to Main
      </button>
    </div>
  );
}

function TagsPage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [newTagName, setNewTagName] = useState("");
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    const fetchTagsAndDomains = async () => {
      const allTags = await getAllTags();
      setTags(allTags);

      // Get available domains from dailyData
      const allDailyData = await getAllDailyData();
      const domains = Object.keys(allDailyData).flatMap(dateKey => 
        Object.keys(allDailyData[dateKey])
      );
      // Remove duplicates and sort
      const uniqueDomains = [...new Set(domains)].sort();
      setAvailableDomains(uniqueDomains);
    };
    fetchTagsAndDomains();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag(newTagName);
    const allTags = await getAllTags();
    setTags(allTags);
    setNewTagName("");
  };

  const handleDeleteTag = async (tagName: string) => {
    await deleteTag(tagName);
    const allTags = await getAllTags();
    setTags(allTags);
  };

  const handleAddDomainToTag = async (tagName: string, domain: string) => {
    await addDomainToTag(tagName, domain);
    const allTags = await getAllTags();
    setTags(allTags);
    setOpenDropdown(null);
    setSearchTerm("");
  };

  const filteredDomains = availableDomains.filter(domain => 
    domain.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !tags[openDropdown || ""]?.includes(domain)
  );

  return (
    <div className="relative p-4 bg-gray-100 rounded-lg shadow-md w-[700px] h-[550px] flex flex-col">
      <div className="pb-2 mb-4 border-b border-black">
        <h1 className="text-xl font-semibold">WebTrack</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Existing Tags */}
        <div>
          <h2 className="font-semibold mb-3">Tags ({Object.keys(tags).length})</h2>
          <div className="bg-white rounded shadow p-3 mb-3 divide-y divide-gray-200">
            {Object.keys(tags).length === 0 ? (
            <p className="text-gray-500">No tags created yet</p>
          ) : (
            Object.keys(tags).map(tagName => (
              
              <div key={tagName} className="p-3">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setExpandedTag(expandedTag === tagName ? null : tagName)}
                    className="font-semibold text-left flex-1 cursor-pointer hover:text-blue-600"
                  >
                    {tagName} ({tags[tagName].length})
                  </button>
                  <div className="flex gap-2 relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === tagName ? null : tagName)}
                      className="bg-green-500 hover:bg-green-400 text-white font-bold py-1 px-3 rounded text-xs"
                    >
                      Add Domain
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tagName)}
                      className="bg-red-500 hover:bg-red-400 text-white font-bold py-1 px-3 rounded text-xs"
                    >
                      Delete
                    </button>

                    {/* Domain Dropdown */}
                    {openDropdown === tagName && (
                      <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded shadow-lg z-10 w-48">
                        <input
                          type="text"
                          placeholder="Search domains..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border-b border-gray-300 rounded-t"
                          autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto">
                          {filteredDomains.length === 0 ? (
                            <p className="px-3 py-2 text-gray-500 text-sm">No domains available</p>
                          ) : (
                            filteredDomains.map(domain => (
                              <button
                                key={domain}
                                onClick={() => handleAddDomainToTag(tagName, domain)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-100 text-sm text-gray-700"
                              >
                                {domain}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {expandedTag === tagName && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                    {tags[tagName].length === 0 ? (
                      <p className="text-gray-500">No domains in this tag</p>
                    ) : (
                      <ul className="list-disc list-inside">
                        {tags[tagName].map(domain => (
                          <li key={domain} className="text-gray-700 flex justify-between items-center">
                            <span>{domain}</span>
                            <button
                              onClick={() => removeDomainFromTag(tagName, domain).then(async () => {
                                const allTags = await getAllTags();
                                setTags(allTags);
                              })}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold ml-2"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        </div>

        {/* Create New Tag */}
        <div className="mb-6 p-4 bg-white rounded border border-gray-300 shadow">
          <h2 className="font-semibold mb-2">Create New Tag</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g., Work, Social)"
              maxLength={48}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
              onKeyPress={(e) => e.key === "Enter" && handleCreateTag()}
            />
            <button
              onClick={handleCreateTag}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
            >
              Create
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/settings")}
        className="mt-4 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded w-full"
      >
        Back to Settings
      </button>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

function AppWrapper() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) setDarkMode(JSON.parse(saved));
  }, []);

  // Apply + save
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route
          path="/settings"
          element={<SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
        />
        <Route path="/tags" element={<TagsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

