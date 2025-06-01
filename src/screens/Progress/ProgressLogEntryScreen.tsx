import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ProgressLogEntryScreenParams } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import {
  addProgressLog,
  updateProgressLog,
  uploadProgressPhotos,
  ProgressLogInputData,
  MeasurementData,
  PhotoUpload,
  ProgressLog
} from '../../api/progressService';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../../api/apiConfig';

// Define RouteProp for type safety with route.params
type ProgressLogEntryScreenRouteProp = RouteProp<RootStackParamList, 'ProgressLogEntry'>;

type ProgressLogEntryNavigationProp = StackNavigationProp<RootStackParamList, 'ProgressLogEntry'>;

// Helper configuration for measurement fields
const measurementsConfig: Record<Exclude<keyof MeasurementData, 'notes'>, { label: string; placeholder?: string }> & { notes: { label: string; placeholder?: string } } = {
    chestCm: { label: 'Chest (cm)', placeholder: 'e.g., 100' },
    waistCm: { label: 'Waist (cm)', placeholder: 'e.g., 80' },
    hipsCm: { label: 'Hips (cm)', placeholder: 'e.g., 95' },
    leftArmCm: { label: 'Left Arm (cm)', placeholder: 'e.g., 35' },
    rightArmCm: { label: 'Right Arm (cm)', placeholder: 'e.g., 35' },
    leftThighCm: { label: 'Left Thigh (cm)', placeholder: 'e.g., 55' },
    rightThighCm: { label: 'Right Thigh (cm)', placeholder: 'e.g., 55' },
    notes: { label: 'Notes', placeholder: 'Any additional notes...' }, // Notes is handled separately for multiline
};

