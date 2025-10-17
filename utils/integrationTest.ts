/**
 * Backend Integration Test
 *
 * Test script to verify React Native app can connect to backend
 * Run this in the React Native app console or as a separate test
 */

import { sessionAPI, authAPI } from './services/api';

// Test function to verify backend connectivity
export const testBackendIntegration = async () => {
  console.log('🧪 Testing Backend Integration...');

  try {
    // Test 1: Health check
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch('http://10.105.214.10:5000/health');
    const healthData = await healthResponse.json();

    if (healthData.status === 'OK') {
      console.log('✅ Health check passed:', healthData.message);
    } else {
      console.log('❌ Health check failed');
      return false;
    }

    // Test 2: Try to register a test user
    console.log('👤 Testing user registration...');
    try {
      const registerResponse = await authAPI.register({
        name: 'Test User Integration',
        username: `testuser_${Date.now()}`,
        email: `test${Date.now()}@integration.com`,
        password: 'password123'
      });

      if (registerResponse.success) {
        console.log('✅ User registration successful');
        console.log('🔑 Token received:', registerResponse.data.token ? 'Yes' : 'No');
      } else {
        console.log('❌ User registration failed:', registerResponse.error);
      }
    } catch (error) {
      console.log('❌ Registration API error:', error);
    }

    // Test 3: Try to start a session (should fail without auth)
    console.log('⏱️ Testing session start (should fail without auth)...');
    try {
      await sessionAPI.startSession();
      console.log('⚠️ Session start succeeded unexpectedly');
    } catch (error: any) {
      if (error.status === 401) {
        console.log('✅ Session start correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('🎉 Backend integration test completed!');
    return true;

  } catch (error) {
    console.error('❌ Backend integration test failed:', error);
    return false;
  }
};

// Auto-run test in development
if (__DEV__) {
  // Wait for app to fully load, then test backend
  setTimeout(() => {
    testBackendIntegration();
  }, 3000);
}

export default testBackendIntegration;
