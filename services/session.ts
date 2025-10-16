export type SessionStatus = "active" | "completed";

export interface Session {
  id: string;
  sessionNumber: number;
  startDateTime: Date;
  endDateTime: Date | null;
  duration: number;
  experience: string;
  status: SessionStatus;
}

export interface ActiveSessionState {
  current: Session | null;
}

export function createActiveSessionState(): ActiveSessionState {
  return { current: null };
}

export function calculateDuration(start: Date, end: Date | null): number {
  if (!end) {
    return 0;
  }
  const milliseconds = end.getTime() - start.getTime();
  return milliseconds > 0 ? milliseconds : 0;
}

export function createSession(params: {
  id: string;
  sessionNumber: number;
  startDateTime: Date;
  endDateTime?: Date | null;
  experience?: string;
  status?: SessionStatus;
}): Session {
  const endDateTime = params.endDateTime ?? null;
  const status = params.status ?? (endDateTime ? "completed" : "active");
  const duration = calculateDuration(params.startDateTime, endDateTime);

  return {
    id: params.id,
    sessionNumber: params.sessionNumber,
    startDateTime: params.startDateTime,
    endDateTime,
    duration,
    experience: params.experience ?? "",
    status,
  };
}

export function completeSession(
  session: Session,
  endDateTime: Date,
  experience: string
): Session {
  const duration = calculateDuration(session.startDateTime, endDateTime);

  return {
    ...session,
    endDateTime,
    duration,
    experience,
    status: "completed",
  };
}
