/**
 * API Service Configuration
 *
 * Centralized API configuration for React Native app
 * Handles HTTP requests, authentication, and error handling
 * Uses Axios for HTTP client with interceptors for token management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { getApiBaseUrl, getNetworkConfig, detectDevelopmentIP } from '../utils/networkConfig';

// API Configuration - Now dynamic!
const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT = getNetworkConfig().timeout;

/**
 * Create Axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry helpers
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const shouldRetry = (error: any): boolean => {
  const status = error?.status || error?.response?.status;
  const code = (error as AxiosError)?.code;
  if (code === 'ERR_CANCELED') return false; // do not retry canceled
  // Retry on network/timeout and 5xx / 429 / 408
  if (!status) return true; // network error
  return [500, 502, 503, 504, 522, 524, 408, 429].includes(status);
};

async function getWithRetry<T=any>(url: string, {
  params,
  signal,
  retries = 2,
  baseDelay = 500,
}: { params?: Record<string, any>; signal?: AbortSignal; retries?: number; baseDelay?: number } = {}): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      const cfg: AxiosRequestConfig = { params, signal };
      const res = await api.get(url, cfg);
      return res as unknown as T; // interceptor already returns data
    } catch (err: any) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      const jitter = Math.random() * 0.4 + 0.8; // 0.8x..1.2x
      const delay = Math.round(baseDelay * Math.pow(2, attempt) * jitter);
      await sleep(delay);
      attempt += 1;
    }
  }
}

/**
 * Request Interceptor
 * Automatically adds JWT token to requests if available
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error('Error adding token to request:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles common response scenarios and errors
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return response data directly for successful requests
    return response.data;
  },
  async (error: AxiosError) => {
    const { response, request, message } = error;

    // Handle different error scenarios
    if (response) {
      // Server responded with error status
      const status = response.status;
      const respData: any = (response as any).data;

      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          await handleUnauthorized();
          break;
        case 403:
          // Forbidden - insufficient permissions
          console.error('Access forbidden:', respData?.error || 'Forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found:', respData?.error || 'Not found');
          break;
        case 429:
          // Rate limited
          console.error('Rate limited:', respData?.error || 'Too many requests');
          break;
        case 500:
          // Server error
          console.error('Server error:', respData?.error || 'Internal server error');
          break;
        default:
          console.error('API Error:', respData?.error || `Error ${status}`);
      }

      // Return error data for component handling
      return Promise.reject({
        status,
        message: respData?.error || `HTTP ${status}`,
        details: respData
      });

    } else if (request) {
      // Network error - no response received
      console.error('Network error:', message);

      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your internet connection.',
        details: null
      });

    } else {
      // Request setup error
      console.error('Request error:', message);

      return Promise.reject({
        status: 0,
        message: 'Request configuration error',
        details: null
      });
    }
  }
);

/**
 * Handle unauthorized errors (401)
 * Clears stored token and user data, redirects to login
 */
const handleUnauthorized = async () => {
  try {
    // Clear stored authentication data
    await AsyncStorage.multiRemove([
      'authToken',
      'userData'
    ]);

    // You might want to navigate to login screen here
    // For now, just log the logout
    console.log('User logged out due to expired token');

  } catch (error) {
    console.error('Error during logout:', error);
  }
};

/**
 * Authentication API calls
 */
export const authAPI = {
  /**
   * Register new user
   */
  register: async (userData: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) => {
    return api.post('/auth/register', userData);
  },

  /**
   * Login user
   */
  login: async (credentials: {
    email: string;
    password: string;
  }) => {
    return api.post('/auth/login', credentials);
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return api.get('/auth/me');
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData: {
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
  }) => {
    return api.put('/auth/profile', profileData);
  },

  /**
   * Change password
   */
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    return api.put('/auth/password', passwordData);
  },

  /**
   * Logout user
   */
  logout: async () => {
    return api.post('/auth/logout');
  }
};

/**
 * Session API calls
 */
export const sessionAPI = {
  /**
   * Start new session
   */
  startSession: async () => {
    return api.post('/sessions/start');
  },

  /**
   * Stop active session
   */
  stopSession: async (sessionId: string, experience: string) => {
    return api.put(`/sessions/${sessionId}/stop`, { experience });
  },

  /**
   * Get all sessions with pagination
   */
  getSessions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return api.get('/sessions', { params });
  },

  /**
   * Get active session
   */
  getActiveSession: async () => {
    return api.get('/sessions/active');
  },

  /**
   * Update session
   */
  updateSession: async (sessionId: string, experience: string) => {
    return api.put(`/sessions/${sessionId}`, { experience });
  },

  /**
   * Delete session
   */
  deleteSession: async (sessionId: string) => {
    return api.delete(`/sessions/${sessionId}`);
  },

  /**
   * Get session statistics
   */
  getStats: async () => {
    return api.get('/sessions/stats');
  }
};

