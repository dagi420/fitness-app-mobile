import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';
import { Ionicons } from '@expo/vector-icons';

type GoalSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GoalSelection'>;

interface GoalSelectionScreenProps {
  navigation: GoalSelectionScreenNavigationProp;
}

const GOALS = [
  { id: 'lose_weight', label: 'Lose Weight', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' },
  { id: 'gain_muscle', label: 'Build Muscle', imageUrl: 'https://images.unsplash.com/photo-1581009137052-c4097ada5828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' },
  { id: 'improve_stamina', label: 'Improve Endurance', imageUrl: 'https://images.unsplash.com/photo-1533460004989-74bb9414f534?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' },
  { id: 'flexibility', label: 'Increase Flexibility', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1220&q=80' },
  { id: 'stress_relief', label: 'Stress Relief', imageUrl: 'https://images.unsplash.com/photo-1591291621265-b0509a224a23?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' },
  { id: 'overall_fitness', label: 'Overall Fitness', imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80' },
];

const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user?.profile?.workoutGoals || []);
  const [isLoading, setIsLoading] = useState(false);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    );
  };

  const handleNext = async () => {
    if (selectedGoals.length === 0) {
      Alert.alert('Select Your Goals', 'Please choose at least one goal to proceed.');
      return;
    }
    if (!user || !token) {
      Alert.alert('Authentication Error', 'You must be logged in to continue.');
      return;
    }
    setIsLoading(true);
    try {
      const profileData: OnboardingProfileData = { workoutGoals: selectedGoals };
      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('UserDetails');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not save your goals.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>What's your goal?</Text>
        <Text style={styles.subtitle}>Select all that apply. This helps us create your personalized plan.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {GOALS.map(goal => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <TouchableOpacity key={goal.id} onPress={() => toggleGoal(goal.id)} activeOpacity={0.8}>
              <ImageBackground
                source={{ uri: goal.imageUrl }}
                style={[styles.goalCard, isSelected && styles.selectedGoalCard]}
                imageStyle={styles.goalImage}
              >
                <View style={styles.cardOverlay}>
                  <Text style={styles.goalLabel}>{goal.label}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={32} color="#01D38D" style={styles.checkmark} />}
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, selectedGoals.length === 0 || isLoading ? styles.disabledButton : {}]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0 || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#191E29" /> : <Text style={styles.nextButtonText}>Next</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#696E79',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  goalCard: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'flex-end',
  },
  selectedGoalCard: {
    borderColor: '#01D38D',
    borderWidth: 3,
  },
  goalImage: {
    borderRadius: 17,
  },
  cardOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkmark: {
    
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#191E29',
    borderTopWidth: 1,
    borderTopColor: '#132D46'
  },
  nextButton: {
    backgroundColor: '#01D38D',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#696E79',
  },
});

export default GoalSelectionScreen; 