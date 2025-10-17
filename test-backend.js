/**
 * Backend API Test Script
 * Tests backend connectivity and API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://10.105.214.10:5000/api';

async function testBackend() {
  console.log('🧪 Testing Time Tracker Backend API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get('http://10.105.214.10:5000/health');
    console.log('✅ Health check passed:', healthResponse.data.message);
    console.log('');

    // Test 2: Register User
    console.log('2️⃣ Testing user registration...');
    const registerData = {
      name: 'Test User',
      username: `testuser_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      console.log('✅ User registration successful!');
      console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
      
      const user = registerResponse.data.data?.user || registerResponse.data.user;
      const regToken = registerResponse.data.data?.token || registerResponse.data.token;
      
      if (user) {
        console.log('User:', user.name);
      }
      console.log('Token received:', regToken ? 'Yes' : 'No');
      console.log('');

      // Test 3: Login
      console.log('3️⃣ Testing user login...');
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };

      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      console.log('✅ User login successful!');
      const loginToken = loginResponse.data.data?.token || loginResponse.data.token;
      console.log('Token received:', loginToken ? 'Yes' : 'No');
      console.log('');

      // Test 4: Get User Profile (with auth token)
      console.log('4️⃣ Testing authenticated endpoint...');
      const token = loginToken;
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Profile retrieval successful!');
      const profileUser = profileResponse.data.data?.user || profileResponse.data.user || profileResponse.data;
      if (profileUser && profileUser.name) {
        console.log('User:', profileUser.name);
      }
      console.log('');

      console.log('🎉 All tests passed! Backend is working correctly!\n');

    } catch (error) {
      if (error.response) {
        console.log('⚠️ API Error:', error.response.data.message || error.response.statusText);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('  • Ensure backend server is running: cd backend && npm start');
    console.error('  • Check firewall settings allow port 5000');
    console.error('  • Verify MongoDB connection is working');
  }
}

// Run tests
testBackend();
