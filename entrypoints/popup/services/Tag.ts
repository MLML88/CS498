export const tags = storage.defineItem<Record<string, string[]>>('local:tags', {
  fallback: {},
})

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