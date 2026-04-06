import { storage } from 'wxt/storage';

interface Warning {
  domain: string;
  currentTime: number; // in milliseconds
  duration: number; // in milliseconds
}

export const warningsStorage = storage.defineItem<Warning[]>('local:warnings', {
  fallback: [],
});

// Create a new warning and save it to storage
export async function addWarning(domain: string, currentTime: number, duration: number) {
  const warnings = await warningsStorage.getValue();
  warnings.push({ domain, currentTime, duration });
  await warningsStorage.setValue(warnings);
}

// Get all warnings from storage
export async function getWarnings(): Promise<Warning[]> {
  return await warningsStorage.getValue();
}

