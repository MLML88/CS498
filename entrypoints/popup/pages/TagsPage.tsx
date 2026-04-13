import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

import { getAllDailyData } from "../services/Time"
import { addDomainToTag, createTag, deleteTag, getAllTags, removeDomainFromTag } from "../services/Tag"

function TagsPage() {
  const navigate = useNavigate()
  const [tags, setTags] = useState<Record<string, string[]>>({})
  const [newTagName, setNewTagName] = useState("")
  const [expandedTag, setExpandedTag] = useState<string | null>(null)
  const [availableDomains, setAvailableDomains] = useState<string[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchTagsAndDomains = async () => {
      const allTags = await getAllTags()
      setTags(allTags)

      // Get available domains from dailyData
      const allDailyData = await getAllDailyData()
      const domains = Object.keys(allDailyData).flatMap(dateKey =>
        Object.keys(allDailyData[dateKey])
      )
      // Remove duplicates and sort
      const uniqueDomains = [...new Set(domains)].sort()
      setAvailableDomains(uniqueDomains)
    }
    fetchTagsAndDomains()
  }, [])

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    await createTag(newTagName)
    const allTags = await getAllTags()
    setTags(allTags)
    setNewTagName("")
  }

  const handleDeleteTag = async (tagName: string) => {
    await deleteTag(tagName)
    const allTags = await getAllTags()
    setTags(allTags)
  }

  const handleAddDomainToTag = async (tagName: string, domain: string) => {
    await addDomainToTag(tagName, domain)
    const allTags = await getAllTags()
    setTags(allTags)
    setOpenDropdown(null)
    setSearchTerm("")
  }

  const filteredDomains = availableDomains.filter(domain =>
    domain.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !tags[openDropdown || ""]?.includes(domain)
  )

  return (
    <div className="relative p-4 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md w-[700px] h-[550px] flex flex-col text-black dark:text-white">
      <div className="pb-2 mb-4 border-b border-black dark:border-gray-700">
        <h1 className="text-xl font-semibold text-black dark:text-white">
          WebTrack
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Existing Tags */}
        <div>
          <h2 className="font-semibold mb-3 text-black dark:text-white">
            Tags ({Object.keys(tags).length})
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded shadow p-3 mb-3 divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-700">
            {Object.keys(tags).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No tags created yet
              </p>
            ) : (
              Object.keys(tags).map((tagName) => (
                <div key={tagName} className="p-3">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() =>
                        setExpandedTag(
                          expandedTag === tagName ? null : tagName
                        )
                      }
                      className="font-semibold text-left flex-1 cursor-pointer text-black dark:text-white hover:text-blue-600"
                    >
                      {tagName} ({tags[tagName].length})
                    </button>

                    <div className="flex gap-2 relative">
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === tagName ? null : tagName
                          )
                        }
                        className="bg-green-500 hover:bg-green-400 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Add Domain
                      </button>

                      <button
                        onClick={() => handleDeleteTag(tagName)}
                        className="bg-red-500 hover:bg-red-400 text-white font-bold py-1 px-3 rounded text-xs"
                      >
                        Delete
                      </button>

                      {/* Domain Dropdown */}
                      {openDropdown === tagName && (
                        <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-10 w-48">
                          <input
                            type="text"
                            placeholder="Search domains..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600 rounded-t bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            autoFocus
                          />

                          <div className="max-h-48 overflow-y-auto">
                            {filteredDomains.length === 0 ? (
                              <p className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                                No domains available
                              </p>
                            ) : (
                              filteredDomains.map((domain) => (
                                <button
                                  key={domain}
                                  onClick={() =>
                                    handleAddDomainToTag(tagName, domain)
                                  }
                                  className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                                >
                                  {domain}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedTag === tagName && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                      {tags[tagName].length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                          No domains in this tag
                        </p>
                      ) : (
                        <ul className="list-disc list-inside">
                          {tags[tagName].map((domain) => (
                            <li
                              key={domain}
                              className="text-gray-700 dark:text-gray-200 flex justify-between items-center"
                            >
                              <span>{domain}</span>

                              <button
                                onClick={() =>
                                  removeDomainFromTag(
                                    tagName,
                                    domain
                                  ).then(async () => {
                                    const allTags = await getAllTags()
                                    setTags(allTags)
                                  })
                                }
                                className="text-red-500 hover:text-red-700 text-xs font-semibold ml-2"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create New Tag */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 shadow">
          <h2 className="font-semibold mb-2 text-black dark:text-white">
            Create New Tag
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g., Work, Social)"
              maxLength={48}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              onKeyPress={(e) =>
                e.key === "Enter" && handleCreateTag()
              }
            />

            <button
              onClick={handleCreateTag}
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

export default TagsPage