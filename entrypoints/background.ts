const record = storage.defineItem<Record<string, number>>('local:allTimeData', {
  fallback: {},
})

const dailyData = storage.defineItem<Record<string, Record<string, number>>>('local:dailyData', {
  fallback: {},
})

const tags = storage.defineItem<Record<string, string[]>>('local:tags', {
  fallback: {},
})

// Helper function to get today's date key in YYYY-MM-DD format using UTC
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

    // Initialize default tags on first run
    const existingTags = await tags.getValue();
    if (Object.keys(existingTags).length === 0) {
      const defaultTags: Record<string, string[]> = {
        "Work": ["linkedin.com", "github.com", "stackoverflow.com"],
        "Social": ["facebook.com", "twitter.com", "instagram.com"],
        "Entertainment": ["youtube.com", "netflix.com"],
        "Productivity": ["notion.so", "trello.com", "slack.com"],
      };
      await tags.setValue(defaultTags);
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

// Tag management functions
export async function getAllTags() {
  try {
    const data = await tags.getValue();
    return data;
  } catch (error) {
    console.error("Error getting tags:", error);
    return {};
  }
}

export async function createTag(tagName: string) {
  try {
    if (tagName.length > 48) {
      console.error("Tag name exceeds 48 character limit");
      return false;
    }
    const allTags = await tags.getValue();
    if (!allTags[tagName]) {
      allTags[tagName] = [];
      await tags.setValue(allTags);
    }
    return true;
  } catch (error) {
    console.error("Error creating tag:", error);
    return false;
  }
}

export async function deleteTag(tagName: string) {
  try {
    const allTags = await tags.getValue();
    delete allTags[tagName];
    await tags.setValue(allTags);
    return true;
  } catch (error) {
    console.error("Error deleting tag:", error);
    return false;
  }
}

export async function addDomainToTag(tagName: string, domain: string) {
  try {
    const allTags = await tags.getValue();
    if (!allTags[tagName]) {
      allTags[tagName] = [];
    }
    if (!allTags[tagName].includes(domain)) {
      allTags[tagName].push(domain);
      await tags.setValue(allTags);
    }
    return true;
  } catch (error) {
    console.error("Error adding domain to tag:", error);
    return false;
  }
}

export async function removeDomainFromTag(tagName: string, domain: string) {
  try {
    const allTags = await tags.getValue();
    if (allTags[tagName]) {
      allTags[tagName] = allTags[tagName].filter(d => d !== domain);
      await tags.setValue(allTags);
    }
    return true;
  } catch (error) {
    console.error("Error removing domain from tag:", error);
    return false;
  }
}

export async function getTagsForDomain(domain: string) {
  try {
    const allTags = await tags.getValue();
    return Object.keys(allTags).filter(tagName => 
      allTags[tagName].includes(domain)
    );
  } catch (error) {
    console.error("Error getting tags for domain:", error);
    return [];
  }
}