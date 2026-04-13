export const blacklist = storage.defineItem<string[]>('local:blacklist', {
  fallback: [],
})

export async function getBlacklist() {
  try {
    const data = await blacklist.getValue()
    return data
  } catch (error) {
    console.error("Error getting blacklist:", error)
    return []
  }
}

export async function addToBlacklist(domain: string) {
  try {
    const currentBlacklist = await blacklist.getValue()
    if (!currentBlacklist.includes(domain)) {
      await blacklist.setValue([...currentBlacklist, domain])
    }
  } catch (error) {
    console.error("Error adding domain to blacklist:", error)
  }
}

export async function removeFromBlacklist(domain: string) {
  try {
    const currentBlacklist = await blacklist.getValue()
    const updatedBlacklist = currentBlacklist.filter(d => d !== domain)
    await blacklist.setValue(updatedBlacklist)
  } catch (error) {
    console.error("Error removing domain from blacklist:", error)
  }
}