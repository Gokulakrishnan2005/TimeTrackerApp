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
  const documentDir = getDocumentDirectory();
  if (documentDir) {
    return { base: documentDir, source: "document" };
  }
  const cacheDir = getCacheDirectory();
  if (cacheDir) {
    return { base: cacheDir, source: "cache" };
  }
  throw new Error(
    "Storage unavailable. Please ensure the app has permission to access local storage, then try again."
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

const createFileInDirectory = async (directoryUri: string, fileName: string): Promise<string> => {
  if (!StorageAccessFramework) {
    throw new Error("Storage framework unavailable on this platform.");
  }

  try {
    return await StorageAccessFramework.createFileAsync(directoryUri, fileName, "text/csv");
  } catch (error: any) {
    if (error?.message?.includes("EEXIST")) {
      const timestamp = Date.now();
      return await StorageAccessFramework.createFileAsync(
        directoryUri,
        `${fileName.replace(/\.csv$/, "")}_${timestamp}.csv`,
        "text/csv"
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
    const csvFiles = entries
      .filter((uri) => uri.endsWith(".csv"))
      .map((uri) => ({
        uri,
        name: uri.split("/").pop() ?? uri,
      }))
      .filter((entry) => entry.name.startsWith("timeTracker_backup_"))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (csvFiles.length === 0) {
      return null;
    }

    return csvFiles[csvFiles.length - 1].uri;
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

export const exportAppDataToCsv = async (): Promise<ExportResult> => {
  const profile = (await getData(PROFILE_STORAGE_KEY)) as ProfileRecord | null;
  const sessions = await getAllSessions();
  const activeSession = await getActiveSession();
  const metadataRaw = (await getData(SESSION_STORAGE_KEYS.meta)) ?? {};
  const metadata = {
    lastSessionNumber:
      typeof metadataRaw?.lastSessionNumber === "number"
        ? metadataRaw.lastSessionNumber
        : sessions.length,
  };
  const transactions = await financeService.getTransactions();

  const payload: BackupPayload = {
    profile: profile ?? null,
    sessions: sessions.map(serializeSession),
    activeSession: activeSession ? serializeSession(activeSession) : null,
    metadata,
    transactions,
  };

  const csv = buildCsv(payload);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `timeTracker_backup_${timestamp}.csv`;

  if (Platform.OS === "android" && StorageAccessFramework) {
    try {
      const directoryUri = await ensureBackupDirectoryUri();
      if (directoryUri) {
        const createdUri = await createFileInDirectory(directoryUri, fileName);
        await FileSystem.writeAsStringAsync(createdUri, csv);
        return {
          uri: createdUri,
          fileName,
          savedLocally: false,
          sessionsCount: payload.sessions.length,
          transactionsCount: payload.transactions.length,
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

export const importAppDataFromCsv = async (): Promise<ImportResult> => {
  let fileUri: string | null = null;

  if (Platform.OS === "android" && StorageAccessFramework) {
    try {
      const directoryUri = await ensureBackupDirectoryUri();
      if (directoryUri) {
        const latest = await pickLatestBackupUri(directoryUri);
        if (latest) {
          fileUri = latest;
        } else {
          // No backup found in granted directory; allow manual selection.
          fileUri = await StorageAccessFramework.openDocumentAsync("text/*");
        }
      } else {
        fileUri = await StorageAccessFramework.openDocumentAsync("text/*");
      }
      if (!fileUri) {
        throw new Error("Import cancelled");
      }
    } catch (error: any) {
      if (error?.message?.includes("Documents service is not available")) {
        throw new Error("Storage access is unavailable on this device.");
      }
      // If the user cancels the picker, surface a friendly message.
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
      .filter((name) => name.endsWith(".csv") && name.startsWith("timeTracker_backup_"))
      .sort();

    if (candidates.length === 0) {
      throw new Error(
        "No backup CSV found. Export your data first, then retry the import."
      );
    }

    fileUri = `${directoryInfo.base}${candidates[candidates.length - 1]}`;
  }

  const contents = await FileSystem.readAsStringAsync(fileUri);

  const restored = await restoreFromCsv(contents);

  await persistRestoredData(restored);

  return {
    uri: fileUri,
    profile: restored.profile,
    sessionsImported: restored.sessions.length,
    transactionsImported: restored.transactions.length,
    activeSessionRestored: Boolean(restored.activeSession),
  };
};

const persistRestoredData = async (payload: BackupPayload) => {
  if (payload.profile) {
    await storeData(PROFILE_STORAGE_KEY, payload.profile);
  }
  await storeData(SESSION_STORAGE_KEYS.sessions, payload.sessions);
  await storeData(SESSION_STORAGE_KEYS.active, {
    current: payload.activeSession ?? null,
  });
  await storeData(SESSION_STORAGE_KEYS.meta, payload.metadata);
  await storeData(FINANCE_STORAGE_KEY, payload.transactions);
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

const buildCsv = (payload: BackupPayload): string => {
  const lines: string[] = [];

  lines.push("#PROFILE");
  lines.push("name,email,avatar,createdAt");
  if (payload.profile) {
    lines.push(
      [
        escapeCsv(payload.profile.name ?? ""),
        escapeCsv(payload.profile.email ?? ""),
        escapeCsv(payload.profile.avatar ?? ""),
        escapeCsv(payload.profile.createdAt ?? ""),
      ].join(",")
    );
  }

  lines.push("#SESSION_METADATA");
  lines.push("lastSessionNumber");
  lines.push(escapeCsv(String(payload.metadata.lastSessionNumber ?? 0)));

  lines.push("#ACTIVE_SESSION");
  lines.push("id,sessionNumber,startDateTime,endDateTime,duration,experience,status");
  if (payload.activeSession) {
    lines.push(sessionToCsvRow(payload.activeSession));
  }

  lines.push("#SESSIONS");
  lines.push("id,sessionNumber,startDateTime,endDateTime,duration,experience,status");
  payload.sessions.forEach((session) => {
    lines.push(sessionToCsvRow(session));
  });

  lines.push("#TRANSACTIONS");
  lines.push("id,type,amount,category,notes,date,createdAt,updatedAt");
  payload.transactions.forEach((transaction) => {
    lines.push(
      [
        escapeCsv(transaction.id),
        escapeCsv(transaction.type),
        escapeCsv(String(transaction.amount)),
        escapeCsv(transaction.category),
        escapeCsv(transaction.notes ?? ""),
        escapeCsv(transaction.date ?? ""),
        escapeCsv(transaction.createdAt ?? ""),
        escapeCsv(transaction.updatedAt ?? ""),
      ].join(",")
    );
  });

  return lines.join("\n");
};

const sessionToCsvRow = (session: SerializedSession): string =>
  [
    escapeCsv(session.id),
    escapeCsv(String(session.sessionNumber)),
    escapeCsv(session.startDateTime),
    escapeCsv(session.endDateTime ?? ""),
    escapeCsv(String(session.duration ?? 0)),
    escapeCsv(session.experience ?? ""),
    escapeCsv(session.status ?? ""),
  ].join(",");

const escapeCsv = (value: string): string => {
  const str = value ?? "";
  if (str.includes("\"") || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const restoreFromCsv = async (contents: string): Promise<BackupPayload> => {
  const lines = contents.split(/\r?\n/);
  let section: string | null = null;
  const payload: BackupPayload = {
    profile: null,
    sessions: [],
    activeSession: null,
    metadata: { lastSessionNumber: 0 },
    transactions: [],
  };

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    if (line.startsWith("#")) {
      section = line.replace(/^#/, "").trim().toUpperCase();
      continue;
    }
    if (section === "PROFILE") {
      if (!payload.profile) {
        const [name, email, avatar, createdAt] = parseCsvLine(line);
        payload.profile = {
          name: name ?? "Guest",
          email: email ?? "",
          avatar: avatar || undefined,
          createdAt: createdAt || undefined,
        };
      }
      continue;
    }
    if (section === "SESSION_METADATA") {
      const [lastSessionNumber] = parseCsvLine(line);
      payload.metadata.lastSessionNumber = Number(lastSessionNumber) || 0;
      continue;
    }
    if (section === "ACTIVE_SESSION") {
      if (!line.startsWith("id")) {
        const [id, sessionNumber, startDateTime, endDateTime, duration, experience, status] = parseCsvLine(line);
        if (id) {
          payload.activeSession = {
            id,
            sessionNumber: Number(sessionNumber) || 0,
            startDateTime,
            endDateTime: endDateTime || null,
            duration: Number(duration) || 0,
            experience: experience ?? "",
            status: (status as SessionStatus) || "active",
          };
        }
      }
      continue;
    }
    if (section === "SESSIONS") {
      if (line.startsWith("id")) {
        continue;
      }
      const [id, sessionNumber, startDateTime, endDateTime, duration, experience, status] = parseCsvLine(line);
      if (id) {
        payload.sessions.push({
          id,
          sessionNumber: Number(sessionNumber) || 0,
          startDateTime,
          endDateTime: endDateTime || null,
          duration: Number(duration) || 0,
          experience: experience ?? "",
          status: (status as SessionStatus) || "completed",
        });
      }
      continue;
    }
    if (section === "TRANSACTIONS") {
      if (line.startsWith("id")) {
        continue;
      }
      const [id, type, amount, category, notes, date, createdAt, updatedAt] = parseCsvLine(line);
      if (id) {
        payload.transactions.push({
          id,
          type: type === "expense" ? "expense" : "income",
          amount: Number(amount) || 0,
          category: category ?? "",
          notes: notes ?? "",
          date: date ?? new Date().toISOString(),
          createdAt: createdAt ?? date ?? new Date().toISOString(),
          updatedAt: updatedAt ?? createdAt ?? new Date().toISOString(),
        });
      }
    }
  }

  if (!payload.profile) {
    payload.profile = {
      name: "Guest",
      email: "",
      createdAt: new Date().toISOString(),
    };
  }

  if (payload.metadata.lastSessionNumber === 0) {
    payload.metadata.lastSessionNumber = payload.sessions.length;
  }

  return payload;
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
};
