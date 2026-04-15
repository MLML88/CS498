import { record, dailyData } from "./popup/services/Time";
import { tags } from "./popup/services/Tag";
import { alarms } from "./popup/services/Alarm";
import { iconButton } from "@material-tailwind/react";
import { getBlacklist } from "./popup/services/Blacklist"

type TimeMap = Record<string, number>

let activeTabId: number | null = null
let activeUrl: string | null = null
let startTime: number | null = null
let windowFocused = true

// Helper function to get today's date key in YYYY-MM-DD format using UTC
export function getDateKey(timestamp?: number): string {
  const date = new Date(timestamp || Date.now())
  return date.toISOString().split('T')[0]
}

//Normalize URL (modify this to get the url we want to display)
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

//Save accumulated time to storage
async function saveTime(url: string, duration: number) {
  if (!url || duration <= 0) return

  const key = normalizeUrl(url)
  const dateKey = getDateKey()

  // Update aggregated time (all-time)
  const allTimeData = await record.getValue()
  allTimeData[key] = (allTimeData[key] || 0) + duration
  await record.setValue(allTimeData)

  // Update daily data
  const allDailyData = await dailyData.getValue()
  if (!allDailyData[dateKey]) {
    allDailyData[dateKey] = {}
  }
  allDailyData[dateKey][key] = (allDailyData[dateKey][key] || 0) + duration
  await dailyData.setValue(allDailyData)

  // Update alarms if any match the domain
  const allAlarms = await alarms.getValue();
  for (const [alarmId, alarm] of Object.entries(allAlarms)) {
    if (alarm.domain === key) {
      allAlarms[alarmId].currentTime += duration;
    }
  }
  await alarms.setValue(allAlarms);

}

//Stop tracking current tab
async function stopTracking() {
  if (!startTime && !activeUrl) return

  const duration = Date.now() - startTime

  if (duration <= 0 || duration > 1000 * 60 * 60 * 12) {
    startTime = null
    return
  }

  await saveTime(activeUrl, duration)

  startTime = null
  activeUrl = null
}

//Start tracking new tab
async function startTrackingCurrentTab() {
  if (!windowFocused) return

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })

  if (!tab?.id || !tab.url) return

  //Ignore chrome internal pages or blacklisted pages
  const blacklist = await getBlacklist()
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("about:blank") || blacklist.includes(normalizeUrl(tab.url))) return

  activeTabId = tab.id
  activeUrl = tab.url
  startTime = Date.now()
}

async function init() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })

  if (tab?.id) {
    await startTrackingCurrentTab()
  }

  // Initialize default tags on first run
  const existingTags = await tags.getValue()
  if (Object.keys(existingTags).length === 0) {
    const defaultTags: Record<string, string[]> = {
      "Work": ["linkedin.com", "github.com", "stackoverflow.com"],
      "Social": ["facebook.com", "twitter.com", "instagram.com"],
      "Entertainment": ["youtube.com", "netflix.com"],
      "Productivity": ["notion.so", "trello.com", "slack.com"],
    }
    await tags.setValue(defaultTags)
  }
}

export default defineBackground(() => {

  //When active tab changes
  chrome.tabs.onActivated.addListener(async () => {
    windowFocused = true
    await stopTracking()
    await startTrackingCurrentTab()
  })

  //When tab URL changes (navigation)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status == 'complete' && tab.status == 'complete') {
      if (tabId === activeTabId && changeInfo.url) {
        windowFocused = true
        await stopTracking()
        await startTrackingCurrentTab()

      } else { //URL changing from new tab
        windowFocused = true
        await startTrackingCurrentTab()
      }
    }
  })

  //When window focus changes
  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      //Window lost focus
      windowFocused = false
      await stopTracking()
    } else {
      //Window gained focus
      windowFocused = true
      if (activeTabId !== null) {
        await startTrackingCurrentTab()
      }
    }
  })

  //Cleanup if tab closes
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (tabId === activeTabId) {
      await stopTracking()
      activeTabId = null
      activeUrl = null
    }
  })

   // Create alert if current time exceeds alarm duration
  setInterval(async () => {
    const allAlarms = await alarms.getValue();

    for (const [alarmId, alarm] of Object.entries(allAlarms)) {
      if (alarm.currentTime >= alarm.duration) {
        // Create alert or notification here
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("alarm.png"),
          title: "Time Tracker Alarm",
          message: `You've spent ${Math.floor(alarm.currentTime / 3600000)}h ${Math.floor((alarm.currentTime % 3600000) / 60000)}m on ${alarm.domain}, which exceeds your set duration!`
        });

        // delete the alarm after triggering
        delete allAlarms[alarmId];
        await alarms.setValue(allAlarms);
      }
    }
  }, 1000); // Check every second

  init();
});
