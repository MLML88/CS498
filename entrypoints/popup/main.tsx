import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
import PieChartWithKey from "./PieChartWithKey";
import List from "./List";
import { getTimeForUrl, getAllDailyData } from "../background";
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

  // Filter date keys by timeframe
  function getDateKeysForTimeFrame(frame: "today" | "week" | "allTime", allDates: string[]): string[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split('T')[0]; // possible issue?
    //const todayKey = new Date().toISOString().split('T')[0];

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoKey = sevenDaysAgo.toISOString().split('T')[0];

    return allDates.filter(dateKey => {
      switch (frame) {
        case "today":
          return dateKey === todayKey;
        case "week":
          return dateKey >= sevenDaysAgoKey;
        case "allTime":
          return true;
      }
    });
  }   

  
  // On popup open get timeData from local storage
  useEffect(() => {
    console.log("Fetching data for timeframe:", timeFrame);

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
        const aggregated: Record<string, number> = {};
        dateKeys.forEach(dateKey => {
          const dayData = allDailyData[dateKey];
          Object.entries(dayData).forEach(([domain, duration]) => {
            aggregated[domain] = (aggregated[domain] || 0) + (duration as number);
          });
        });

        console.log("Aggregated data:", aggregated);

        // Convert to the format the PieChart expects
        const formatted: DataEntry[] = Object.entries(aggregated)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 8).map(
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

  }, [timeFrame]);

  return (
    <>
      {/*<div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">*/}
      <div className="relative p-4 bg-gray-100 rounded-lg shadow-md w-[700px] h-[550px]">

        <div id="image-container" className="p-2">

          {/* Header */}
          <div className="pb-2 border-b border-black mb-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">WebTrack</h1>
            <div className="flex gap-2">

              <button
                onClick={() => setTimeFrame("today")}
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: timeFrame === "today" ? '#2563eb' : '#d1d5db',
                  color: timeFrame === "today" ? 'white' : '#374151',
                }}
              >
                Today
              </button>

              <button
                onClick={() => setTimeFrame("week")}
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: timeFrame === "week" ? '#2563eb' : '#d1d5db',
                  color: timeFrame === "week" ? 'white' : '#374151',
                }}
              >
                This Week
              </button>

              <button
                onClick={() => setTimeFrame("allTime")}
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: timeFrame === "allTime" ? '#2563eb' : '#d1d5db',
                  color: timeFrame === "allTime" ? 'white' : '#374151',
                }}
              >
                All Time
              </button>
            </div>
          </div>

            {/* Middle section */}
          <div className="flex items-start justify-center gap-4">
            {/* Left Side */}
            <div className="ml-4 flex justify-center items-start w-[300px]">
                <div className="mt-4 w-[300px] h-[300px] min-w-[300px] min-h-[300px] text-center">
                  <h2 style={{ width: 'auto', whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '10px', fontWeight: 'medium' }}>Most Viewed Web Pages</h2>
                <PieChartWithKey data={dataEntry ?? []} />
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

      <button
        type="button"
        onClick={() => navigate("/")}
        className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
      >
        Back to Main
      </button>
  </div>
  );
}

/*ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  </React.StrictMode>
);*/

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
      </Routes>
    </MemoryRouter>
  );
}