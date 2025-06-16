import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import {
  addProgressLog,
  updateProgressLog,
  uploadProgressPhotos,
  ProgressLogInputData,
  MeasurementData,
  PhotoUpload,
  ProgressLog,
} from '../../api/progressService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { API_BASE_URL } from '../../api/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

type ProgressLogEntryScreenRouteProp = RouteProp<RootStackParamList, 'ProgressLogEntry'>;
type ProgressLogEntryNavigationProp = StackNavigationProp<RootStackParamList, 'ProgressLogEntry'>;

const measurementsConfig: Record<Exclude<keyof MeasurementData, 'notes'>, { label: string; placeholder?: string }> & { notes: { label: string; placeholder?: string } } = {
    chestCm: { label: 'Chest', placeholder: 'cm' },
    waistCm: { label: 'Waist', placeholder: 'cm' },
    hipsCm: { label: 'Hips', placeholder: 'cm' },
    leftArmCm: { label: 'Left Arm', placeholder: 'cm' },
    rightArmCm: { label: 'Right Arm', placeholder: 'cm' },
    leftThighCm: { label: 'Left Thigh', placeholder: 'cm' },
    rightThighCm: { label: 'Right Thigh', placeholder: 'cm' },
    notes: { label: 'Notes', placeholder: 'Any additional notes...' },
};

