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
      const canvas = await html2canvas(element, { scale: 2 });

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
    millisecondsLeft = millisecondsLeft % 6000
    let seconds: number = Math.floor(millisecondsLeft / 1000); // milliseconds in a day

    let result: string = `${hours}h:${minutes}m:${seconds}s`;
    return result;
  }

  // Filter date keys by timeframe
  function getDateKeysForTimeFrame(frame: "today" | "week" | "allTime", allDates: string[]): string[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split('T')[0];

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

        {/* Header */}
        <div className="pb-2 mb-4 border-b border-black flex justify-between items-center">
          <h1 className="text-xl font-semibold">WebTrack</h1>
          <div className="flex gap-2">
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
          </div>
        </div>

        {/*<h1 className="text-3xl font-bold underline">Hello World!</h1>
        <p className="text-xl font-semibold">Data Overview</p>*/}

          {/* Middle section */}
        <div id="image-container" className="flex items-start justify-center gap-4">
          {/* Left Side */}
          <div className="ml-4 flex justify-center items-start w-[300px]">
              <div className="mt-4 w-[300px] h-[300px] min-w-[300px] min-h-[300px]">
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

function SettingsPage() {
  const navigate = useNavigate();
  return (
    <div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold underline">Settings</h1>
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  </React.StrictMode>
);