const ProgressLogEntryScreen = () => {
  const navigation = useNavigation<ProgressLogEntryNavigationProp>();
  const route = useRoute<ProgressLogEntryScreenRouteProp>();
  const { user, token } = useAuth();

  const logToEdit = route.params?.existingLogData;

  const [date, setDate] = useState(logToEdit ? new Date(logToEdit.date) : new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [weightKg, setWeightKg] = useState<string>(logToEdit ? String(logToEdit.weightKg) : '');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<string>(logToEdit && logToEdit.bodyFatPercentage ? String(logToEdit.bodyFatPercentage) : '');
  const [measurements, setMeasurements] = useState<Partial<Record<keyof MeasurementData, string>>>(() => {
    if (logToEdit && logToEdit.measurements) {
      const initialMeasurements: Partial<Record<keyof MeasurementData, string>> = {};
      for (const key in logToEdit.measurements) {
        initialMeasurements[key as keyof MeasurementData] = String(logToEdit.measurements[key as keyof MeasurementData]);
      }
      return initialMeasurements;
    }
    return {};
  });
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoUpload[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>(logToEdit?.photoUrls || []);
  const [isLoading, setIsLoading] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (selectedDate: Date) => {
    hideDatePicker();
    setDate(selectedDate || new Date()); // Ensure date is not null
  };

  const handleMeasurementChange = (key: keyof MeasurementData, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You need to allow access to your photos to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos: PhotoUpload[] = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}.${asset.uri.split('.').pop()}`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setSelectedPhotos(prevPhotos => [...prevPhotos, ...newPhotos].slice(0, 5));
    }
  };

  const removeSelectedPhoto = (uri: string) => {
    setSelectedPhotos(prevPhotos => prevPhotos.filter(photo => photo.uri !== uri));
  };

  const removeExistingPhoto = (url: string) => {
    Alert.alert(
      "Confirm Delete", 
      "Are you sure you want to remove this photo? This will be permanent after saving.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setExistingPhotoUrls(prevUrls => prevUrls.filter(photoUrl => photoUrl !== url));
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'Authentication details are missing.');
      return;
    }
    if (!weightKg.trim()) {
      Alert.alert('Error', 'Weight (kg) is required.');
      return;
    }

    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Error', 'Please enter a valid weight.');
      return;
    }

    const logData: ProgressLogInputData = {
      date: date.toISOString(),
      weightKg: parsedWeight,
    };

    if (bodyFatPercentage.trim()) {
      const parsedBodyFat = parseFloat(bodyFatPercentage);
      if (!isNaN(parsedBodyFat) && parsedBodyFat > 0 && parsedBodyFat < 100) { // Basic validation for % fat
        logData.bodyFatPercentage = parsedBodyFat;
      }
    }
    
    const processedMeasurements: Partial<MeasurementData> = {};
    let hasNumericMeasurements = false;

    (Object.keys(measurementsConfig) as Array<keyof typeof measurementsConfig>).forEach(key => {
        if (key === 'notes') return; // Skip notes for numeric processing
        const val = measurements[key];
        if (typeof val === 'string' && val.trim() !== '') {
            const numVal = parseFloat(val);
            if (!isNaN(numVal) && numVal > 0) {
                processedMeasurements[key] = numVal;
                hasNumericMeasurements = true;
            }
        }
    });

    if (hasNumericMeasurements) {
        logData.measurements = { ...logData.measurements, ...processedMeasurements };
    }

    if (measurements.notes && measurements.notes.trim() !== '') {
        if (!logData.measurements) logData.measurements = {}; // Initialize if not set by numeric fields
        logData.measurements.notes = measurements.notes.trim();
    }

    setIsLoading(true);
    try {
      let logIdToUse: string | undefined = logToEdit?._id;
      let operationSuccess = false;

      if (logToEdit && logIdToUse) {
        const updatePayload: Partial<ProgressLogInputData> = { ...logData };
        if (logToEdit.photoUrls?.join(',') !== existingPhotoUrls.join(',')) {
            (updatePayload as any).photoUrls = existingPhotoUrls;
        }

        const response = await updateProgressLog(token, logIdToUse, updatePayload);
        if (response.success) {
          operationSuccess = true;
        } else {
          Alert.alert('Error Updating', response.message || 'Failed to update progress log details.');
        }
      } else {
        const response = await addProgressLog(token, logData);
        if (response.success && response.log?._id) {
          logIdToUse = response.log._id;
          operationSuccess = true;
        } else {
          Alert.alert('Error Saving', response.message || 'Failed to save progress log details.');
        }
      }

      if (operationSuccess && logIdToUse && selectedPhotos.length > 0) {
        const photoUploadResponse = await uploadProgressPhotos(token, logIdToUse, selectedPhotos);
        if (!photoUploadResponse.success) {
          Alert.alert('Photo Upload Error', photoUploadResponse.message || 'Some photos could not be uploaded.');
        } else {
        }
      }
      
      if (operationSuccess) {
        Alert.alert('Success', logToEdit ? 'Progress log updated successfully!' : 'Progress log saved successfully!');
        navigation.goBack();
      }

    } catch (error) {
      console.error("handleSubmit error:", error)
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Log Your Progress</Text>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity onPress={showDatePicker} style={styles.datePickerButton}>
            <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        
        <Text style={styles.label}>Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="numeric"
          placeholder="e.g., 70.5"
        />

        <Text style={styles.label}>Body Fat (%) (Optional)</Text>
        <TextInput
          style={styles.input}
          value={bodyFatPercentage}
          onChangeText={setBodyFatPercentage}
          keyboardType="numeric"
          placeholder="e.g., 15.2"
        />

        <Text style={styles.sectionTitle}>Measurements (Optional)</Text>
        {(Object.keys(measurementsConfig) as Array<keyof typeof measurementsConfig>).map(key => {
            const config = measurementsConfig[key];
            if (!config) return null;
            return (
                <View key={key}>
                    <Text style={styles.label}>{config.label}</Text>
                    <TextInput
                        style={key === 'notes' ? [styles.input, styles.multilineInput] : styles.input}
                        value={String(measurements[key] || '')}
                        onChangeText={(text) => handleMeasurementChange(key, text)}
                        keyboardType={key === 'notes' ? 'default' : 'numeric'}
                        placeholder={config.placeholder}
                        multiline={key === 'notes'}
                        numberOfLines={key === 'notes' ? 3 : 1}
                    />
                </View>
            );
        })}
        
        <Text style={styles.sectionTitle}>Photos (Optional - Max 5)</Text>
        <View style={styles.photoSectionContainer}>
            {existingPhotoUrls.map(url => (
              <View key={url} style={styles.thumbnailContainer}>
                <Image source={{ uri: `${API_BASE_URL}${url}` }} style={styles.thumbnail} />
                <TouchableOpacity onPress={() => removeExistingPhoto(url)} style={styles.removeIconSmall}>
                    <Text style={styles.removeIconText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {selectedPhotos.map(photo => (
              <View key={photo.uri} style={styles.thumbnailContainer}>
                <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                <TouchableOpacity onPress={() => removeSelectedPhoto(photo.uri)} style={styles.removeIconSmall}>
                    <Text style={styles.removeIconText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
        {(existingPhotoUrls.length + selectedPhotos.length) < 5 && (
             <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <Text style={styles.addPhotoButtonText}>+ Add Photos</Text>
            </TouchableOpacity>
        )}
        
        <View style={styles.buttonContainer}>
            {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
            ) : (
            <Button title="Save Progress" onPress={handleSubmit} />
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40, // Ensure space for the button
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 15,
  },
  multilineInput: {
    height: 80, // Adjust height for multiline
    textAlignVertical: 'top', // Align text to top for multiline
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  datePickerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  datePickerText: {
    fontSize: 16,
    color: '#007AFF',
  },
  buttonContainer: {
      marginTop: 30,
  },
  removeIconSmall: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  photoSectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  thumbnailContainer: {
    margin: 5,
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addPhotoButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addPhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ProgressLogEntryScreen; 