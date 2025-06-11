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
  Platform,
  Dimensions,
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
  ProgressLog,
  ApiResponse
} from '../../api/progressService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { API_BASE_URL } from '../../api/apiConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const MAX_PHOTOS = 5;
const MAX_IMAGE_DIMENSION = 1200; // Maximum width or height
const JPEG_QUALITY = 0.8; // 80% quality for JPEG compression

const ProgressLogEntryScreen = () => {
  const navigation = useNavigation<ProgressLogEntryNavigationProp>();
  const route = useRoute<ProgressLogEntryScreenRouteProp>();
  const { user, token } = useAuth();
  const serverRoot = API_BASE_URL.replace('/api', '');

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

  const requestPermissions = async () => {
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!mediaLibraryPermission.granted && !cameraPermission.granted) {
      Alert.alert(
        "Permissions Required",
        "You need to allow access to your camera and photos to use this feature.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const processImage = async (uri: string): Promise<ImageManipulator.ImageResult> => {
    try {
      // Get image dimensions
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
        Image.getSize(uri, (width, height) => {
          resolve({ width, height });
        });
      });

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;
      
      if (width > height && width > MAX_IMAGE_DIMENSION) {
        newWidth = MAX_IMAGE_DIMENSION;
        newHeight = (height * MAX_IMAGE_DIMENSION) / width;
      } else if (height > MAX_IMAGE_DIMENSION) {
        newHeight = MAX_IMAGE_DIMENSION;
        newWidth = (width * MAX_IMAGE_DIMENSION) / height;
      }

      // Process the image and ensure it's saved as JPEG
      return await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  const createFormDataWithPhotos = (photos: PhotoUpload[]): FormData => {
    const formData = new FormData();
    
    photos.forEach((photo, index) => {
      // Get the filename from the URI or create a new one
      const uriParts = photo.uri.split('/');
      const fileName = uriParts[uriParts.length - 1] || `photo_${Date.now()}_${index}.jpg`;
      
      // Create the file object with the correct structure
      const file = {
        uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
        type: 'image/jpeg',
        name: fileName.includes('.') ? fileName : `${fileName}.jpg`,
      };
      
      formData.append('progressPhotos', file as any);
    });
    
    return formData;
  };

  const uploadProgressPhotos = async (token: string, logId: string, photos: PhotoUpload[]): Promise<ApiResponse<ProgressLog>> => {
    if (photos.length === 0) {
      return { success: true, message: 'No photos to upload.' };
    }

    try {
      const formData = createFormDataWithPhotos(photos);

      const response = await fetch(`${API_BASE_URL}/progress/${logId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Photo upload error:', result);
        throw new Error(result.message || 'Failed to upload photos');
      }
      
      return result;
    } catch (error) {
      console.error('Error in uploadProgressPhotos:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error or unable to upload photos.',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      "Add Photo",
      "Choose a photo source",
      [
        {
          text: "Take Photo",
          onPress: () => pickImage('camera'),
        },
        {
          text: "Choose from Library",
          onPress: () => pickImage('library'),
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      if (!(await requestPermissions())) {
        return;
      }

      const remainingSlots = MAX_PHOTOS - (existingPhotoUrls.length + selectedPhotos.length);
      if (remainingSlots <= 0) {
        Alert.alert("Maximum Photos Reached", `You can only upload up to ${MAX_PHOTOS} photos per log.`);
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          ...options,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          ...options,
          allowsMultipleSelection: true,
          selectionLimit: remainingSlots,
        });
      }

      if (!result.canceled && result.assets) {
        const processedPhotos: PhotoUpload[] = [];
        
        for (const asset of result.assets.slice(0, remainingSlots)) {
          try {
            const processedImage = await processImage(asset.uri);
            const timestamp = Date.now();
            const index = processedPhotos.length;
            
            processedPhotos.push({
              uri: processedImage.uri,
              name: `photo_${timestamp}_${index}.jpg`,
              type: 'image/jpeg',
            });
          } catch (error) {
            console.error('Error processing photo:', error);
            Alert.alert(
              "Photo Processing Error",
              "There was an error processing one of your photos. Please try again with a different photo."
            );
          }
        }

        if (processedPhotos.length > 0) {
          setSelectedPhotos(prevPhotos => [...prevPhotos, ...processedPhotos]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        "Error",
        "There was an error accessing your photos. Please try again."
      );
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
      if (!isNaN(parsedBodyFat) && parsedBodyFat > 0 && parsedBodyFat < 100) {
        logData.bodyFatPercentage = parsedBodyFat;
      }
    }
    
    const processedMeasurements: Partial<MeasurementData> = {};
    let hasNumericMeasurements = false;

    (Object.keys(measurementsConfig) as Array<keyof typeof measurementsConfig>).forEach(key => {
      if (key === 'notes') return;
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
      if (!logData.measurements) logData.measurements = {};
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
        }
      }
      
      if (operationSuccess) {
        Alert.alert('Success', logToEdit ? 'Progress log updated successfully!' : 'Progress log saved successfully!');
        navigation.goBack();
      }

    } catch (error) {
      console.error("handleSubmit error:", error);
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCard = (title: string, children: React.ReactNode) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInputField = (
    label: string, 
    value: string, 
    onChangeText: (text: string) => void, 
    keyboardType: 'default' | 'numeric' = 'default',
    placeholder?: string,
    multiline?: boolean
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholderTextColor="#999"
      />
    </View>
  );

  const renderPhotoSection = () => (
    <View style={styles.photoSection}>
      <View style={styles.photoGrid}>
        {existingPhotoUrls.map(url => (
          <View key={url} style={styles.photoItem}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('PhotoViewer', { 
                photoUrls: [url], 
                logDate: date.toISOString() 
              })}
            >
              <Image 
                source={{ uri: url.startsWith('http') ? url : `${serverRoot}${url}` }} 
                style={styles.photo}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => removeExistingPhoto(url)} 
              style={styles.removeButton}
            >
              <Icon name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
        {selectedPhotos.map(photo => (
          <View key={photo.uri} style={styles.photoItem}>
            <TouchableOpacity
              onPress={() => navigation.navigate('PhotoViewer', { 
                photoUrls: [photo.uri], 
                logDate: date.toISOString() 
              })}
            >
              <Image source={{ uri: photo.uri }} style={styles.photo} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => removeSelectedPhoto(photo.uri)} 
              style={styles.removeButton}
            >
              <Icon name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
        {(existingPhotoUrls.length + selectedPhotos.length) < MAX_PHOTOS && (
          <TouchableOpacity 
            style={styles.addPhotoButton} 
            onPress={showImageSourceOptions}
          >
            <Icon name="camera-plus" size={32} color="#007AFF" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Progress</Text>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {renderCard("Basic Info", (
          <>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={showDatePicker}
            >
              <Icon name="calendar" size={24} color="#007AFF" />
              <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {renderInputField("Weight (kg) *", weightKg, setWeightKg, "numeric", "e.g., 70.5")}
            {renderInputField("Body Fat (%)", bodyFatPercentage, setBodyFatPercentage, "numeric", "e.g., 15.2")}
          </>
        ))}

        {renderCard("Measurements", (
          <View style={styles.measurementsGrid}>
            {Object.entries(measurementsConfig).map(([key, config]) => {
              if (key === 'notes') return null;
              return renderInputField(
                config.label,
                measurements[key as keyof MeasurementData] || '',
                (text) => handleMeasurementChange(key as keyof MeasurementData, text),
                'numeric',
                config.placeholder
              );
            })}
          </View>
        ))}

        {renderCard("Notes", (
          renderInputField(
            "Additional Notes",
            measurements.notes || '',
            (text) => handleMeasurementChange('notes', text),
            'default',
            'Any additional notes...',
            true
          )
        ))}

        {renderCard("Progress Photos", renderPhotoSection())}
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f0f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoSection: {
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: (Dimensions.get('window').width - 80) / 3,
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
  },
  addPhotoButton: {
    width: (Dimensions.get('window').width - 80) / 3,
    aspectRatio: 1,
    backgroundColor: '#f0f0f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ProgressLogEntryScreen; 