/**
 * Finance API calls
 */
export const financeAPI = {
  /**
   * Add new transaction
   */
  addTransaction: async (transactionData: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    customCategory?: string;
    notes?: string;
    date?: string;
  }) => {
    return api.post('/finance', transactionData);
  },

  /**
   * Get all transactions
   */
  getTransactions: async (params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }, options?: { signal?: AbortSignal; retries?: number }) => {
    return getWithRetry('/finance', { params, signal: options?.signal, retries: options?.retries });
  },

  /**
   * Get financial summary
   */
  getSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }, options?: { signal?: AbortSignal; retries?: number }) => {
    return getWithRetry('/finance/summary', { params, signal: options?.signal, retries: options?.retries });
  },

  /**
   * Get expense breakdown
   */
  getExpenseBreakdown: async (params?: {
    startDate?: string;
    endDate?: string;
  }, options?: { signal?: AbortSignal; retries?: number }) => {
    return getWithRetry('/finance/breakdown/expenses', { params, signal: options?.signal, retries: options?.retries });
  },

  /**
   * Get income breakdown
   */
  getIncomeBreakdown: async (params?: {
    startDate?: string;
    endDate?: string;
  }, options?: { signal?: AbortSignal; retries?: number }) => {
    return getWithRetry('/finance/breakdown/income', { params, signal: options?.signal, retries: options?.retries });
  },

  /**
   * Get monthly trends
   */
  getTrends: async (months?: number, options?: { signal?: AbortSignal; retries?: number }) => {
    return getWithRetry('/finance/trends', { params: { months }, signal: options?.signal, retries: options?.retries });
  },

  /**
   * Get comprehensive statistics
   */
  getStats: async (months?: number, options?: { signal?: AbortSignal; retries?: number }) => {
    return getWithRetry('/finance/stats', { params: { months }, signal: options?.signal, retries: options?.retries });
  },

  /**
   * Update transaction
   */
  updateTransaction: async (transactionId: string, transactionData: {
    amount?: number;
    category?: string;
    notes?: string;
    date?: string;
  }) => {
    return api.put(`/finance/${transactionId}`, transactionData);
  },

  /**
   * Delete transaction
   */
  deleteTransaction: async (transactionId: string) => {
    return api.delete(`/finance/${transactionId}`);
  }
};

/**
 * Task API calls
 */
export const taskAPI = {
  // Habits
  createHabit: async (habitData: {
    name: string;
    icon?: string;
  }) => {
    return api.post('/tasks/habits', habitData);
  },

  getHabits: async () => {
    return api.get('/tasks/habits');
  },

  completeHabit: async (habitId: string) => {
    return api.put(`/tasks/habits/${habitId}/complete`);
  },

  deleteHabit: async (habitId: string) => {
    return api.delete(`/tasks/habits/${habitId}`);
  },

  // Daily Tasks
  createDailyTask: async (taskData: {
    title: string;
    description?: string;
    date?: string;
  }) => {
    return api.post('/tasks/daily', taskData);
  },

  getDailyTasks: async (date?: string) => {
    return api.get('/tasks/daily', { params: { date } });
  },

  toggleTask: async (taskId: string) => {
    return api.put(`/tasks/daily/${taskId}/toggle`);
  },

  deleteDailyTask: async (taskId: string) => {
    return api.delete(`/tasks/daily/${taskId}`);
  },

  // Goals
  createGoal: async (goalData: {
    type: 'weekly' | 'monthly' | 'yearly';
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
    startDate: string;
    endDate: string;
  }) => {
    return api.post('/tasks/goals', goalData);
  },

  getGoals: async (type?: string) => {
    return api.get('/tasks/goals', { params: { type } });
  },

  updateGoalProgress: async (goalId: string, increment: number) => {
    return api.put(`/tasks/goals/${goalId}/progress`, { increment });
  },

  deleteGoal: async (goalId: string) => {
    return api.delete(`/tasks/goals/${goalId}`);
  },

  // Vision Board
  getVisionBoard: async () => {
    return api.get('/tasks/goals/vision');
  },

  addVisionImage: async (goalId: string, imageUrl: string) => {
    return api.put(`/tasks/goals/${goalId}/vision`, { imageUrl });
  }
};

/**
 * Storage helpers for authentication data
 */
export const authStorage = {
  /**
   * Store authentication data after login
   */
  storeAuthData: async (token: string, userData: any) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  },

  /**
   * Get stored authentication token
   */
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  /**
   * Get stored user data
   */
  getUserData: async (): Promise<any | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Clear all authentication data
   */
  clearAuthData: async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
};

export default api;
