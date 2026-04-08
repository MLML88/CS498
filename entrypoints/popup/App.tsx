import { useState, useEffect } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import MainPage from "./pages/MainPage";
import SharePage from "./pages/SharePage";
import SettingsPage from "./pages/SettingsPage";
import TagsPage from "./pages/TagsPage";
import AlarmsPage from "./pages/AlarmsPage";

function App() {
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
        <Route path="/alarms" element={<AlarmsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

export default App