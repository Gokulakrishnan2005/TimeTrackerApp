/**
 * Dynamic Network Configuration
 *
 * Automatically detects the best IP address for React Native development
 * Works with local network, ngrok tunnels, and production environments
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get local IP address for development
const getLocalIPAddress = (): string => {
  if (__DEV__) {
    // 0) On web, use the browser hostname (works for localhost and LAN IP)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).location?.hostname) {
      return (window as any).location.hostname;
    }
    // 1) Prefer explicit env override if set (via babel or app.json extras)
    // @ts-ignore
    const envHost = (global as any)?.API_HOST || (Constants?.expoConfig as any)?.extra?.API_HOST;
    if (envHost && typeof envHost === 'string') {
      const trimmedHost = envHost.trim();
      if (trimmedHost && trimmedHost.toLowerCase() !== 'auto') {
        return trimmedHost;
      }
    }

    // 2) Try to read Expo host from dev runtime (e.g., "10.105.214.95:8081")
    const hostUri: string | undefined =
      (Constants as any)?.expoConfig?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoGo?.developer?.debuggerHost;
    if (hostUri && typeof hostUri === 'string') {
      const host = hostUri.split(':')[0];
      if (host) return host;
    }

    // 2b) Fallback to legacy manifest debugger host or Expo env var
    const legacyDebuggerHost: string | undefined =
      (Constants as any)?.manifest?.debuggerHost ||
      (process.env as any)?.EXPO_DEV_SERVER_HOST;
    if (legacyDebuggerHost && typeof legacyDebuggerHost === 'string') {
      const host = legacyDebuggerHost.split(':')[0];
      if (host) return host;
    }

    // 3) Android emulator special-case
    if (Platform.OS === 'android') return '10.0.2.2';

    // 4) Fallback to localhost
    return 'localhost';
  }

  // Production host should be configured via environment/app.json
  return 'your-production-host.com';
};

/**
 * Network Configuration
 *
 * Centralized network configuration for different environments
 */
export const NetworkConfig = {
  // Development configuration
  development: {
    // Base URL for API calls
    apiBaseUrl: `http://${getLocalIPAddress()}:5000/api`,

    // WebSocket URL (if using real-time features)
    wsUrl: `ws://${getLocalIPAddress()}:5000`,

    // Timeout for API requests (increase for mobile + LAN networks)
    timeout: 20000,
  },

  // Production configuration
  production: {
    apiBaseUrl: 'https://your-production-api.com/api',
    wsUrl: 'wss://your-production-api.com',
    timeout: 15000,
  },

  // Staging configuration (optional)
  staging: {
    apiBaseUrl: 'https://staging-api.yourapp.com/api',
    wsUrl: 'wss://staging-api.yourapp.com',
    timeout: 12000,
  },
};

/**
 * Get current environment configuration
 */
export const getNetworkConfig = () => {
  // You can determine environment from:
  // 1. __DEV__ flag (React Native built-in)
  // 2. Environment variables
  // 3. Build configuration

  if (__DEV__) {
    return NetworkConfig.development;
  }

  // In production builds, check for staging vs production
  // This could be determined by build flags or environment variables
  return NetworkConfig.production;
};

/**
 * Utility function to test connectivity with timeout
 * DISABLED to prevent network errors during development
 */
export const testConnectivity = async (url?: string): Promise<boolean> => {
  console.log('Connectivity test disabled - skipping network checks');
  return false; // Always return false to disable backend connections
};

/**
 * Get formatted API base URL for current environment
 */
export const getApiBaseUrl = (): string => {
  return getNetworkConfig().apiBaseUrl;
};

/**
 * Get formatted WebSocket URL for current environment
 */
export const getWsUrl = (): string => {
  return getNetworkConfig().wsUrl;
};

/**
 * Auto-detect IP address for development
 * This is a fallback method that tries common IP patterns
 */
export const detectDevelopmentIP = async (): Promise<string> => {
  const commonIPs = [
    '192.168.1.100',
    '192.168.0.100',
    '10.0.2.2',
    'localhost',
  ];

  // Test each IP until we find one that works
  for (const ip of commonIPs) {
    const testUrl = `http://${ip}:5000/health`;
    if (await testConnectivity(testUrl)) {
      console.log(`✅ Found working IP: ${ip}`);
      return ip;
    }
  }

  console.warn('❌ Could not auto-detect working IP address');
  return commonIPs[0]; // Fallback to first IP
};
