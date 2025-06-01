import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';

type CreatePlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePlan'>;

const CreatePlanScreen = () => {
  const navigation = useNavigation<CreatePlanScreenNavigationProp>();

  const handleAIGenerate = () => {
    // Navigate to AI Plan Generation Flow (to be created)
    alert('Navigate to AI Plan Generation - Coming Soon!');
    // navigation.navigate('AIWorkoutPlanner'); 
  };

  const handleManualCreate = () => {
    // Navigate to Manual Plan Creation Flow (to be created)
    // alert('Navigate to Manual Plan Creation - Coming Soon!');
    navigation.navigate('ManualPlanCreator', { preSelectedExercises: undefined }); // Navigate to the new screen
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Your Workout Plan</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to build your next workout or diet regimen.
        </Text>

        <View style={styles.optionButtonContainer}>
          <Button 
            title="Generate with AI ✨"
            onPress={handleAIGenerate} 
          />
          <Text style={styles.optionDescription}>
            Let our AI craft a personalized plan based on your goals and profile.
          </Text>
        </View>

        <View style={styles.optionButtonContainer}>
          <Button 
            title="Create Manually 📝"
            onPress={handleManualCreate} 
          />
          <Text style={styles.optionDescription}>
            Build your own plan from scratch or by customizing existing workouts.
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
    backgroundColor: '#f0f2f5', // A slightly different background
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