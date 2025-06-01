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
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList, AIPlanConfigData } from '../../navigation/types';
import { Picker } from '@react-native-picker/picker';

type AIConfigurationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AIConfigurationScreen'>;
type AIConfigurationScreenRouteProp = RouteProp<RootStackParamList, 'AIConfigurationScreen'>;

const GOAL_OPTIONS = ["Weight Loss", "Muscle Gain", "Maintenance", "Improve Performance", "General Health"]; // Example goals

const AIConfigurationScreen = () => {
  const navigation = useNavigation<AIConfigurationScreenNavigationProp>();
  const route = useRoute<AIConfigurationScreenRouteProp>();
  const { onSubmit } = route.params;

  const [goal, setGoal] = useState(GOAL_OPTIONS[0]); // Default to first option
  const [foodPreferences, setFoodPreferences] = useState('');
  const [supplements, setSupplements] = useState('');
  const [otherNotes, setOtherNotes] = useState('');

  const handleSubmit = () => {
    if (!goal) {
      Alert.alert('Missing Info', 'Please select a primary goal.');
      return;
    }
    const configData: AIPlanConfigData = {
      goal,
      foodPreferences: foodPreferences.trim(),
      supplements: supplements.trim(),
      otherNotes: otherNotes.trim(),
    };
    onSubmit(configData);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Configure AI Diet Plan</Text>
        <Text style={styles.instructions}>
          Provide more details to help the AI create a personalized plan for you.
        </Text>

        <Text style={styles.label}>Primary Goal for this Plan:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={goal}
            onValueChange={(itemValue, itemIndex) => setGoal(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {GOAL_OPTIONS.map(opt => (
              <Picker.Item key={opt} label={opt} value={opt} />
            ))}
          </Picker>
        </View>
        
        <Text style={styles.label}>Food Preferences/Restrictions:</Text>
        <TextInput
          style={styles.textInputLarge}
          placeholder="e.g., Love chicken, allergic to peanuts, dislike fish, prefer low-carb..."
          value={foodPreferences}
          onChangeText={setFoodPreferences}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Available Supplements:</Text>
        <TextInput
          style={styles.textInputLarge}
          placeholder="e.g., Whey protein, creatine, vitamin D... (optional)"
          value={supplements}
          onChangeText={setSupplements}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Other Specific Notes for AI:</Text>
        <TextInput
          style={styles.textInputLarge}
          placeholder="e.g., Prefer quick 30-min meals, need gluten-free options... (optional)"
          value={otherNotes}
          onChangeText={setOtherNotes}
          multiline
          numberOfLines={3}
        />

        <View style={styles.submitButtonContainer}>
          <Button title="Generate Plan with AI" onPress={handleSubmit} color="#007AFF" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  instructions: {
    fontSize: 15,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#444',
  },
  textInputLarge: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlignVertical: 'top', // For multiline
    minHeight: 80, // Minimum height for multiline inputs
  },
  goalButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  goalButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    margin: 5,
  },
  goalButtonSelected: {
    backgroundColor: '#007AFF',
  },
  goalButtonText: {
    fontSize: 14,
    color: '#333',
  },
  goalButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12, 
    justifyContent: 'center', // Centers picker content on Android
  },
  picker: {
    // height: 50, // On Android, height can be an issue, sometimes better to let container define height
    // width: '100%', // Ensure it takes full width of container
  },
  pickerItem: {
    // For iOS, you can style the items, e.g., height, color
    // height: 120, // Example for iOS item height to make it more touch-friendly
  },
  submitButtonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
});

export default AIConfigurationScreen; 