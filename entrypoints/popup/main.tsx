import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
import PieChartWithKey from "./PieChartWithKey";


function MainPage() {
  const navigate = useNavigate();

  return (
    <>
      {/*<div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">*/}
      <div className="relative p-4 bg-gray-100 rounded-lg shadow-md w-[700px] h-[550px]">

        {/* Header */}
        <div className="pb-2 mb-4 border-b border-black">
          <h1 className="text-xl font-semibold">WebTrack</h1>
        </div>

        {/*<h1 className="text-3xl font-bold underline">Hello World!</h1>
        <p className="text-xl font-semibold">Data Overview</p>*/}

          {/* Middle section */}
        <div className="flex items-start justify-center gap-4">
          {/* Left Side */}
          <div className="flex justify-center items-start w-[300px]">
            <div className="mt-4 w-[300px] h-[300px]">
              <PieChartWithKey />
            </div>
          </div>
          {/* Right Side */}
          <div className="flex justify-center w-[300px]">
            <div className="w-[260px] h-[400px] bg-gray-200 rounded-x1 shadow p-4">
              Info goes here
            </div>
          </div>
        </div>

          {/* Footer */}
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-neutral-primary-soft border-t border-default">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
              >
                Settings
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/share")}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
              >
                Share
              </button>

              {/* add template */}

              
              <button id="multiLevelDropdownButton" data-dropdown-toggle="multi-dropdown" className="inline-flex items-center justify-center text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none" type="button">
                Dropdown button 
                <svg className="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
              </button>

              <div id="multi-dropdown" className="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-44">
                  <ul className="p-2 text-sm text-body font-medium" aria-labelledby="multiLevelDropdownButton">
                    <li>
                      <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Dashboard</a>
                    </li>
                    <li>
                      <button id="doubleDropdownButton" data-dropdown-toggle="doubleDropdown" data-dropdown-placement="right-start" type="button" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">
                        Dropdown
                        <svg className="h-4 w-4 ms-auto rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>
                      </button>
                        <div id="doubleDropdown" className="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-44">
                          <ul className="p-2 text-sm text-body font-medium" aria-labelledby="doubleDropdownButton">
                            <li>
                              <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Overview</a>
                            </li>
                            <li>
                              <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">My downloads</a>
                            </li>
                            <li>
                              <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Billing</a>
                            </li>
                            <li>
                              <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Rewards</a>
                            </li>
                          </ul>
                      </div>
                    </li>
                    <li>
                      <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Earnings</a>
                    </li>
                    <li>
                      <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Sign out</a>
                    </li>
                  </ul>
              </div>




              
        </div>
        </div>

        
      </div>
    </>
  );
}

function SharePage() {
  const navigate = useNavigate();
  return (
    <>
      <div className="fit-content p-4 bg-gray-100 rounded-lg shadow-md w-175 h-138 flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold underline">Share this!</h1><button
        type="button"
        onClick={() => navigate("/")}
        className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
      >
        Back to Main
      </button>
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
