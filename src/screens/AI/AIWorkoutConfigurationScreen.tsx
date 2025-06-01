import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, AIWorkoutConfigData } from '../../navigation/types';
import { Picker } from '@react-native-picker/picker';

type Props = StackScreenProps<RootStackParamList, 'AIWorkoutConfigurationScreen'>;

const AIWorkoutConfigurationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { onSubmit } = route.params;

  // Temporary state to hold the comma-separated string for availableEquipment
  const [equipmentInput, setEquipmentInput] = useState('Full Gym'); 

  const [config, setConfig] = useState<AIWorkoutConfigData>({
    fitnessGoal: 'Muscle Gain', // Default value
    fitnessLevel: 'Intermediate', // Default value
    gender: 'Male', // Default value
    workoutTypePreferences: 'Full Body', // Default, single string for now
    availableEquipment: ['Full Gym'], // Default as an array
    timePerSession: 60, // Default in minutes
    workoutsPerWeek: 3, // Default
    targetMuscleGroups: '',
    otherNotes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AIWorkoutConfigData, string>>>({});

  const handleInputChange = <K extends keyof AIWorkoutConfigData>(
    field: K,
    value: AIWorkoutConfigData[K]
  ) => {
    // For availableEquipment, we are updating the temporary string input
    // The actual parsing to array will happen in handleSubmit or a dedicated handler
    if (field === 'availableEquipment') {
      // This case should ideally not be hit directly if using setEquipmentInput for the text field
      // However, to be safe, if it is, we assume value is already string[] or convert it
      // For the TextInput, we use setEquipmentInput directly.
      // For other Picker inputs, this function works as is.
      setConfig(prev => ({ ...prev, [field]: value }));
    } else {
      setConfig(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  // Specific handler for the equipment text input
  const handleEquipmentInputChange = (text: string) => {
    setEquipmentInput(text);
    if (errors.availableEquipment) {
      setErrors(prev => ({ ...prev, availableEquipment: undefined }));
    }
  };

  const validateConfig = (): boolean => {
    const newErrors: Partial<Record<keyof AIWorkoutConfigData, string>> = {};
    if (!config.fitnessGoal) newErrors.fitnessGoal = 'Fitness Goal is required.';
    if (!config.fitnessLevel) newErrors.fitnessLevel = 'Fitness Level is required.';
    if (!config.gender) newErrors.gender = 'Gender is required.';
    if (!config.workoutTypePreferences) newErrors.workoutTypePreferences = 'Workout Type is required.';
    
    // Validate the equipmentInput string before parsing, or the parsed array
    const equipmentArray = equipmentInput.split(',').map(e => e.trim()).filter(e => e);
    if (equipmentArray.length === 0 && equipmentInput.trim() !== '') { // handles if only commas are entered
        newErrors.availableEquipment = 'Please provide valid, comma-separated equipment.';
    } else if (equipmentArray.length === 0 && equipmentInput.trim() === '') { // handles if input is empty
        newErrors.availableEquipment = 'Available Equipment is required.';
    }

    if (config.timePerSession <= 0) newErrors.timePerSession = 'Time per session must be positive.';
    if (config.workoutsPerWeek <= 0) newErrors.workoutsPerWeek = 'Workouts per week must be positive.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    // Parse the equipmentInput string into an array
    const parsedEquipment = equipmentInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e); // Remove empty strings

    const currentConfig: AIWorkoutConfigData = {
        ...config,
        availableEquipment: parsedEquipment,
    };
    
    // Re-validate with the parsed equipment
    const tempErrors: Partial<Record<keyof AIWorkoutConfigData, string>> = {};
    if (!currentConfig.fitnessGoal) tempErrors.fitnessGoal = 'Fitness Goal is required.';
    if (!currentConfig.fitnessLevel) tempErrors.fitnessLevel = 'Fitness Level is required.';
    if (!currentConfig.gender) tempErrors.gender = 'Gender is required.';
    if (!currentConfig.workoutTypePreferences) tempErrors.workoutTypePreferences = 'Workout Type is required.';
    if (currentConfig.availableEquipment.length === 0) { // Check if the parsed array is empty
        tempErrors.availableEquipment = 'Available Equipment is required (e.g., Bodyweight, Dumbbells).';
    }
    if (currentConfig.timePerSession <= 0) tempErrors.timePerSession = 'Time per session must be positive.';
    if (currentConfig.workoutsPerWeek <= 0) tempErrors.workoutsPerWeek = 'Workouts per week must be positive.';
    
    setErrors(tempErrors);

    if (Object.keys(tempErrors).length === 0) {
      onSubmit(currentConfig); // Submit the config with parsed equipment
      navigation.goBack();
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly. Ensure equipment is comma-separated if multiple.');
    }
  };

  const pickerItemStyle = Platform.OS === 'ios' ? styles.pickerItemIOS : {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Configure AI Workout Plan</Text>
      <Text style={styles.subtitle}>Tell us your preferences so we can generate the best plan for you!</Text>

      {/* Fitness Goal */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Fitness Goal*</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={config.fitnessGoal}
            onValueChange={(itemValue) => handleInputChange('fitnessGoal', itemValue)}
            style={styles.picker}
            itemStyle={pickerItemStyle}
          >
            <Picker.Item label="Muscle Gain" value="Muscle Gain" />
            <Picker.Item label="Weight Loss" value="Weight Loss" />
            <Picker.Item label="Strength" value="Strength" />
            <Picker.Item label="Endurance" value="Endurance" />
            <Picker.Item label="General Fitness" value="General Fitness" />
          </Picker>
        </View>
        {errors.fitnessGoal && <Text style={styles.errorText}>{errors.fitnessGoal}</Text>}
      </View>

      {/* Fitness Level */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Fitness Level*</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={config.fitnessLevel}
            onValueChange={(itemValue) => handleInputChange('fitnessLevel', itemValue)}
            style={styles.picker}
            itemStyle={pickerItemStyle}
          >
            <Picker.Item label="Beginner" value="Beginner" />
            <Picker.Item label="Intermediate" value="Intermediate" />
            <Picker.Item label="Advanced" value="Advanced" />
          </Picker>
        </View>
        {errors.fitnessLevel && <Text style={styles.errorText}>{errors.fitnessLevel}</Text>}
      </View>
      
      {/* Gender */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Gender*</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={config.gender}
            onValueChange={(itemValue) => handleInputChange('gender', itemValue)}
            style={styles.picker}
            itemStyle={pickerItemStyle}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
            <Picker.Item label="Prefer not to say" value="Prefer not to say" />
          </Picker>
        </View>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>

      {/* Workout Type Preferences (TextInput for now, could be multi-select later) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Workout Type Preferences*</Text>
        <Text style={styles.inputHint}>E.g., Full Body, Upper/Lower, HIIT, Strength Training, Cardio</Text>
        <TextInput
          style={styles.input}
          value={config.workoutTypePreferences}
          onChangeText={(text) => handleInputChange('workoutTypePreferences', text)}
          placeholder="Enter preferred workout types"
        />
        {errors.workoutTypePreferences && <Text style={styles.errorText}>{errors.workoutTypePreferences}</Text>}
      </View>

      {/* Available Equipment (TextInput for now, to be parsed) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Available Equipment*</Text>
        <Text style={styles.inputHint}>Comma-separated: Bodyweight, Dumbbells, Barbell, Full Gym</Text>
        <TextInput
          style={styles.input}
          value={equipmentInput} // Use the temporary string state here
          onChangeText={handleEquipmentInputChange} // Use the new handler
          placeholder="e.g., Bodyweight, Dumbbells"
        />
        {errors.availableEquipment && <Text style={styles.errorText}>{errors.availableEquipment}</Text>}
      </View>

      {/* Time Per Session (Number Input like) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Time Per Session (minutes)*</Text>
        <TextInput
          style={styles.input}
          value={String(config.timePerSession)}
          onChangeText={(text) => handleInputChange('timePerSession', parseInt(text, 10) || 0)}
          placeholder="e.g., 60"
          keyboardType="numeric"
        />
        {errors.timePerSession && <Text style={styles.errorText}>{errors.timePerSession}</Text>}
      </View>

      {/* Workouts Per Week (Number Input like) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Workouts Per Week*</Text>
        <TextInput
          style={styles.input}
          value={String(config.workoutsPerWeek)}
          onChangeText={(text) => handleInputChange('workoutsPerWeek', parseInt(text, 10) || 0)}
          placeholder="e.g., 3"
          keyboardType="numeric"
        />
        {errors.workoutsPerWeek && <Text style={styles.errorText}>{errors.workoutsPerWeek}</Text>}
      </View>

      {/* Target Muscle Groups (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Target Muscle Groups (Optional)</Text>
        <Text style={styles.inputHint}>E.g., Chest, Back, Legs, Core. Leave blank if none specific.</Text>
        <TextInput
          style={styles.input}
          value={config.targetMuscleGroups}
          onChangeText={(text) => handleInputChange('targetMuscleGroups', text)}
          placeholder="List target muscle groups (comma-separated)"
        />
      </View>

      {/* Other Notes (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Other Notes/Restrictions (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={config.otherNotes}
          onChangeText={(text) => handleInputChange('otherNotes', text)}
          placeholder="Any other preferences, injuries, or notes for the AI?"
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Generate Workout Plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    overflow: 'hidden', // For iOS to respect border radius with Picker
  },
  picker: {
    // height: Platform.OS === 'ios' ? undefined : 50, // iOS height is intrinsic
    // No specific height for picker itself, wrapper handles visual box
  },
  pickerItemIOS: { // Specific styling for iOS Picker items if needed
    // height: 120, // Example: For taller picker items on iOS
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30, // Extra space at bottom
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AIWorkoutConfigurationScreen; 