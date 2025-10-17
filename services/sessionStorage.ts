import { sessionAPI } from "./api";
import {
  ActiveSessionState,
  Session,
  SessionStatus,
  calculateDuration,
  completeSession,
  createActiveSessionState,
  createSession,
} from "./session";

const VALID_STATUSES: SessionStatus[] = ["active", "completed"];

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const response = await sessionAPI.getSessions();
    if (response.success) {
      return response.data.sessions.map((session: any) => ({
        id: session.id,
        sessionNumber: session.sessionNumber,
        startDateTime: new Date(session.startDateTime),
        endDateTime: session.endDateTime ? new Date(session.endDateTime) : null,
        duration: session.duration,
        experience: session.experience,
        status: session.status,
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to load sessions from API", error);
    return [];
  }
};

export const getActiveSession = async (): Promise<Session | null> => {
  try {
    const response = await sessionAPI.getActiveSession();
    if (response.success && response.data.session) {
      const session = response.data.session;
      return {
        id: session.id,
        sessionNumber: session.sessionNumber,
        startDateTime: new Date(session.startDateTime),
        endDateTime: session.endDateTime ? new Date(session.endDateTime) : null,
        duration: session.duration,
        experience: session.experience,
        status: session.status,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to load active session from API", error);
    return null;
  }
};

export const saveSession = async (session: Session): Promise<void> => {
  if (session.status !== "completed" || !session.endDateTime) {
    throw new Error("Only completed sessions with an end time can be saved.");
  }

  try {
    // Sessions are automatically saved when stopped via the API
    console.log("Session saved via API");
  } catch (error) {
    console.error("Failed to save session", error);
    throw error;
  }
};

export const startNewSession = async (): Promise<Session> => {
  try {
    const response = await sessionAPI.startSession();
    if (response.success) {
      const session = response.data.session;
      return {
        id: session.id,
        sessionNumber: session.sessionNumber,
        startDateTime: new Date(session.startDateTime),
        endDateTime: session.endDateTime ? new Date(session.endDateTime) : null,
        duration: session.duration,
        experience: session.experience,
        status: session.status,
      };
    }
    throw new Error("Failed to start session");
  } catch (error) {
    console.error("Failed to start session", error);
    throw error;
  }
};

export const stopSession = async (
  sessionId: string,
  experienceText: string
): Promise<Session> => {
  try {
    const response = await sessionAPI.stopSession(sessionId, experienceText);
    if (response.success) {
      const session = response.data.session;
      return {
        id: session.id,
        sessionNumber: session.sessionNumber,
        startDateTime: new Date(session.startDateTime),
        endDateTime: session.endDateTime ? new Date(session.endDateTime) : null,
        duration: session.duration,
        experience: session.experience,
        status: session.status,
      };
    }
    throw new Error("Failed to stop session");
  } catch (error) {
    console.error("Failed to stop session", error);
    throw error;
  }
};

export const getTotalDurationMs = async (): Promise<number> => {
  try {
    const response = await sessionAPI.getStats();
    if (response.success) {
      return response.data.stats.totalDuration;
    }
    return 0;
  } catch (error) {
    console.error("Failed to get total duration", error);
    return 0;
  }
};

export const updateSessionExperience = async (
  sessionId: string,
  experienceText: string
): Promise<Session | null> => {
  try {
    const response = await sessionAPI.updateSession(sessionId, experienceText);
    if (response.success) {
      const session = response.data.session;
      return {
        id: session.id,
        sessionNumber: session.sessionNumber,
        startDateTime: new Date(session.startDateTime),
        endDateTime: session.endDateTime ? new Date(session.endDateTime) : null,
        duration: session.duration,
        experience: session.experience,
        status: session.status,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to update session experience", error);
    return null;
  }
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    const response = await sessionAPI.deleteSession(sessionId);
    return response.success;
  } catch (error) {
    console.error("Failed to delete session", error);
    return false;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    // Clear local storage if needed
    console.log("Clearing local data");
  } catch (error) {
    console.error("Failed to clear session data", error);
    throw error;
  }
};
