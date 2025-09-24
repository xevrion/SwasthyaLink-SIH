import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamic base URL based on platform
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  if (Platform.OS === 'android') {
    // Use 10.0.2.2 for Android emulator, localhost for physical device
    return 'http://172.32.67.232:3000'; //use your laptop ip here
  }
  if (Platform.OS === 'ios') {
    return 'http://localhost:3000';
  }
  return 'http://localhost:3000';
};

const BASE_URL = getBaseURL();
// const BASE_URL = 'http://10.22.16.33:3000'
const REQUEST_TIMEOUT = 10000; // 10 seconds

class ApiService {
  constructor() {
    this.isOnline = true;
    this.baseURL = BASE_URL;
  }

  // Test server connectivity
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response;
      try {
        response = await fetch(`${this.baseURL}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Connection test response status:', response.status);
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        this.isOnline = true;
        return { success: true, status: 'Server is reachable' };
      } else {
        return { success: false, status: 'Server returned error' };
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      this.isOnline = false;
      return {
        success: false,
        status: 'Cannot reach server',
        details: error.message
      };
    }
  }

  async getToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  async setToken(token) {
    try {
      return await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  async removeToken() {
    try {
      return await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making request to: ${url}`);

    // Test connection first for critical requests
    if (!this.isOnline && (endpoint === '/login' || endpoint === '/patients')) {
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Network Error: ${connectionTest.status}. Please check if the backend server is running on ${this.baseURL}`);
      }
    }

    const token = await this.getToken();

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT);

    const config = {
      signal: controller.signal,
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log('Request config:', {
        url,
        method: config.method || 'GET',
        headers: config.headers,
        body: config.body ? 'Present' : 'None'
      });

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.warn('Non-JSON response:', textResponse);
        data = { error: 'Server returned non-JSON response' };
      }

      console.log('Response data:', data);

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          await this.removeToken(); // Clear invalid token
          throw new Error(data.error || 'Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error(data.error || 'Access forbidden. Please check your permissions.');
        } else if (response.status === 404) {
          throw new Error(data.error || 'Requested resource not found.');
        } else if (response.status === 500) {
          throw new Error(data.error || 'Server error. Please try again later.');
        } else {
          throw new Error(data.error || `Request failed with status ${response.status}`);
        }
      }

      this.isOnline = true;
      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      console.error('Request failed:', error);

      // Handle different types of errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your internet connection.');
      }

      if (error.message.includes('Network request failed') ||
        error.message.includes('fetch')) {
        this.isOnline = false;
        throw new Error(`Network Error: Cannot connect to server at ${this.baseURL}. Please ensure the backend is running.`);
      }

      if (error.message.includes('JSON')) {
        throw new Error('Server response error. Please try again.');
      }

      // Re-throw known errors
      throw error;
    }
  }

  async login(username, password) {
    try {
      console.log('Attempting login...');

      // Input validation
      if (!username?.trim() || !password?.trim()) {
        throw new Error('Username and password are required');
      }

      const data = await this.makeRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        }),
      });

      if (data.success && data.token) {
        await this.setToken(data.token);
        console.log('Login successful, token stored');
      } else {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async addPatient(patientData) {
    try {
      console.log('Adding patient:', patientData);

      // Input validation
      const { name, age, gender, village, healthIssue } = patientData;

      if (!name?.trim()) {
        throw new Error('Patient name is required');
      }
      if (!age || isNaN(parseInt(age)) || parseInt(age) <= 0) {
        throw new Error('Valid age is required');
      }
      if (!gender) {
        throw new Error('Gender is required');
      }
      if (!village?.trim()) {
        throw new Error('Village name is required');
      }
      if (!healthIssue?.trim()) {
        throw new Error('Health issue description is required');
      }

      const data = await this.makeRequest('/patients', {
        method: 'POST',
        body: JSON.stringify(patientData),
      });

      console.log('Patient added successfully');
      return data;
    } catch (error) {
      console.error('Add patient error:', error);
      throw error;
    }
  }

  async getPatients() {
    try {
      console.log('Fetching patients...');
      const data = await this.makeRequest('/patients');
      console.log(`Retrieved ${data.patients?.length || 0} patients`);
      return data;
    } catch (error) {
      console.error('Get patients error:', error);
      throw error;
    }
  }

  async checkServerHealth() {
    try {
      const data = await this.makeRequest('/health');
      return data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('Logging out...');
      await this.removeToken();
      this.isOnline = true; // Reset connection status
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout, just log it
    }
  }

  // Get current API base URL
  getBaseURL() {
    return this.baseURL;
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }
}

export default new ApiService();
