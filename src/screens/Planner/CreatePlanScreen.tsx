import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, AIPlanConfigData, AIWorkoutConfigData } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../store/AuthContext';
import { generateAIWorkoutPlan } from '../../api/workoutService';
import { generateAIDietPlan } from '../../api/dietService';

type CreatePlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePlan'>;

const CreatePlanScreen = () => {
  const navigation = useNavigation<CreatePlanScreenNavigationProp>();
  const { user, token } = useAuth();
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);

  const handleAIDietGenerate = () => {
    if (!user || !token) {
      Alert.alert("Authentication Error", "User not authenticated.");
      return;
    }
    navigation.navigate('AIConfigurationScreen', {
      onSubmit: async (config: AIPlanConfigData) => {
        setIsGeneratingDiet(true);
        Alert.alert("AI Diet Generation", "Generating your personalized diet plan... Please wait.");
        try {
          const response = await generateAIDietPlan(token, config);
          if (response.success && response.plan) {
            Alert.alert("Success", "AI diet plan generated successfully!");
            navigation.navigate('MainApp', { screen: 'Diet', params: { refresh: true } as any });
          } else {
            Alert.alert("Error", response.message || "Failed to generate AI diet plan.");
          }
        } catch (apiError) {
          Alert.alert("Error", apiError instanceof Error ? apiError.message : "An unexpected error occurred.");
        } finally {
          setIsGeneratingDiet(false);
        }
      }
    });
  };

  const handleAIWorkoutGenerate = () => {
    if (!user || !token) {
      Alert.alert("Authentication Error", "User not authenticated.");
      return;
    }
    navigation.navigate('AIWorkoutConfigurationScreen', {
      onSubmit: async (config: AIWorkoutConfigData) => {
        setIsGeneratingWorkout(true);
        Alert.alert("AI Workout Generation", "Generating your personalized workout plan... Please wait.");
        try {
          const response = await generateAIWorkoutPlan(token, config);
          if (response.success && response.plan) {
            Alert.alert("Success", "AI workout plan generated successfully!");
            navigation.navigate('MainApp', { screen: 'Workouts', params: { screen: 'WorkoutList' } });
          } else {
            Alert.alert("Error", response.message || "Failed to generate AI workout plan.");
          }
        } catch (apiError) {
          Alert.alert("Error", apiError instanceof Error ? apiError.message : "An unexpected error occurred.");
        } finally {
          setIsGeneratingWorkout(false);
        }
      }
    });
  };

  const handleManualCreate = () => {
    navigation.navigate('ManualPlanCreator', { preSelectedExercises: undefined });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Your Next Plan</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to build your next workout or diet regimen.
        </Text>

        <View style={styles.optionButtonContainer}>
          {isGeneratingDiet ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Button 
              title="AI Generate Diet Plan 🥗"
              onPress={handleAIDietGenerate} 
              disabled={isGeneratingDiet}
            />
          )}
          <Text style={styles.optionDescription}>
            Let our AI craft a personalized diet plan based on your goals and profile.
          </Text>
        </View>

        <View style={styles.optionButtonContainer}>
          {isGeneratingWorkout ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Button 
              title="AI Generate Workout Plan 💪"
              onPress={handleAIWorkoutGenerate} 
              disabled={isGeneratingWorkout}
            />
          )}
          <Text style={styles.optionDescription}>
            Let our AI craft a personalized workout plan for your fitness goals.
          </Text>
        </View>

        <View style={styles.optionButtonContainer}>
          <Button 
            title="Create Workout Manually 📝"
            onPress={handleManualCreate} 
          />
          <Text style={styles.optionDescription}>
            Build your own workout plan from scratch by selecting exercises.
          </Text>
        </View>

        <View style={styles.closeButtonContainer}>
            <Button title="Close" onPress={() => navigation.goBack()} color="#888"/>
        </View>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionButtonContainer: {
    width: '90%',
    minHeight: 100,
    justifyContent: 'center',
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
  },
  closeButtonContainer: {
    marginTop: 20,
    width: '90%',
  }
});

export default CreatePlanScreen; 