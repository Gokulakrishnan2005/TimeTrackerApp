/**
 * Session Service
 *
 * Handles session management operations for time tracking
 * Integrates with backend API for session CRUD operations
 * Manages session state and provides React-friendly interfaces
 */

import { sessionAPI } from './api';

/**
 * Session interface matching backend schema
 */
export interface Session {
  id: string;
  sessionNumber: number;
  startDateTime: string;
  endDateTime: string | null;
  duration: number;
  experience: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Session summary interface (without sensitive data)
 */
export interface SessionSummary {
  id: string;
  sessionNumber: number;
  startDateTime: string;
  endDateTime: string | null;
  duration: number;
  formattedDuration: string;
  experience: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Session statistics interface
 */
export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  totalDuration: number;
  averageDuration: number;
}

/**
 * Pagination interface for session lists
 */
export interface SessionPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Sessions list response interface
 */
export interface SessionsResponse {
  success: boolean;
  data: {
    sessions: SessionSummary[];
    pagination: SessionPagination;
  };
}

/**
 * Session service class
 * Manages all session-related operations
 */
class SessionService {
  /**
   * Start a new session
   */
  async startSession(): Promise<SessionSummary> {
    try {
      const response = await sessionAPI.startSession();

      if (response.success) {
        return response.data.session;
      }

      throw new Error(response.error || 'Failed to start session');
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Stop an active session
   */
  async stopSession(sessionId: string, experience: string): Promise<SessionSummary> {
    try {
      const response = await sessionAPI.stopSession(sessionId, experience);

      if (response.success) {
        return response.data.session;
      }

      throw new Error(response.error || 'Failed to stop session');
    } catch (error) {
      console.error('Error stopping session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions with optional filters
   */
  async getSessions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SessionsResponse> {
    try {
      const response: SessionsResponse = await sessionAPI.getSessions(params);

      if (response.success) {
        return response;
      }

      throw new Error(response.error || 'Failed to fetch sessions');
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  /**
   * Get current active session
   */
  async getActiveSession(): Promise<SessionSummary | null> {
    try {
      const response = await sessionAPI.getActiveSession();

      if (response.success) {
        return response.data.session;
      }

      // No active session is a valid response
      if (response.data?.message === 'No active session') {
        return null;
      }

      throw new Error(response.error || 'Failed to fetch active session');
    } catch (error) {
      console.error('Error fetching active session:', error);
      throw error;
    }
  }

  /**
   * Update session (mainly for experience notes)
   */
  async updateSession(sessionId: string, experience: string): Promise<SessionSummary> {
    try {
      const response = await sessionAPI.updateSession(sessionId, experience);

      if (response.success) {
        return response.data.session;
      }

      throw new Error(response.error || 'Failed to update session');
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const response = await sessionAPI.deleteSession(sessionId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    try {
      const response = await sessionAPI.getStats();

      if (response.success) {
        return response.data.stats;
      }

      throw new Error(response.error || 'Failed to fetch session statistics');
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw error;
    }
  }

  /**
   * Format duration from milliseconds to human-readable string
   */
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

  /**
   * Calculate total duration from multiple sessions
   */
  calculateTotalDuration(sessions: Session[]): string {
    const totalMs = sessions.reduce((acc, session) => acc + session.duration, 0);

    if (totalMs === 0) {
      return '0 minutes';
    }

    const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

    if (totalHours === 0) {
      return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
    }

    if (totalMinutes === 0) {
      return `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
    }

    return `${totalHours} hour${totalHours !== 1 ? 's' : ''}, ${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
  }

  /**
   * Check if there's an active session
   */
  async hasActiveSession(): Promise<boolean> {
    try {
      const activeSession = await this.getActiveSession();
      return activeSession !== null;
    } catch (error) {
      console.error('Error checking active session:', error);
      return false;
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<SessionSummary | null> {
    try {
      // This would require a new API endpoint: GET /api/sessions/:id
      // For now, we'll need to fetch all sessions and find the one
      const response = await this.getSessions({ limit: 100 }); // Get recent sessions

      const session = response.data.sessions.find(s => s.id === sessionId);
      return session || null;
    } catch (error) {
      console.error('Error fetching session by ID:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const sessionService = new SessionService();

export default sessionService;
export { sessionService };
