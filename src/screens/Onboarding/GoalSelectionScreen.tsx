import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// import { NavigationProp } from '@react-navigation/native'; // Keep if other general props are needed
import { StackNavigationProp } from '@react-navigation/stack'; // Correct import for StackNavigationProp
import { RootStackParamList } from '../../navigation/types'; // Adjust path as needed

type GoalSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface GoalSelectionScreenProps {
  navigation: GoalSelectionScreenNavigationProp;
}

const GOALS = [
  { id: 'lose_weight', label: 'Losing Weight' },
  { id: 'gain_muscle', label: 'Gaining Muscle' },
  { id: 'improve_stamina', label: 'Improve Stamina' },
  { id: 'flexibility', label: 'Increase Flexibility' },
  { id: 'stress_relief', label: 'Stress Relief' },
  { id: 'overall_fitness', label: 'Overall Fitness' },
];

const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ navigation }) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    );
  };

  const handleNext = () => {
    console.log('Selected Goals:', selectedGoals);
    navigation.navigate('UserDetails'); // Navigate to UserDetailsScreen
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>What are your fitness goals?</Text>
      <Text style={styles.subtitle}>Select all that apply. This will help us personalize your plan.</Text>
      {GOALS.map(goal => (
        <TouchableOpacity
          key={goal.id}
          style={[
            styles.goalButton,
            selectedGoals.includes(goal.id) && styles.selectedGoalButton,
          ]}
          onPress={() => toggleGoal(goal.id)}
        >
          <Text
            style={[
              styles.goalButtonText,
              selectedGoals.includes(goal.id) && styles.selectedGoalButtonText,
            ]}
          >
            {goal.label}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={selectedGoals.length === 0}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  goalButton: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedGoalButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  goalButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedGoalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  nextButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GoalSelectionScreen; 