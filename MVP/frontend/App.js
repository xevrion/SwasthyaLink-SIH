import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './screens/LoginScreen';
import PatientListScreen from './screens/PatientListScreen';
import AddPatientScreen from './screens/AddPatientScreen';
import NotificationService from './services/notificationService';

const Stack = createStackNavigator();

export default function App() {
  // Initialize notifications when app starts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await NotificationService.initialize();
        console.log('✅ App: Notifications initialized');
      } catch (error) {
        console.warn('⚠️ App: Failed to initialize notifications:', error);
      }
    };
    
    initializeNotifications();
    
    // Cleanup on unmount
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PatientList" 
          component={PatientListScreen} 
          options={{ 
            title: 'Patient Management',
            headerLeft: null, // Remove back button
          }}
        />
        <Stack.Screen 
          name="AddPatient" 
          component={AddPatientScreen} 
          options={{ title: 'Add Patient' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
