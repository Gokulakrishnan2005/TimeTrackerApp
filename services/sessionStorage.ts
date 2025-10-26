import { getData, storeData } from "./LocalStorage";
import {
  ActiveSessionState,
  Session,
  SessionStatus,
  completeSession,
  createActiveSessionState,
  createSession,
} from "./session";

const STORAGE_KEYS = {
  sessions: "sessions_all",
  active: "sessions_active",
  meta: "sessions_metadata",
};

const VALID_STATUSES: SessionStatus[] = ["active", "completed"];

const ensureSessionArray = async (): Promise<Session[]> => {
  const raw = await getData(STORAGE_KEYS.sessions);
  if (Array.isArray(raw) && raw.length) {
    return raw.map(deserializeSession);
  }
  const seeded = buildSeedSessions();
  await storeData(STORAGE_KEYS.sessions, seeded.map(serializeSession));
  return seeded;
};

const deserializeSession = (payload: any): Session => {
  return createSession({
    id: payload?.id ?? generateId(),
    sessionNumber: Number(payload?.sessionNumber) || 1,
    startDateTime: payload?.startDateTime ? new Date(payload.startDateTime) : new Date(),
    endDateTime: payload?.endDateTime ? new Date(payload.endDateTime) : null,
    experience: typeof payload?.experience === "string" ? payload.experience : "",
    tag: typeof payload?.tag === "string" && payload.tag.trim().length ? payload.tag.trim() : null,
    status: payload?.status === "completed" ? "completed" : "active",
  });
};

const serializeSession = (session: Session) => ({
  ...session,
  tag: session.tag,
  startDateTime: session.startDateTime.toISOString(),
  endDateTime: session.endDateTime ? session.endDateTime.toISOString() : null,
});

const buildSeedSessions = (): Session[] => {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 9, 0, 0, 0);
  return [
    createSession({
      id: generateId(),
      sessionNumber: 1,
      startDateTime: new Date(base.getTime() - 2 * 60 * 60 * 1000),
      endDateTime: new Date(base.getTime() - 1.5 * 60 * 60 * 1000),
      experience: "Kickoff planning session.",
      tag: "Work",
      status: "completed",
    }),
    createSession({
      id: generateId(),
      sessionNumber: 2,
      startDateTime: new Date(base.getTime() - 24 * 60 * 60 * 1000),
      endDateTime: new Date(base.getTime() - 23.3 * 60 * 60 * 1000),
      experience: "Focused work on key tasks.",
      tag: "Study",
      status: "completed",
    }),
  ];
};

const persistSessions = async (sessions: Session[]) => {
  await storeData(STORAGE_KEYS.sessions, sessions.map(serializeSession));
};

const getMetadata = async (): Promise<{ lastSessionNumber: number }> => {
  const data = (await getData(STORAGE_KEYS.meta)) || { lastSessionNumber: 2 };
  return {
    lastSessionNumber: Number(data.lastSessionNumber) || 2,
  };
};

const storeMetadata = async (data: { lastSessionNumber: number }) => {
  await storeData(STORAGE_KEYS.meta, data);
};

const getActiveState = async (): Promise<ActiveSessionState> => {
  const raw = await getData(STORAGE_KEYS.active);
  if (!raw) {
    return createActiveSessionState();
  }
  const session = raw?.current ? deserializeSession(raw.current) : null;
  return { current: session };
};

const persistActiveState = async (state: ActiveSessionState) => {
  await storeData(STORAGE_KEYS.active, {
    current: state.current ? serializeSession(state.current) : null,
  });
};

export const getAllSessions = async (): Promise<Session[]> => {
  const sessions = await ensureSessionArray();
  return sessions.sort((a, b) => b.startDateTime.getTime() - a.startDateTime.getTime());
};

export const getActiveSession = async (): Promise<Session | null> => {
  const state = await getActiveState();
  return state.current;
};

export const saveSession = async (session: Session): Promise<void> => {
  if (session.status !== "completed" || !session.endDateTime) {
    throw new Error("Only completed sessions with an end time can be saved.");
  }
  const sessions = await ensureSessionArray();
  const index = sessions.findIndex((item) => item.id === session.id);
  if (index === -1) {
    sessions.push(session);
  } else {
    sessions[index] = session;
  }
  await persistSessions(sessions);
};

export const startNewSession = async (tag?: string | null): Promise<Session> => {
  const sessions = await ensureSessionArray();
  const { lastSessionNumber } = await getMetadata();

  const activeState = await getActiveState();
  if (activeState.current) {
    return activeState.current;
  }

  const nextNumber = lastSessionNumber + 1;
  const newSession = createSession({
    id: generateId(),
    sessionNumber: nextNumber,
    startDateTime: new Date(),
    tag: tag && tag.trim().length ? tag.trim() : null,
    status: "active",
  });

  await persistSessions([...sessions, newSession]);
  await persistActiveState({ current: newSession });
  await storeMetadata({ lastSessionNumber: nextNumber });

  return newSession;
};

export const stopSession = async (
  sessionId: string,
  experienceText: string,
  tag?: string | null
): Promise<Session> => {
  const sessions = await ensureSessionArray();
  const index = sessions.findIndex((item) => item.id === sessionId);
  if (index === -1) {
    throw new Error("Session not found");
  }

  const completed = completeSession(
    sessions[index],
    new Date(),
    experienceText.trim(),
    tag
  );

  sessions[index] = completed;
  await persistSessions(sessions);

  const state = await getActiveState();
  if (state.current?.id === sessionId) {
    await persistActiveState({ current: null });
  }

  return completed;
};

export const getTotalDurationMs = async (): Promise<number> => {
  const sessions = await ensureSessionArray();
  return sessions.reduce((sum, item) => sum + item.duration, 0);
};

export const updateSessionExperience = async (
  sessionId: string,
  experienceText: string,
  tag?: string | null
): Promise<Session | null> => {
  const sessions = await ensureSessionArray();
  const index = sessions.findIndex((item) => item.id === sessionId);
  if (index === -1) {
    return null;
  }
  const updated: Session = {
    ...sessions[index],
    experience: experienceText.trim(),
    tag: tag === undefined ? sessions[index].tag : tag && tag.trim().length ? tag.trim() : null,
  };
  sessions[index] = updated;
  await persistSessions(sessions);
  return updated;
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const sessions = await ensureSessionArray();
  const remaining = sessions.filter((item) => item.id !== sessionId);
  const removed = remaining.length !== sessions.length;
  if (removed) {
    await persistSessions(remaining);
  }
  const state = await getActiveState();
  if (state.current?.id === sessionId) {
    await persistActiveState({ current: null });
  }
  return removed;
};

export const clearAllData = async (): Promise<void> => {
  await Promise.all([
    storeData(STORAGE_KEYS.sessions, []),
    storeData(STORAGE_KEYS.active, { current: null }),
    storeData(STORAGE_KEYS.meta, { lastSessionNumber: 0 }),
  ]);
};

export const mapSessionsToPlain = (sessions: Session[]) =>
  sessions.map((item) => serializeSession(item));

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
