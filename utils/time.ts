import dayjs, { Dayjs } from "dayjs";
import { Session } from "../services/session";

const HOURS_IN_DAY = 24;
const MS_IN_MINUTE = 60 * 1000;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;

const toDayjs = (input: Date | string | number): Dayjs => dayjs(input);

const clampToNonNegative = (value: number): number => (value < 0 ? 0 : value);

const formatPlural = (value: number, unit: string): string =>
  `${value} ${unit}${value === 1 ? "" : "S"}`;

const formatDurationFromMs = (milliseconds: number): string => {
  const safeMs = clampToNonNegative(milliseconds);

  if (safeMs < MS_IN_HOUR) {
    const minutes = Math.floor(safeMs / MS_IN_MINUTE);
    return formatPlural(minutes, "MINUTE");
  }

  const totalHours = Math.floor(safeMs / MS_IN_HOUR);
  const days = Math.floor(totalHours / HOURS_IN_DAY);
  const hours = totalHours % HOURS_IN_DAY;

  if (days > 0 && hours > 0) {
    return `${formatPlural(days, "DAY")} ${formatPlural(hours, "HOUR")}`;
  }

  if (days > 0) {
    return formatPlural(days, "DAY");
  }

  return formatPlural(totalHours, "HOUR");
};

export const calculateDuration = (
  startTime: Date | string | number,
  endTime: Date | string | number | null
): string => {
  if (!endTime) {
    return formatPlural(0, "HOUR");
  }

  const start = toDayjs(startTime);
  const end = toDayjs(endTime);
  const diff = end.diff(start);

  return formatDurationFromMs(diff);
};

export const formatDateTime = (
  timestamp: Date | string | number
): string => toDayjs(timestamp).format("MMMM D, YYYY, h:mm A");

export const getTotalDuration = (sessions: Session[]): string => {
  const totalMs = sessions.reduce((acc, session) => acc + session.duration, 0);
  return formatDurationFromMs(totalMs);
};

export const getCurrentStreakTime = (
  startTime: Date | string | number | null
): string => {
  if (!startTime) {
    return formatPlural(0, "MINUTE");
  }

  const now = dayjs();
  const start = toDayjs(startTime);
  const diff = now.diff(start);

  return formatDurationFromMs(diff);
};
