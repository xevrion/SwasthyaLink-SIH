import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ApiService from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');

  // Check server connection on component mount
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      setServerStatus('checking');
      const healthCheck = await ApiService.testConnection();
      
      if (healthCheck.success) {
        setServerStatus('connected');
        setErrorMessage('');
      } else {
        setServerStatus('disconnected');
        setErrorMessage(`Server connection failed: ${healthCheck.status}`);
      }
    } catch (error) {
      setServerStatus('disconnected');
      setErrorMessage(`Cannot connect to server at ${ApiService.getBaseURL()}`);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    
    try {
      const response = await ApiService.login(username.trim(), password);
      
      if (response.success) {
        navigation.replace('PatientList');
      } else {
        Alert.alert('Login Failed', response.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ASHA Worker Login</Text>
      
      <View style={styles.form}>
        {/* Server Status Display */}
        <View style={styles.serverStatus}>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot, 
              serverStatus === 'connected' ? styles.statusConnected : 
              serverStatus === 'disconnected' ? styles.statusDisconnected : 
              styles.statusChecking
            ]} />
            <Text style={styles.statusText}>
              {serverStatus === 'connected' ? 'Server Connected' : 
               serverStatus === 'disconnected' ? 'Server Disconnected' : 
               'Checking Server...'}
            </Text>
            {serverStatus === 'checking' && (
              <ActivityIndicator size="small" color="#007AFF" style={styles.statusLoader} />
            )}
          </View>
          
          {serverStatus === 'disconnected' && (
            <View style={styles.errorSection}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={checkServerConnection}
              >
                <Text style={styles.retryText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.serverUrl}>Server: {ApiService.getBaseURL()}</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading && serverStatus === 'connected'}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading && serverStatus === 'connected'}
        />
        
        <TouchableOpacity 
          style={[
            styles.button, 
            (loading || serverStatus !== 'connected') && styles.buttonDisabled
          ]}
          onPress={handleLogin}
          disabled={loading || serverStatus !== 'connected'}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {serverStatus === 'connected' ? 'Login' : 'Server Unavailable'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Default credentials:{' \n'}
          Username: asha_worker{'\n'}
          Password: password123
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  serverStatus: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#28a745',
  },
  statusDisconnected: {
    backgroundColor: '#dc3545',
  },
  statusChecking: {
    backgroundColor: '#ffc107',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    color: '#495057',
  },
  statusLoader: {
    marginLeft: 8,
  },
  errorSection: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    fontSize: 12,
    color: '#721c24',
    marginBottom: 8,
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  serverUrl: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginTop: 4,
  },
});

export default LoginScreen;
