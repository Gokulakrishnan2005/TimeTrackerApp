import {
  getAllSessions,
  getActiveSession,
  startNewSession,
  stopSession,
  updateSessionExperience,
  deleteSession as removeSession,
  saveSession,
  clearAllData,
  getTotalDurationMs,
} from './sessionStorage';
import { Session } from './session';

export type SessionSnapshot = Session;

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  totalDurationMs: number;
  averageDurationMs: number;
}

class SessionService {
  async listSessions(): Promise<SessionSnapshot[]> {
    return await getAllSessions();
  }

  async getActive(): Promise<SessionSnapshot | null> {
    return await getActiveSession();
  }

  async start(): Promise<SessionSnapshot> {
    return await startNewSession();
  }

  async stop(sessionId: string, notes: string): Promise<SessionSnapshot> {
    return await stopSession(sessionId, notes);
  }

  async updateNotes(sessionId: string, notes: string): Promise<SessionSnapshot | null> {
    return await updateSessionExperience(sessionId, notes);
  }

  async remove(sessionId: string): Promise<boolean> {
    return await removeSession(sessionId);
  }

  async persistCompleted(session: Session): Promise<void> {
    await saveSession(session);
  }

  async resetAll(): Promise<void> {
    await clearAllData();
  }

  async buildStats(): Promise<SessionStats> {
    const sessions = await getAllSessions();
    const totalDurationMs = await getTotalDurationMs();
    const completedSessions = sessions.filter((item) => item.status === 'completed');
    const activeSessions = sessions.filter((item) => item.status === 'active');
    const averageDurationMs = completedSessions.length
      ? Math.round(totalDurationMs / completedSessions.length)
      : 0;

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      activeSessions: activeSessions.length,
      totalDurationMs,
      averageDurationMs,
    };
  }

  formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

const sessionService = new SessionService();

export default sessionService;
export { sessionService };
