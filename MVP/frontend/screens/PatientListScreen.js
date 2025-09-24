import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import ApiService from '../services/api';
import NotificationService from '../services/notificationService';

const PatientListScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  const fetchPatients = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await ApiService.getPatients();
      
      if (response.success) {
        setPatients(response.patients || []);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch patients');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients(false);
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await ApiService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  // Notification testing functions
  const sendTestNotification = async (type) => {
    try {
      setSendingNotification(true);
      await NotificationService.sendTestNotification(type);
      
      Alert.alert(
        '📱 Notification Sent!', 
        `Test notification "${type}" has been sent. Check your notification panel!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert(
        'Error',
        `Failed to send notification: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setSendingNotification(false);
    }
  };

  const sendDelayedNotification = async () => {
    try {
      setSendingNotification(true);
      await NotificationService.scheduleDelayedNotification(
        '⏰ Delayed Test Notification',
        'This notification was scheduled 5 seconds ago!',
        5,
        { type: 'delayed_test' }
      );
      
      Alert.alert(
        '⏰ Scheduled!', 
        'A test notification will arrive in 5 seconds!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSendingNotification(false);
    }
  };

  const sendPatientNotification = async () => {
    if (patients.length === 0) {
      Alert.alert('No Patients', 'Add some patients first to test patient notifications!');
      return;
    }

    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
    
    try {
      setSendingNotification(true);
      await NotificationService.notifyPatientAdded(randomPatient.name, randomPatient.village);
      
      Alert.alert(
        '✅ Patient Notification Sent!',
        `Sent notification for patient: ${randomPatient.name}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSendingNotification(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    
    // Focus listener to refresh data when returning to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPatients(false);
    });

    return unsubscribe;
  }, [navigation]);

  const renderPatientItem = ({ item, index }) => (
    <View style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientAge}>{item.age} years</Text>
      </View>
      
      <View style={styles.patientDetails}>
        <Text style={styles.detailRow}>
          <Text style={styles.label}>Gender: </Text>
          {item.gender}
        </Text>
        
        <Text style={styles.detailRow}>
          <Text style={styles.label}>Village: </Text>
          {item.village}
        </Text>
        
        <Text style={styles.detailRow}>
          <Text style={styles.label}>Health Issue: </Text>
          {item.healthIssue}
        </Text>
        
        <Text style={styles.dateAdded}>
          Added: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No patients added yet</Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('AddPatient')}
      >
        <Text style={styles.addFirstButtonText}>Add First Patient</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Patients ({patients.length})</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Add Patient FAB */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('AddPatient')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      
      {/* Notification Test FAB */}
      <TouchableOpacity
        style={[styles.fabButton, styles.notificationFab]}
        onPress={() => setShowNotificationMenu(true)}
      >
        <Text style={styles.fabText}>🔔</Text>
      </TouchableOpacity>

      {/* Notification Test Modal */}
      <Modal
        visible={showNotificationMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📱 Test Notifications</Text>
              <TouchableOpacity 
                onPress={() => setShowNotificationMenu(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Basic Notifications</Text>
              
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => sendTestNotification('basic')}
                disabled={sendingNotification}
              >
                <Text style={styles.testButtonIcon}>🧪</Text>
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonTitle}>Basic Test</Text>
                  <Text style={styles.testButtonDesc}>Simple notification test</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => sendDelayedNotification()}
                disabled={sendingNotification}
              >
                <Text style={styles.testButtonIcon}>⏰</Text>
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonTitle}>Delayed Test</Text>
                  <Text style={styles.testButtonDesc}>Notification in 5 seconds</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Patient Notifications</Text>
              
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => sendTestNotification('patient_added')}
                disabled={sendingNotification}
              >
                <Text style={styles.testButtonIcon}>✅</Text>
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonTitle}>Patient Added</Text>
                  <Text style={styles.testButtonDesc}>New patient registration alert</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => sendPatientNotification()}
                disabled={sendingNotification || patients.length === 0}
              >
                <Text style={styles.testButtonIcon}>👤</Text>
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonTitle}>Random Patient Alert</Text>
                  <Text style={styles.testButtonDesc}>
                    {patients.length === 0 ? 'Add patients first' : 'Notification for random patient'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => sendTestNotification('patient_reminder')}
                disabled={sendingNotification}
              >
                <Text style={styles.testButtonIcon}>⏰</Text>
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonTitle}>Follow-up Reminder</Text>
                  <Text style={styles.testButtonDesc}>High priority patient reminder</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>System Notifications</Text>
              
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => sendTestNotification('health_check')}
                disabled={sendingNotification}
              >
                <Text style={styles.testButtonIcon}>🏥</Text>
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonTitle}>Health Check</Text>
                  <Text style={styles.testButtonDesc}>Weekly health rounds reminder</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => sendTestNotification('system_status')}
                disabled={sendingNotification}
              >
                <Text style={styles.testButtonIcon}>📊</Text>
                <View style={styles.testButtonContent}>
                  <Text style={styles.testButtonTitle}>System Update</Text>
                  <Text style={styles.testButtonDesc}>Data sync status notification</Text>
                </View>
              </TouchableOpacity>

              {sendingNotification && (
                <View style={styles.loadingSection}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Sending notification...</Text>
                </View>
              )}
              
              <View style={styles.modalFooter}>
                <Text style={styles.footerText}>
                  📱 Make sure your device notifications are enabled!
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    flexGrow: 1,
  },
  patientCard: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  patientDetails: {
    gap: 8,
  },
  detailRow: {
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  dateAdded: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Notification FAB styles
  notificationFab: {
    bottom: 100, // Position above the add button
    backgroundColor: '#FF6B35', // Orange color for notification button
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testButtonIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  testButtonDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  modalFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PatientListScreen;
