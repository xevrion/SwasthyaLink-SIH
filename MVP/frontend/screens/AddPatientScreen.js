import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';
import NotificationService from '../services/notificationService';

const AddPatientScreen = ({ navigation }) => {
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    village: '',
    healthIssue: '',
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const { name, age, village, healthIssue } = patientData;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter patient name');
      return false;
    }
    
    if (!age.trim() || isNaN(parseInt(age)) || parseInt(age) <= 0) {
      Alert.alert('Error', 'Please enter a valid age');
      return false;
    }
    
    if (!village.trim()) {
      Alert.alert('Error', 'Please enter village name');
      return false;
    }
    
    if (!healthIssue.trim()) {
      Alert.alert('Error', 'Please enter health issue');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await ApiService.addPatient(patientData);
      
      if (response.success) {
        // Send automatic notification for successful patient addition
        try {
          await NotificationService.notifyPatientAdded(patientData.name, patientData.village);
          console.log('✅ Automatic notification sent for new patient');
        } catch (notificationError) {
          console.warn('⚠️ Failed to send automatic notification:', notificationError);
          // Don't block the success flow if notification fails
        }
        
        Alert.alert(
          'Success', 
          'Patient added successfully!',
          [
            {
              text: 'Add Another',
              onPress: () => {
                setPatientData({
                  name: '',
                  age: '',
                  gender: 'Male',
                  village: '',
                  healthIssue: '',
                });
              },
            },
            {
              text: 'View Patients',
              onPress: () => navigation.navigate('PatientList'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to add patient');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Patient</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Patient Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter patient name"
          value={patientData.name}
          onChangeText={(value) => updateField('name', value)}
          editable={!loading}
        />

        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter age"
          value={patientData.age}
          onChangeText={(value) => updateField('age', value)}
          keyboardType="numeric"
          editable={!loading}
        />

        <Text style={styles.label}>Gender *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={patientData.gender}
            onValueChange={(value) => updateField('gender', value)}
            enabled={!loading}
            style={styles.picker}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <Text style={styles.label}>Village *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter village name"
          value={patientData.village}
          onChangeText={(value) => updateField('village', value)}
          editable={!loading}
        />

        <Text style={styles.label}>Health Issue *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the health issue"
          value={patientData.healthIssue}
          onChangeText={(value) => updateField('healthIssue', value)}
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Add Patient</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPatientScreen;
