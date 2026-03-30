const record = storage.defineItem<Record<string, number>>('local:allTimeData', {
  fallback: {},
})

const dailyData = storage.defineItem<Record<string, Record<string, number>>>('local:dailyData', {
  fallback: {},
})

// Helper function to get today's date key in YYYY-MM-DD format
function getDateKey(timestamp?: number): string {
  const date = new Date(timestamp || Date.now());
  return date.toISOString().split('T')[0];
}

export default defineBackground(() => {
  type TimeMap = Record<string, number>;

  let activeTabId: number | null = null;
  let activeUrl: string | null = null;
  let startTime: number | null = null;
  let windowFocused = true;

  //Normalize URL (modify this to get the url we want to display)
  function normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  //Save accumulated time to storage
  async function saveTime(url: string, duration: number) {
    if (!url || duration <= 0) return;

    const key = normalizeUrl(url);
    const dateKey = getDateKey();

    // Update aggregated time (all-time)
    const allTimeData = await record.getValue();
    allTimeData[key] = (allTimeData[key] || 0) + duration;
    await record.setValue(allTimeData);

    // Update daily data
    const allDailyData = await dailyData.getValue();
    if (!allDailyData[dateKey]) {
      allDailyData[dateKey] = {};
    }
    allDailyData[dateKey][key] = (allDailyData[dateKey][key] || 0) + duration;
    await dailyData.setValue(allDailyData);

    console.log("Saving time:", key, duration, "on", dateKey);
  }

  //Stop tracking current tab
  async function stopTracking() {
    if (!startTime && !activeUrl) return;

    const duration = Date.now() - startTime;

    if (duration <= 0 || duration > 1000 * 60 * 60 * 12) {
      console.log("Invalid duration skipped: ", duration);
      startTime = null;
      return;
    }

    console.log("Stop tracking:", activeUrl, duration);

    await saveTime(activeUrl, duration);

    startTime = null;
  }

  //Start tracking new tab
  async function startTrackingCurrentTab() {
    if (!windowFocused) return;

    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    if (!tab?.id || !tab.url) return;

    //Ignore chrome internal pages
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("about:blank")) return;

    activeTabId = tab.id;
    activeUrl = tab.url;
    startTime = Date.now();

    console.log("Start tracking:", activeUrl);
  }

  async function init() {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    if (tab?.id) {
      await startTrackingCurrentTab();
    }
  }

  //When active tab changes
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log("from active tab");
    windowFocused = true;
    await stopTracking();
    await startTrackingCurrentTab();
  });

  //When tab URL changes (navigation)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status == 'complete' && tab.status == 'complete') {
      if (tabId === activeTabId && changeInfo.url) {
        console.log("from url change");
        windowFocused = true;
        await stopTracking();
        await startTrackingCurrentTab();
  
      } else { //URL changing from new tab
        console.log("URL change from blank tab");
        windowFocused = true;
        await startTrackingCurrentTab();
      }
    }
  });

  //When window focus changes
  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      //Window lost focus
      console.log("Lost focus");
      windowFocused = false;
      await stopTracking();
    } else {
      //Window gained focus
      console.log("Regained focus");
      windowFocused = true;
      if (activeTabId !== null) {
        await startTrackingCurrentTab();
      }
    }
  });

  //Cleanup if tab closes
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (tabId === activeTabId) {
      await stopTracking();
      activeTabId = null;
      activeUrl = null;
    }
  });

  console.log("Background time tracker started");
  init();
});


//return the total time spent on a URL in seconds
export async function getTimeForUrl(url: string): Promise<number> {
  function normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      u.hash = "";
      return u.toString();
    } catch {
      return url;
    }
  }
  
  type TimeMap = Record<string, number>;
  const key = normalizeUrl(url);
  const data = await chrome.storage.local.get("allTimeData");
  const allTimeData: TimeMap = data.allTimeData || {};
  console.log("Getting time for:", key, allTimeData[key] || 0);
  return (allTimeData[key] || 0) / 1000;
}

// Get daily data for a specific date
export async function getDailyData(dateKey: string) {
  try {
    const allDailyData = await dailyData.getValue();
    return allDailyData[dateKey] || {};
  } catch (error) {
    console.error("Error getting daily data:", error);
    return {};
  }
}

// Get all daily data
export async function getAllDailyData() {
  try {
    const data = await dailyData.getValue();
    return data;
  } catch (error) {
    console.error("Error getting all daily data:", error);
    return {};
  }
}
