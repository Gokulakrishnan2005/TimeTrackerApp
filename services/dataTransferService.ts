import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { getData, storeData } from "./LocalStorage";
import financeService, { Transaction } from "./financeService";
import { getAllSessions, getActiveSession } from "./sessionStorage";
import { Session, SessionStatus } from "./session";

// Expo's StorageAccessFramework helpers are only available on Android.
const StorageAccessFramework: any = (FileSystem as any).StorageAccessFramework;

const getDocumentDirectory = (): string | null =>
  ((FileSystem as any).documentDirectory as string | null | undefined) ?? null;

const getCacheDirectory = (): string | null =>
  ((FileSystem as any).cacheDirectory as string | null | undefined) ?? null;

const resolveWritableDirectory = (): { base: string; source: "document" | "cache" } => {
  try {
    const documentDir = getDocumentDirectory();
    if (documentDir) {
      return { base: documentDir, source: "document" };
    }
  } catch (err) {
    console.warn('Document directory not available:', err);
  }
  
  try {
    const cacheDir = getCacheDirectory();
    if (cacheDir) {
      return { base: cacheDir, source: "cache" };
    }
  } catch (err) {
    console.warn('Cache directory not available:', err);
  }
  
  // Last resort: use a relative path that works in most environments
  if (Platform.OS === 'web') {
    throw new Error(
      "Export/Import is not available on web. Please use the mobile app."
    );
  }
  
  throw new Error(
    "Storage unavailable. Please grant storage permissions in your device settings and restart the app."
  );
};

const BACKUP_DIRECTORY_KEY = "backup_directory_uri";

const getStoredDirectoryUri = async (): Promise<string | null> => {
  const stored = await getData(BACKUP_DIRECTORY_KEY);
  if (stored && typeof stored.uri === "string" && stored.uri.trim().length > 0) {
    return stored.uri;
  }
  return null;
};

const persistDirectoryUri = async (uri: string) => {
  await storeData(BACKUP_DIRECTORY_KEY, { uri });
};

const ensureBackupDirectoryUri = async (): Promise<string | null> => {
  if (Platform.OS !== "android" || !StorageAccessFramework) {
    return null;
  }

  const existing = await getStoredDirectoryUri();
  if (existing) {
    return existing;
  }

  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (permissions.granted && permissions.directoryUri) {
    await persistDirectoryUri(permissions.directoryUri);
    return permissions.directoryUri;
  }

  return null;
};

const createFileInDirectory = async (directoryUri: string, fileName: string, mimeType: string = 'text/csv'): Promise<string> => {
  if (!StorageAccessFramework) {
    throw new Error("Storage framework unavailable on this platform.");
  }

  try {
    return await StorageAccessFramework.createFileAsync(directoryUri, fileName, mimeType);
  } catch (error: any) {
    if (error?.message?.includes("EEXIST")) {
      const timestamp = Date.now();
      const extension = fileName.split('.').pop();
      return await StorageAccessFramework.createFileAsync(
        directoryUri,
        `${fileName.replace(`.${extension}`, "")}_${timestamp}.${extension}`,
        mimeType
      );
    }
    throw error;
  }
};

const pickLatestBackupUri = async (directoryUri: string): Promise<string | null> => {
  if (!StorageAccessFramework) {
    return null;
  }

  try {
    const entries: string[] = await StorageAccessFramework.readDirectoryAsync(directoryUri);
    const jsonFiles = entries
      .filter((uri) => uri.endsWith(".json"))
      .map((uri) => ({
        uri,
        name: uri.split("/").pop() ?? uri,
      }))
      .filter((entry) => entry.name.startsWith("timeTracker_backup_"))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (jsonFiles.length === 0) {
      return null;
    }

    return jsonFiles[jsonFiles.length - 1].uri;
  } catch (error) {
    console.warn("Failed to read backup directory", error);
    return null;
  }
};

const PROFILE_STORAGE_KEY = "profile_data";
const FINANCE_STORAGE_KEY = "financeEntries";
const SESSION_STORAGE_KEYS = {
  sessions: "sessions_all",
  active: "sessions_active",
  meta: "sessions_metadata",
};

