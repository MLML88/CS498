export const record = storage.defineItem<Record<string, number>>('local:allTimeData', {
  fallback: {},
})

export const dailyData = storage.defineItem<Record<string, Record<string, number>>>('local:dailyData', {
  fallback: {},
})

//return the total time spent on a URL in seconds
export async function getTimeForUrl(url: string): Promise<number> {
  function normalizeUrl(url: string): string {
    try {
      const u = new URL(url)
      u.hash = ""
      return u.toString()
    } catch {
      return url
    }
  }

  type TimeMap = Record<string, number>
  const key = normalizeUrl(url)
  const data = await chrome.storage.local.get("allTimeData")
  const allTimeData: TimeMap = data.allTimeData || {}
  return (allTimeData[key] || 0) / 1000
}

// Get daily data for a specific date
export async function getDailyData(dateKey: string) {
  try {
    const allDailyData = await dailyData.getValue()
    return allDailyData[dateKey] || {}
  } catch (error) {
    console.error("Error getting daily data:", error)
    return {}
  }
}

// Get all daily data
export async function getAllDailyData() {
  try {
    const data = await dailyData.getValue()
    return data
  } catch (error) {
    console.error("Error getting all daily data:", error)
    return {}
  }
}

// Delete all data
export async function deleteAllData() {
    try {
        record.setValue({})
        dailyData.setValue({})
        return true
    } catch (error) {
        console.error("Error deleting all data: ", error)
        return false
    }
}