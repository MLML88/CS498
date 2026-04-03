import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

import { getAllDailyData, getTimeForUrl } from "../services/Time";
import { getAllTags } from "../services/Tag";
import List from "../components/List";
import PieChartWithKey from "../components/PieChartWithKey";


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
    const fetchTags = async () => {
      const tags = await getAllTags();
      setAllTags(tags);
    };

    init();
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
    let hours: number = Math.floor(milliseconds / 3600000); // milliseconds in an hour
    let millisecondsLeft = milliseconds % 3600000
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
              className={`px-3 py-1 rounded text-sm font-medium ${timeFrame === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFrame("week")}
              className={`px-3 py-1 rounded text-sm font-medium ${timeFrame === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFrame("allTime")}
              className={`px-3 py-1 rounded text-sm font-medium ${timeFrame === "allTime"
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

export default MainPage