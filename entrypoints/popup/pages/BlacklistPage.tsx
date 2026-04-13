import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

import { getBlacklist, addToBlacklist, removeFromBlacklist } from "../services/Blacklist"
import { getAllDailyData } from "../services/Time"
import { getDateKey } from "../../background"
import { record, dailyData } from "../services/Time"

function BlacklistPage() {
  const navigate = useNavigate()

  const [searchDomain, setSearchDomain] = useState("")
  const [searchBlacklist, setSearchBlacklist] = useState("")
  const [availableDomains, setAvailableDomains] = useState<string[]>([])
  const [blacklist, setBlacklist] = useState<string[]>([])

  useEffect(() => {
    const fetchDomainsAndBlacklist = async () => {
      const blacklist = await getBlacklist()
      const allDailyData = await getAllDailyData()

      const domains = Object.keys(allDailyData).flatMap(dateKey =>
        Object.keys(allDailyData[dateKey])
      )
      const uniqueDomains = [...new Set(domains)].sort()

      setAvailableDomains(uniqueDomains)
      setBlacklist(blacklist)
    }

    fetchDomainsAndBlacklist()
  }, [])

  const handleAdd = async (domain: string) => {
    await addToBlacklist(domain)
    setSearchDomain("")
    setAvailableDomains(prev => prev.filter(d => d !== domain))
    setBlacklist(prev => [...prev, domain])

    const dateKey = getDateKey()

    // Update aggregated time (all-time)
    const allTimeData = await record.getValue()
    delete allTimeData[domain]
    await record.setValue(allTimeData)

    // Update daily data
    const allDailyData = await dailyData.getValue()
    if (!allDailyData[dateKey]) {
      allDailyData[dateKey] = {}
    }
    delete allDailyData[dateKey][domain]
    await dailyData.setValue(allDailyData)

    console.log(`Added ${domain} to blacklist`)
  }

  const handleRemove = async (domain: string) => {
    await removeFromBlacklist(domain)
    setSearchBlacklist("")
    setBlacklist(prev => prev.filter(d => d !== domain))
    if (!availableDomains.includes(domain)) {
      setAvailableDomains(prev => [...prev, domain].sort())
    }

    const dateKey = getDateKey()

    // Update aggregated time (all-time)
    const allTimeData = await record.getValue()
    allTimeData[domain] = 0
    await record.setValue(allTimeData)

    // Update daily data
    const allDailyData = await dailyData.getValue()
    if (!allDailyData[dateKey]) {
      allDailyData[dateKey] = {}
    }
    allDailyData[dateKey][domain] = 0
    await dailyData.setValue(allDailyData)

    console.log(`Removed ${domain} from blacklist`)
  }

  const filteredDomains = availableDomains.filter(domain =>
    domain.toLowerCase().includes(searchDomain.toLowerCase()) &&
    !blacklist.includes(domain)
  )

  const filteredBlacklist = blacklist.filter(domain =>
    domain.toLowerCase().includes(searchBlacklist.toLowerCase())
  )

  return (
    <div className="relative p-4 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md w-[700px] h-[550px] flex flex-col">
      {/* Title */}
      <div className="pb-2 mb-4 border-b border-black dark:border-gray-700">
        <h1 className="text-xl font-semibold text-black dark:text-white">
          Manage Blacklist
        </h1>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Add Domain to Blacklist */}
        <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 shadow flex flex-col overflow-hidden">
          <h2 className="font-semibold mb-2 text-black dark:text-white">
            Add Domain to Blacklist
          </h2>

          <input
            type="text"
            placeholder="Search domains..."
            value={searchDomain}
            onChange={(e) => setSearchDomain(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600 rounded-t mb-2 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
          />

          <div className="flex-1 overflow-y-auto">
            {filteredDomains.length === 0 ? (
              <p className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                Currently no available domains
              </p>
            ) : (
              filteredDomains.map((domain) => (
                <div
                  key={domain}
                  className="flex justify-between items-center w-full px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 rounded"
                >
                  <span>{domain}</span>
                  <button
                    onClick={() => handleAdd(domain)}
                    className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-1 px-4 rounded text-xs"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Blacklist */}
        <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 shadow flex flex-col overflow-hidden">
          <h2 className="font-semibold mb-2 text-black dark:text-white">
            Currently Blacklisted
          </h2>

          <input
            type="text"
            placeholder="Search domains..."
            value={searchBlacklist}
            onChange={(e) => setSearchBlacklist(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600 rounded-t mb-2 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
          />

          <div className="flex-1 overflow-y-auto">
            {filteredBlacklist.length === 0 ? (
              <p className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                Currently no blacklisted domains
              </p>
            ) : (
              filteredBlacklist.map((domain) => (
                <div
                  key={domain}
                  className="flex justify-between items-center w-full px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 rounded"
                >
                  <span>{domain}</span>
                  <button
                    onClick={() => handleRemove(domain)}
                    className="bg-red-500 hover:bg-red-400 text-white font-bold py-1 px-2 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Back Button */}
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

export default BlacklistPage