const MAX_PHOTOS = 5;
const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

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

  const handleConfirmDate = (selectedDate: Date) => {
    setDatePickerVisibility(false);
    setDate(selectedDate || new Date());
  };
  
  const handleMeasurementChange = (key: keyof MeasurementData, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const requestPermissions = async () => {
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaLibraryStatus !== 'granted') {
      Alert.alert("Permission Required", "Please grant access to your photo library.");
      return false;
    }
    return true;
  };
  
  const processImage = async (uri: string): Promise<ImageManipulator.ImageResult> => {
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
        Image.getSize(uri, (width, height) => resolve({ width, height }));
      });

      let newWidth = width, newHeight = height;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if(width > height) {
              newWidth = MAX_IMAGE_DIMENSION;
              newHeight = height * (MAX_IMAGE_DIMENSION / width);
          } else {
              newHeight = MAX_IMAGE_DIMENSION;
              newWidth = width * (MAX_IMAGE_DIMENSION / height);
          }
      }
      return await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );
  };
  
  const showImageSourceOptions = () => {
    Alert.alert("Add Photo", "Choose a source", [
        { text: "Take Photo", onPress: () => pickImage('camera') },
        { text: "Choose from Library", onPress: () => pickImage('library') },
        { text: "Cancel", style: "cancel" }
    ]);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    if (!(await requestPermissions())) return;
    
    const remainingSlots = MAX_PHOTOS - (existingPhotoUrls.length + selectedPhotos.length);
    if (remainingSlots <= 0) {
      Alert.alert("Max Photos", `You can only upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1, // High quality for manipulation
    };
    
    let result;
    try {
        if (source === 'camera') {
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            result = await ImagePicker.launchImageLibraryAsync({ ...options, selectionLimit: remainingSlots, allowsMultipleSelection: true });
        }

        if (!result.canceled && result.assets) {
            const processed: PhotoUpload[] = [];
            for (const asset of result.assets) {
                const pImage = await processImage(asset.uri);
                processed.push({
                    uri: pImage.uri,
                    name: `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                });
            }
            setSelectedPhotos(prev => [...prev, ...processed]);
        }
    } catch (error) {
        console.error("Image picking error:", error);
        Alert.alert("Error", "Could not process image. Please try again.");
    }
  };

  const removePhoto = (uri: string, type: 'new' | 'existing') => {
      if(type === 'new') {
        setSelectedPhotos(prev => prev.filter(p => p.uri !== uri));
      } else {
        setExistingPhotoUrls(prev => prev.filter(url => url !== uri));
      }
  };

  const handleSubmit = async () => {
    if (!user || !token || !weightKg.trim()) {
      Alert.alert('Missing Info', 'Weight is required.');
      return;
    }
    
    setIsLoading(true);

    const logData: ProgressLogInputData = {
      date: date.toISOString(),
      weightKg: parseFloat(weightKg),
      bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
      measurements: Object.entries(measurements).reduce((acc, [key, value]) => {
          if(value) acc[key] = key === 'notes' ? value : parseFloat(value);
          return acc;
      }, {} as any)
    };

    try {
      let logId: string | undefined = logToEdit?._id;
      if (logToEdit) {
        const updatePayload: Partial<ProgressLog> = { ...logData, photoUrls: existingPhotoUrls };
        const response = await updateProgressLog(token, logToEdit._id, updatePayload);
        if (!response.success) throw new Error(response.message || "Failed to update log.");
      } else {
        const response = await addProgressLog(token, logData);
        if (!response.success || !response.log?._id) throw new Error(response.message || "Failed to create log.");
        logId = response.log._id;
      }
      
      if (logId && selectedPhotos.length > 0) {
        await uploadProgressPhotos(token, logId, selectedPhotos);
      }
      
      Alert.alert('Success', `Progress log ${logToEdit ? 'updated' : 'saved'}!`);
      navigation.goBack();

    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert('Error', error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{logToEdit ? 'Edit Log' : 'New Log'}</Text>
            <View style={{width: 24}}/>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Basic Info</Text>
                <TouchableOpacity style={styles.inputRow} onPress={() => setDatePickerVisibility(true)}>
                    <Ionicons name="calendar-outline" size={24} color="#A0A5B1" />
                    <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={() => setDatePickerVisibility(false)}
                    date={date}
                />
                <View style={styles.inputRow}>
                    <Ionicons name="scale-outline" size={24} color="#A0A5B1" />
                    <TextInput
                        style={styles.input}
                        placeholder="Weight (kg)"
                        placeholderTextColor="#696E79"
                        value={weightKg}
                        onChangeText={setWeightKg}
                        keyboardType="numeric"
                    />
                </View>
                <View style={[styles.inputRow, {borderBottomWidth: 0}]}>
                    <Ionicons name="body-outline" size={24} color="#A0A5B1" />
                    <TextInput
                        style={styles.input}
                        placeholder="Body Fat % (Optional)"
                        placeholderTextColor="#696E79"
                        value={bodyFatPercentage}
                        onChangeText={setBodyFatPercentage}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Measurements</Text>
                <View style={styles.measurementsGrid}>
                    {Object.entries(measurementsConfig).map(([key, config]) => {
                        if (key === 'notes') return null;
                        return (
                            <View key={key} style={styles.measurementItem}>
                                <Text style={styles.measurementLabel}>{config.label}</Text>
                                <TextInput
                                    style={styles.measurementInput}
                                    placeholder={config.placeholder}
                                    placeholderTextColor="#696E79"
                                    value={measurements[key as keyof MeasurementData] || ''}
                                    onChangeText={(text) => handleMeasurementChange(key as keyof MeasurementData, text)}
                                    keyboardType="numeric"
                                />
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Notes</Text>
                <TextInput
                    style={styles.notesInput}
                    placeholder="Any reflections, feelings, or details..."
                    placeholderTextColor="#696E79"
                    value={measurements.notes || ''}
                    onChangeText={(text) => handleMeasurementChange('notes', text)}
                    multiline
                />
            </View>
            
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Progress Photos</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoGrid}>
                    {existingPhotoUrls.map(url => (
                        <PhotoItem key={url} uri={`${serverRoot}${url}`} onRemove={() => removePhoto(url, 'existing')} />
                    ))}
                    {selectedPhotos.map(photo => (
                        <PhotoItem key={photo.uri} uri={photo.uri} onRemove={() => removePhoto(photo.uri, 'new')} />
                    ))}
                    {(existingPhotoUrls.length + selectedPhotos.length) < MAX_PHOTOS && (
                        <TouchableOpacity style={styles.addPhotoButton} onPress={showImageSourceOptions}>
                            <Ionicons name="add" size={32} color="#01D38D" />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </ScrollView>
        <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#191E29" /> : <Text style={styles.saveButtonText}>Save Progress</Text>}
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};

const PhotoItem = ({ uri, onRemove }) => (
    <View style={styles.photoItem}>
        <Image source={{ uri }} style={styles.photo} />
        <TouchableOpacity style={styles.removePhotoButton} onPress={onRemove}>
            <Ionicons name="close-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#191E29',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Space for footer
    },
    card: {
        backgroundColor: '#1E2328',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2D32',
        paddingVertical: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 15,
    },
    dateText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 15,
    },
    measurementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    measurementItem: {
        width: '48%',
        marginBottom: 15,
    },
    measurementLabel: {
        color: '#A0A5B1',
        fontSize: 14,
        marginBottom: 8,
    },
    measurementInput: {
        backgroundColor: '#2A2D32',
        color: '#FFFFFF',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    notesInput: {
        backgroundColor: '#2A2D32',
        color: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    photoGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    photoItem: {
        position: 'relative',
    },
    photo: {
        width: 100,
        height: 100,
        borderRadius: 15,
    },
    removePhotoButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#1E2328',
        borderRadius: 12,
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        borderRadius: 15,
        backgroundColor: '#2A2D32',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#191E29',
        borderTopWidth: 1,
        borderTopColor: '#2A2D32'
    },
    saveButton: {
        backgroundColor: '#01D38D',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#191E29',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ProgressLogEntryScreen; 