import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { apiService } from '../lib/api';

export default function ApiTestScreen() {
  const [testResults, setTestResults] = useState([]);
  const [email, setEmail] = useState('alice@example.com');
  const [loading, setLoading] = useState(false);

  const addResult = (test, result, status) => {
    setTestResults(prev => [...prev, { test, result, status, time: new Date().toISOString() }]);
  };

  const testApiConnection = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Get companies
      addResult('Testing API connection...', 'Starting tests', 'info');
      
      const companiesResult = await apiService.getPrograms();
      if (companiesResult.error) {
        addResult('Get Companies', `Error: ${companiesResult.error}`, 'error');
      } else {
        addResult('Get Companies', `Success: Found ${companiesResult.data?.companies?.length || 0} companies`, 'success');
      }

      // Test 2: Test session (should be unauthenticated)
      const sessionResult = await apiService.getSession();
      if (sessionResult.error) {
        addResult('Get Session', `Error: ${sessionResult.error}`, 'error');
      } else {
        addResult('Get Session', `Success: Authenticated = ${sessionResult.data?.authenticated}`, 'success');
      }

      // Test 3: Test login
      if (email) {
        const loginResult = await apiService.login({ email });
        if (loginResult.error) {
          addResult('Login Test', `Error: ${loginResult.error}`, 'error');
        } else {
          addResult('Login Test', `Success: Logged in as ${loginResult.data?.user?.full_name}`, 'success');
          
          // Test 4: Get user cards after login
          const cardsResult = await apiService.getUserCards();
          if (cardsResult.error) {
            addResult('Get User Cards', `Error: ${cardsResult.error}`, 'error');
          } else {
            addResult('Get User Cards', `Success: Found ${cardsResult.data?.cards?.length || 0} cards`, 'success');
          }
        }
      }

    } catch (error) {
      addResult('General Error', error.message, 'error');
    }

    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Test Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email to test login"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "Testing..." : "Test API Connection"} 
          onPress={testApiConnection}
          disabled={loading}
        />
        <Button title="Clear Results" onPress={clearResults} />
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <View key={index} style={[styles.resultItem, styles[result.status]]}>
            <Text style={styles.resultTest}>{result.test}</Text>
            <Text style={styles.resultText}>{result.result}</Text>
            <Text style={styles.resultTime}>{new Date(result.time).toLocaleTimeString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

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
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  results: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultItem: {
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
    borderWidth: 1,
  },
  success: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  error: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  info: {
    backgroundColor: '#d1ecf1',
    borderColor: '#bee5eb',
  },
  resultTest: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultText: {
    fontSize: 12,
    marginTop: 2,
  },
  resultTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});