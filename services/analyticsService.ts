/**
 * Analytics Service Interface (Backend version)
 *
 * This service provides backend API integration for analytics.
 * Currently DISABLED to prevent network errors during development.
 *
 * For local analytics only, use localAnalyticsService instead.
 */

// import api from './api';  // Commented out to prevent network errors

export interface TimeDistributionData {
  hour: number;
  minutes: number;
}

export interface TagDistributionData {
  tag: string;
  minutes: number;
  percentage: number;
}

export type TimePeriod = 'day' | 'month' | 'year' | 'all';

export interface AnalyticsData {
  timeDistribution: TimeDistributionData[];
  tagDistribution: TagDistributionData[];
  totalTime: number;
  period: TimePeriod;
  sessionCount: number;
}

// Backend analytics function - DISABLED
export const getAnalytics = async (period: TimePeriod = 'all'): Promise<AnalyticsData> => {
  console.warn('Backend analytics disabled - use getLocalAnalytics instead');
  throw new Error('Backend analytics disabled');
};
