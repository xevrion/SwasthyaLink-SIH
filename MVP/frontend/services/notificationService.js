import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.isInitialized = false;
  }

  // Initialize notification service
  async initialize() {
    try {
      console.log('Initializing notification service...');
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notification Permissions',
          'Please enable notifications in your device settings to receive patient reminders and updates.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // For Android, set notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Patient Management',
          description: 'Notifications for patient management activities',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        // Additional channels for different types
        await Notifications.setNotificationChannelAsync('patient-reminders', {
          name: 'Patient Reminders',
          description: 'Reminders for patient follow-ups',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('system-alerts', {
          name: 'System Alerts',
          description: 'System and app notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#28a745',
          sound: 'default',
        });
      }

      // Set up notification listeners
      this.setupListeners();
      
      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  // Set up notification event listeners
  setupListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data?.type === 'patient_reminder') {
        // Navigate to patient details or reminder screen
        console.log('Patient reminder tapped:', data.patientId);
      } else if (data?.type === 'system_alert') {
        console.log('System alert tapped:', data.message);
      }
    });
  }

  // Schedule a local notification
  async scheduleNotification({
    title,
    body,
    data = {},
    trigger = null, // null for immediate, or { seconds: X } for delayed
    channelId = 'default',
    priority = 'normal'
  }) {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ Notification service not initialized');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          priority: priority === 'high' ? 
            Notifications.AndroidNotificationPriority.HIGH : 
            Notifications.AndroidNotificationPriority.DEFAULT,
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger,
      });

      console.log('📨 Notification scheduled:', notificationId);
      return notificationId;
      
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      throw error;
    }
  }

  // Send immediate notification
  async sendNotification(title, body, data = {}) {
    return await this.scheduleNotification({
      title,
      body,
      data,
      trigger: null, // immediate
    });
  }

  // Test notification with different types
  async sendTestNotification(type = 'basic') {
    const notifications = {
      basic: {
        title: '🧪 Test Notification',
        body: 'This is a basic test notification from Patient Management App!',
        data: { type: 'test', timestamp: new Date().toISOString() }
      },
      patient_added: {
        title: '✅ Patient Added Successfully',
        body: 'New patient John Doe (25) from Village ABC has been registered.',
        data: { type: 'patient_added', patientId: 'test-123' },
        channelId: 'system-alerts'
      },
      patient_reminder: {
        title: '⏰ Patient Follow-up Reminder',
        body: 'Follow-up required for patient Jane Smith - High blood pressure check.',
        data: { type: 'patient_reminder', patientId: 'test-456' },
        channelId: 'patient-reminders',
        priority: 'high'
      },
      health_check: {
        title: '🏥 Health Check Reminder',
        body: 'Time for weekly health check rounds in your assigned villages.',
        data: { type: 'health_check', route: 'health-checks' },
        channelId: 'patient-reminders'
      },
      system_status: {
        title: '📊 System Update',
        body: 'Patient data has been synced successfully. 5 new records uploaded.',
        data: { type: 'system_status', syncCount: 5 },
        channelId: 'system-alerts'
      }
    };

    const notification = notifications[type] || notifications.basic;
    
    try {
      const id = await this.scheduleNotification(notification);
      console.log(`📱 ${type} test notification sent:`, id);
      return id;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // Schedule delayed notification
  async scheduleDelayedNotification(title, body, delaySeconds, data = {}) {
    return await this.scheduleNotification({
      title,
      body,
      data,
      trigger: { seconds: delaySeconds },
    });
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('🗑️ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  // Get pending notifications
  async getPendingNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Pending notifications:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    console.log('🧹 Notification service cleaned up');
  }

  // Patient-specific notifications
  async notifyPatientAdded(patientName, village) {
    return await this.sendNotification(
      '✅ Patient Registered',
      `${patientName} from ${village} has been successfully added to the system.`,
      { 
        type: 'patient_added', 
        patientName,
        village,
        timestamp: new Date().toISOString()
      }
    );
  }

  async notifyPatientReminder(patientName, condition, daysOverdue = 0) {
    const urgency = daysOverdue > 7 ? '🚨 URGENT' : daysOverdue > 3 ? '⚠️ Important' : '📅 Reminder';
    
    return await this.scheduleNotification({
      title: `${urgency}: Follow-up Required`,
      body: `Patient ${patientName} needs follow-up for ${condition}${daysOverdue > 0 ? ` (${daysOverdue} days overdue)` : ''}`,
      data: { 
        type: 'patient_reminder', 
        patientName,
        condition,
        daysOverdue,
        timestamp: new Date().toISOString()
      },
      channelId: 'patient-reminders',
      priority: daysOverdue > 3 ? 'high' : 'normal'
    });
  }

  async notifySystemSync(syncedCount, failedCount = 0) {
    const title = failedCount > 0 ? '⚠️ Partial Sync Complete' : '✅ Data Sync Complete';
    const body = `${syncedCount} patients synced successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`;
    
    return await this.sendNotification(title, body, {
      type: 'system_sync',
      syncedCount,
      failedCount,
      timestamp: new Date().toISOString()
    });
  }
}

export default new NotificationService();