export interface ProfileRecord {
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

interface SerializedSession {
  id: string;
  sessionNumber: number;
  startDateTime: string;
  endDateTime: string | null;
  duration: number;
  experience: string;
  status: SessionStatus;
}

interface BackupPayload {
  profile: ProfileRecord | null;
  sessions: SerializedSession[];
  activeSession: SerializedSession | null;
  metadata: {
    lastSessionNumber: number;
  };
  transactions: Transaction[];
}

export interface ExportResult {
  uri: string;
  fileName: string;
  savedLocally: boolean;
  sessionsCount: number;
  transactionsCount: number;
}

export interface ImportResult {
  uri: string;
  profile: ProfileRecord | null;
  sessionsImported: number;
  transactionsImported: number;
  activeSessionRestored: boolean;
}

export const exportAppData = async (): Promise<ExportResult> => {
  const profile = (await getData(PROFILE_STORAGE_KEY)) as ProfileRecord | null;
  const taskData = await taskService.getAllData();

  const payload = {
    profile: profile ?? null,
    ...taskData,
  };

  const json = JSON.stringify(payload, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `timeTracker_backup_${timestamp}.json`;

  if (Platform.OS === "android" && StorageAccessFramework) {
    try {
      const directoryUri = await ensureBackupDirectoryUri();
      if (directoryUri) {
        const createdUri = await createFileInDirectory(directoryUri, fileName, 'application/json');
        await FileSystem.writeAsStringAsync(createdUri, json);
        return {
          uri: createdUri,
          fileName,
          savedLocally: false,
          sessionsCount: payload.tasks.length,
          transactionsCount: 0, // This needs to be updated
        };
      }
    } catch (error) {
      console.warn("StorageAccessFramework export failed", error);
    }
  }

  let directoryInfo;
  try {
    directoryInfo = resolveWritableDirectory();
  } catch (error: any) {
    throw new Error(
      error?.message ?? "Unable to determine a writable directory for export."
    );
  }

  const uri = `${directoryInfo.base}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, csv);

  return {
    uri,
    fileName,
    savedLocally: true,
    sessionsCount: payload.sessions.length,
    transactionsCount: payload.transactions.length,
  };
};

export const importAppData = async (): Promise<ImportResult> => {
  let fileUri: string | null = null;

  if (Platform.OS === "android" && StorageAccessFramework) {
    try {
      const directoryUri = await ensureBackupDirectoryUri();
      if (directoryUri) {
        const latest = await pickLatestBackupUri(directoryUri);
        if (latest) {
          fileUri = latest;
        } else {
          fileUri = await StorageAccessFramework.openDocumentAsync("application/json");
        }
      } else {
        fileUri = await StorageAccessFramework.openDocumentAsync("application/json");
      }
      if (!fileUri) {
        throw new Error("Import cancelled");
      }
    } catch (error: any) {
      if (error?.message?.includes("Documents service is not available")) {
        throw new Error("Storage access is unavailable on this device.");
      }
      throw new Error(error?.message ?? "Import cancelled");
    }
  }

  if (!fileUri) {
    let directoryInfo;
    try {
      directoryInfo = resolveWritableDirectory();
    } catch (error: any) {
      throw new Error(
        error?.message ??
          "Import requires storage access. Export data first so a local backup is available, then retry."
      );
    }

    const entries = await FileSystem.readDirectoryAsync(directoryInfo.base);
    const candidates = entries
      .filter((name) => name.endsWith(".json") && name.startsWith("timeTracker_backup_"))
      .sort();

    if (candidates.length === 0) {
      throw new Error(
        "No backup JSON found. Export your data first, then retry the import."
      );
    }

    fileUri = `${directoryInfo.base}${candidates[candidates.length - 1]}`;
  }

  const contents = await FileSystem.readAsStringAsync(fileUri);
  const restored = JSON.parse(contents);

  await persistRestoredData(restored);

  return {
    uri: fileUri,
    profile: restored.profile,
    sessionsImported: restored.tasks.length,
    transactionsImported: 0,
    activeSessionRestored: false,
  };
};

const persistRestoredData = async (payload: any) => {
  if (payload.profile) {
    await storeData(PROFILE_STORAGE_KEY, payload.profile);
  }
  if (payload.habits) {
    await storeData('habits', payload.habits);
  }
  if (payload.tasks) {
    await storeData('tasks', payload.tasks);
  }
  if (payload.goals) {
    await storeData('goals', payload.goals);
  }
  if (payload.unfinishedTasks) {
    await storeData('unfinished_tasks', payload.unfinishedTasks);
  }
  if (payload.unfinishedGoals) {
    await storeData('unfinished_goals', payload.unfinishedGoals);
  }
};

const serializeSession = (session: Session): SerializedSession => ({
  id: session.id,
  sessionNumber: session.sessionNumber,
  startDateTime: session.startDateTime.toISOString(),
  endDateTime: session.endDateTime ? session.endDateTime.toISOString() : null,
  duration: session.duration,
  experience: session.experience,
  status: session.status,
});

