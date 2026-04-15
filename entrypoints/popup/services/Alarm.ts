export interface Alarm {
  domain: string;
  currentTime: number;
  duration: number;
}

export const alarms = storage.defineItem<Record<string, Alarm>>('local:alarms', {
  fallback: {},
});

export async function getAllAlarms() {
  try {
    const data = await alarms.getValue();
    return data;
  } catch (error) {
    console.error("Error getting alarms:", error);
    return [];
  }
}

export async function createAlarm(alarmId: string, alarm: Alarm) {
  try {
    const allAlarms = await alarms.getValue();
    if (!allAlarms[alarmId]) {
      allAlarms[alarmId] = alarm;
      await alarms.setValue(allAlarms);
    }
    return true;
  } catch (error) {
    console.error("Error adding alarm:", error);
    return false;
  }
}

export async function deleteAlarm (alarmId: string) {
  try {
      const allAlarms = await alarms.getValue();
      delete allAlarms[alarmId];
      await alarms.setValue(allAlarms);
      return true;
    } catch (error) {
      console.error("Error deleting alarm:", error);
      return false;
    }
}