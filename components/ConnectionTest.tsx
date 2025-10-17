/**
 * Connection Test Component
 *
 * Simple component to test backend connectivity
 * Add this to your app temporarily to test the connection
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { sessionAPI, authAPI } from '../services/api';
import { detectDevelopmentIP, testConnectivity } from '../utils/networkConfig';

const ConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [currentIP, setCurrentIP] = useState<string>('192.168.1.100');

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSpecificIP = async (ip: string) => {
    const testUrl = `http://${ip}:5000/health`;
    addResult(`Testing IP: ${ip}...`);

    const isConnected = await testConnectivity(testUrl);
    if (isConnected) {
      addResult(`✅ IP ${ip} is working!`);
      setCurrentIP(ip);
      return true;
    } else {
      addResult(`❌ IP ${ip} not accessible`);
      return false;
    }
  };

  const runTests = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      // Test common IP addresses
      const commonIPs = [
        '192.168.1.100',
        '192.168.0.100',
        '10.0.2.2',
        'localhost',
      ];

      addResult('🔍 Testing common IP addresses...');

      let workingIP = null;
      for (const ip of commonIPs) {
        if (await testSpecificIP(ip)) {
          workingIP = ip;
          break;
        }
      }

      if (workingIP) {
        addResult(`🎉 Found working backend at: ${workingIP}:5000`);

        // Test API endpoints
        addResult('🔧 Testing API endpoints...');

        // Test user registration
        try {
          const registerResponse = await authAPI.register({
            name: 'Test User',
            username: `testuser_${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            password: 'password123'
          });
          addResult('✅ User registration API working');
        } catch (error: any) {
          addResult(`❌ Registration API error: ${error.message}`);
        }

        // Test session start (should fail without auth)
        try {
          await sessionAPI.startSession();
          addResult('⚠️ Session start succeeded unexpectedly');
        } catch (error: any) {
          if (error.status === 401) {
            addResult('✅ Session correctly requires authentication');
          } else {
            addResult(`❌ Unexpected error: ${error.message}`);
          }
        }

      } else {
        addResult('❌ No working IP found. Please ensure:');
        addResult('   • Backend server is running on port 5000');
        addResult('   • Both devices are on the same WiFi network');
        addResult('   • Firewall allows connections on port 5000');
      }

    } catch (error: any) {
      addResult(`❌ Test error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>

      <View style={styles.ipInfo}>
        <Text style={styles.ipLabel}>Current IP:</Text>
        <Text style={styles.ipValue}>{currentIP}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isTesting && styles.buttonDisabled]}
        onPress={runTests}
        disabled={isTesting}
      >
        <Text style={styles.buttonText}>
          {isTesting ? 'Testing...' : 'Test Connection'}
          {isTesting ? 'Testing...' : 'Run Tests'}
        </Text>
      </TouchableOpacity>

      <View style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  ipInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  ipLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ipValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    padding: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  helpSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  helpText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default ConnectionTest;
