import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActiveSessionState,
  Session,
  SessionStatus,
  calculateDuration,
  completeSession,
  createActiveSessionState,
  createSession,
} from "./session";

const SESSIONS_KEY = "sessions";
const ACTIVE_SESSION_KEY = "activeSession";

const VALID_STATUSES: SessionStatus[] = ["active", "completed"];

type PersistedSession = Omit<Session, "startDateTime" | "endDateTime"> & {
  startDateTime: string;
  endDateTime: string | null;
};

type PersistedActiveState = {
  current: PersistedSession | null;
};

const isValidStatus = (status: unknown): status is SessionStatus =>
  typeof status === "string" && VALID_STATUSES.includes(status as SessionStatus);

const serializeSession = (session: Session): PersistedSession => ({
  ...session,
  startDateTime: session.startDateTime.toISOString(),
  endDateTime: session.endDateTime?.toISOString() ?? null,
});

const deserializeSession = (session: PersistedSession): Session => ({
  ...session,
  startDateTime: new Date(session.startDateTime),
  endDateTime: session.endDateTime ? new Date(session.endDateTime) : null,
});

const validatePersistedSession = (candidate: any): candidate is PersistedSession => {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const {
    id,
    sessionNumber,
    startDateTime,
    endDateTime,
    duration,
    experience,
    status,
  } = candidate as Record<string, unknown>;

  if (typeof id !== "string" || !id.trim()) {
    return false;
  }

  if (typeof sessionNumber !== "number" || Number.isNaN(sessionNumber)) {
    return false;
  }

  if (typeof startDateTime !== "string" || !startDateTime) {
    return false;
  }

  if (endDateTime !== null && typeof endDateTime !== "string") {
    return false;
  }

  if (typeof duration !== "number" || duration < 0) {
    return false;
  }

  if (typeof experience !== "string") {
    return false;
  }

  if (!isValidStatus(status)) {
    return false;
  }

  return true;
};

const safeParse = <T>(data: string | null, validator: (value: any) => value is T): T | null => {
  if (!data) {
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    if (validator(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse persisted data", error);
  }

  return null;
};

const safeParseArray = <T>(
  data: string | null,
  validator: (value: any) => value is T
): T[] => {
  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter(validator);
    }
  } catch (error) {
    console.warn("Failed to parse persisted array", error);
  }

  return [];
};

const persistSessions = async (sessions: Session[]): Promise<void> => {
  const serialized = sessions.map(serializeSession);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(serialized));
};

const persistActiveSession = async (session: Session | null): Promise<void> => {
  const activeState: PersistedActiveState = {
    current: session ? serializeSession(session) : null,
  };
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeState));
};

const loadActiveState = async (): Promise<ActiveSessionState> => {
  const stored = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  const parsed = safeParse<PersistedActiveState>(stored, (value): value is PersistedActiveState => {
    if (!value || typeof value !== "object") {
      return false;
    }

    const record = value as Record<string, unknown>;
    if (!record.hasOwnProperty("current")) {
      return false;
    }

    if (record.current === null) {
      return true;
    }

    return validatePersistedSession(record.current);
  });

  if (!parsed) {
    return createActiveSessionState();
  }

  return {
    current: parsed.current ? deserializeSession(parsed.current) : null,
  };
};

const buildSessionValidator = () => validatePersistedSession;

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    const parsed = safeParseArray<PersistedSession>(stored, buildSessionValidator());
    return parsed.map(deserializeSession);
  } catch (error) {
    console.error("Failed to load sessions", error);
    return [];
  }
};

export const getActiveSession = async (): Promise<Session | null> => {
  try {
    const activeState = await loadActiveState();
    return activeState.current;
  } catch (error) {
    console.error("Failed to load active session", error);
    return null;
  }
};

export const saveSession = async (session: Session): Promise<void> => {
  if (session.status !== "completed" || !session.endDateTime) {
    throw new Error("Only completed sessions with an end time can be saved.");
  }

  try {
    const sessions = await getAllSessions();
    await persistSessions([...sessions, session]);
  } catch (error) {
    console.error("Failed to save session", error);
    throw error;
  }
};

const generateSessionId = (): string => `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getNextSessionNumber = (sessions: Session[]): number => {
  if (!sessions.length) {
    return 1;
  }

  return sessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) + 1;
};

export const startNewSession = async (): Promise<Session> => {
  const active = await getActiveSession();
  if (active) {
    throw new Error("An active session is already in progress.");
  }

  const sessions = await getAllSessions();
  const session = createSession({
    id: generateSessionId(),
    sessionNumber: getNextSessionNumber(sessions),
    startDateTime: new Date(),
    status: "active",
  });

  await persistActiveSession(session);
  return session;
};

export const stopSession = async (
  sessionId: string,
  experienceText: string
): Promise<Session> => {
  const active = await getActiveSession();

  if (!active || active.id !== sessionId) {
    throw new Error("No matching active session found to stop.");
  }

  const trimmedExperience = experienceText.trim();
  const endDateTime = new Date();
  const completed = completeSession(active, endDateTime, trimmedExperience);

  if (completed.duration <= 0) {
    completed.duration = calculateDuration(
      completed.startDateTime,
      completed.endDateTime
    );
  }

  await persistActiveSession(null);
  await saveSession(completed);
  return completed;
};

export const getTotalDurationMs = async (): Promise<number> => {
  const sessions = await getAllSessions();
  return sessions.reduce((acc, session) => acc + session.duration, 0);
};

export const updateSessionExperience = async (
  sessionId: string,
  experienceText: string
): Promise<Session | null> => {
  const trimmedExperience = experienceText.trim();
  const sessions = await getAllSessions();
  let updatedSession: Session | null = null;

  const updated = sessions.map((session) => {
    if (session.id === sessionId) {
      updatedSession = {
        ...session,
        experience: trimmedExperience,
      };
      return updatedSession;
    }
    return session;
  });

  if (!updatedSession) {
    return null;
  }

  await persistSessions(updated);
  return updatedSession;
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const sessions = await getAllSessions();
  const filtered = sessions.filter((session) => session.id !== sessionId);

  if (filtered.length === sessions.length) {
    return false;
  }

  await persistSessions(filtered);
  return true;
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([SESSIONS_KEY, ACTIVE_SESSION_KEY]);
  } catch (error) {
    console.error("Failed to clear session data", error);
    throw error;
  }
};
