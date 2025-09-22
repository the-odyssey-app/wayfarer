import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';
import { NAKAMA_CONFIG } from '../config/nakama';

export const DebugScreen: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123456');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { authenticateWithEmail } = useNakama();

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    clearDebugInfo();
    
    try {
      addDebugInfo('=== STARTING CONNECTION TEST ===');
      addDebugInfo(`Host: ${NAKAMA_CONFIG.host}`);
      addDebugInfo(`Port: ${NAKAMA_CONFIG.port}`);
      addDebugInfo(`SSL: ${NAKAMA_CONFIG.useSSL}`);
      addDebugInfo(`Server Key: ${NAKAMA_CONFIG.serverKey}`);
      addDebugInfo(`Timeout: ${NAKAMA_CONFIG.timeout}`);
      
      addDebugInfo('Attempting authentication...');
      const result = await authenticateWithEmail(email, password);
      
      addDebugInfo('✅ Authentication successful!');
      addDebugInfo(`User ID: ${result.nakamaId}`);
      addDebugInfo(`Username: ${result.username}`);
      addDebugInfo(`Email: ${result.email}`);
      
    } catch (error) {
      addDebugInfo('❌ Authentication failed!');
      addDebugInfo(`Error type: ${typeof error}`);
      addDebugInfo(`Error message: ${error instanceof Error ? error.message : String(error)}`);
      
      if (error instanceof Error && error.stack) {
        addDebugInfo(`Stack trace: ${error.stack}`);
      }
      
      addDebugInfo(`Full error object: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nakama Connection Debug</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearDebugInfo}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information:</Text>
        {debugInfo.length === 0 ? (
          <Text style={styles.noLogs}>No debug information yet. Tap "Test Connection" to start.</Text>
        ) : (
          debugInfo.map((info, index) => (
            <Text key={index} style={styles.debugText}>
              {info}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    minHeight: 300,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
  noLogs: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
