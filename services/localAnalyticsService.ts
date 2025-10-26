import { getAllSessions } from './sessionStorage';
import { Session } from './session';
import { TimePeriod, AnalyticsData, TimeDistributionData, TagDistributionData } from './analyticsService';

/**
 * Local analytics service that works offline with AsyncStorage data
 * Used as fallback when backend is unavailable
 */

const filterSessionsByPeriod = (sessions: Session[], period: TimePeriod): Session[] => {
  if (period === 'all') {
    return sessions.filter(s => s.status === 'completed');
  }

  const now = new Date();
  let startDate: Date;

  if (period === 'day') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
  } else {
    return sessions.filter(s => s.status === 'completed');
  }

  return sessions.filter(
    s => s.status === 'completed' && s.startDateTime >= startDate
  );
};

export const getLocalAnalytics = async (period: TimePeriod = 'all'): Promise<AnalyticsData> => {
  const allSessions = await getAllSessions();
  const sessions = filterSessionsByPeriod(allSessions, period);

  // Time Distribution (by hour)
  const timeDistribution: TimeDistributionData[] = Array(24)
    .fill(0)
    .map((_, hour) => ({
      hour,
      minutes: 0,
    }));

  sessions.forEach(session => {
    const hour = session.startDateTime.getHours();
    timeDistribution[hour].minutes += session.duration / (1000 * 60); // convert ms to minutes
  });

  // Tag Distribution
  const tagMap = new Map<string, number>();
  let totalTime = 0;

  sessions.forEach(session => {
    if (session.tag) {
      const minutes = session.duration / (1000 * 60);
      tagMap.set(session.tag, (tagMap.get(session.tag) || 0) + minutes);
      totalTime += minutes;
    }
  });

  const tagDistribution: TagDistributionData[] = Array.from(tagMap.entries())
    .map(([tag, minutes]) => ({
      tag,
      minutes,
      percentage: totalTime > 0 ? (minutes / totalTime) * 100 : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    timeDistribution,
    tagDistribution,
    totalTime,
    period,
    sessionCount: sessions.length,
  };
};
