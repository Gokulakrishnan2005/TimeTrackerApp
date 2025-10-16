import AsyncStorage from "@react-native-async-storage/async-storage";
import { TimeEntry } from "./timeEntry";

const STORAGE_KEY = "timeEntries";

type PersistedTimeEntry = Omit<TimeEntry, "startDate" | "endDate"> & {
  startDate: string;
  endDate: string;
};

const serialize = (entry: TimeEntry): PersistedTimeEntry => ({
  ...entry,
  startDate: entry.startDate.toISOString(),
  endDate: entry.endDate.toISOString(),
});

const deserialize = (entry: PersistedTimeEntry): TimeEntry => ({
  ...entry,
  startDate: new Date(entry.startDate),
  endDate: new Date(entry.endDate),
});

export async function loadTimeEntries(): Promise<TimeEntry[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  const parsed: PersistedTimeEntry[] = JSON.parse(stored);
  return parsed.map(deserialize);
}

export async function saveTimeEntries(entries: TimeEntry[]): Promise<void> {
  const serialized = entries.map(serialize);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

export async function addTimeEntry(entry: TimeEntry): Promise<TimeEntry[]> {
  const entries = await loadTimeEntries();
  const updated = [...entries, entry];
  await saveTimeEntries(updated);
  return updated;
}

export async function updateTimeEntry(entry: TimeEntry): Promise<TimeEntry[]> {
  const entries = await loadTimeEntries();
  const updated = entries.map((existing) =>
    existing.id === entry.id ? entry : existing
  );
  await saveTimeEntries(updated);
  return updated;
}

export async function removeTimeEntry(id: string): Promise<TimeEntry[]> {
  const entries = await loadTimeEntries();
  const updated = entries.filter((entry) => entry.id !== id);
  await saveTimeEntries(updated);
  return updated;
}

export async function clearTimeEntries(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
