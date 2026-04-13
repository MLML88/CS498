import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { getAllDailyData } from "../services/Time";
import { Alarm, getAllAlarms, createAlarm, deleteAlarm } from "../services/Alarm";
import { normalizeUrl } from "../../background"; // Import the normalizeUrl function from background.ts

function AlarmsPage() {
  const navigate = useNavigate();
  const [alarms, setAlarms] = useState<Record<string, Alarm>>({});
  const [newAlarmDomain, setNewAlarmDomain] = useState("");
  var [newAlarmHours, setNewAlarmHours] = useState("");
  var [newAlarmMinutes, setNewAlarmMinutes] = useState("");


  useEffect(() => {
    const fetchAlarms = async () => {
      const allAlarms = await getAllAlarms();
      setAlarms(allAlarms);
    };
    fetchAlarms();
  }, []);

  const handleCreateAlarm = async () => {

    // Input validation
    if (!newAlarmDomain) {
      alert("Please enter a domain for the alarm.");
      return;
    }
    if (newAlarmHours === "" && newAlarmMinutes === "") {
      alert("Please enter a duration for the alarm.");
      return;
    }
    if (newAlarmHours === "") {
      newAlarmHours = "0";
    }
    if (newAlarmMinutes === "") {
      newAlarmMinutes = "0";
    }

    const shortAlarmDomain = normalizeUrl(newAlarmDomain.trim());
    console.log("newAlarmHours:", parseInt(newAlarmHours), "newAlarmMinutes:", parseInt(newAlarmMinutes));

    const newAlarmDurationMs = (parseInt(newAlarmHours) * 3600 + parseInt(newAlarmMinutes) * 60) * 1000;
    const newAlarm: Alarm = {
      domain: shortAlarmDomain,
      currentTime: 0,
      duration: newAlarmDurationMs,
    };
    const newAlarmId = Math.random().toString(36).substr(2, 9);
    await createAlarm(newAlarmId, newAlarm);
    const allAlarms = await getAllAlarms();
    setAlarms(allAlarms);
    setNewAlarmDomain("");
    setNewAlarmHours("");
    setNewAlarmMinutes("");
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    console.log("Deleting alarm with ID:", alarmId);
    await deleteAlarm(alarmId);
    const allAlarms = await getAllAlarms();
    setAlarms(allAlarms);
  };

  return (
    <div className="relative p-4 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md w-[700px] h-[550px] flex flex-col">
      <div className="pb-2 mb-4 border-b border-black dark:border-gray-700">
        <h1 className="text-xl font-semibold text-black dark:text-white">WebTrack</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Existing Alarms */}
        <div>
          <h2 className="font-semibold mb-3 text-black dark:text-white">
            Alarms ({Object.keys(alarms).length})
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded shadow p-3 mb-3 divide-y divide-gray-200 dark:divide-gray-700">
            {Object.keys(alarms).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No alarms created yet</p>
            ) : (
              Object.keys(alarms).map((alarmId) => (
                <div
                  key={alarmId}
                  className="p-3 flex align-items-center gap-20 text-black dark:text-white"
                >
                  <div className="font-semibold text-sm">
                    {alarms[alarmId].domain}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Current Time: {Math.floor(alarms[alarmId].currentTime / 3600000)}h{" "}
                    {Math.floor((alarms[alarmId].currentTime % 3600000) / 60000)}m
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Duration: {Math.floor(alarms[alarmId].duration / 3600000)}h{" "}
                    {Math.floor((alarms[alarmId].duration % 3600000) / 60000)}m
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 relative">
                      <button
                        onClick={() => handleDeleteAlarm(alarmId)}
                        className="bg-red-500 hover:bg-red-400 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create New Alarm */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 shadow">
          <h2 className="font-semibold mb-2 text-black dark:text-white">
            Create New Alarm
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAlarmDomain}
              onChange={(e) => setNewAlarmDomain(e.target.value)}
              placeholder="Domain (e.g., example.com)"
              maxLength={48}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              onKeyPress={(e) => e.key === "Enter" && handleCreateAlarm()}
            />

            <input
              type="number"
              value={newAlarmHours}
              min={0}
              onChange={(e) => setNewAlarmHours(e.target.value)}
              placeholder="Duration (hours)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              onKeyPress={(e) => e.key === "Enter" && handleCreateAlarm()}
            />

            <input
              type="number"
              value={newAlarmMinutes}
              min={0}
              onChange={(e) => setNewAlarmMinutes(e.target.value)}
              placeholder="Duration (minutes)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              onKeyPress={(e) => e.key === "Enter" && handleCreateAlarm()}
            />

            <button
              onClick={handleCreateAlarm}
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

  )
}

export default AlarmsPage