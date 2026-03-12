const record = storage.defineItem<Record<string, number>>('local:timeData', {
  fallback: {},
})

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

    // const data = await chrome.storage.local.get("timeData");
    const data = await record.getValue();
    const timeData: TimeMap = data.timeData || {};

    timeData[key] = (timeData[key] || 0) + duration;

    // await chrome.storage.local.set({ timeData });
    await record.setValue({ timeData });

    console.log("Saving time:", key, duration);
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