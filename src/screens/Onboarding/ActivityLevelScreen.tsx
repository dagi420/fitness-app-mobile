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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';
import { Ionicons } from '@expo/vector-icons';

type ActivityLevelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActivityLevel'>;

interface ActivityLevelScreenProps {
  navigation: ActivityLevelScreenNavigationProp;
}

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise, desk job.',
    icon: 'desktop-outline' as const,
  },
  {
    id: 'lightly_active',
    title: 'Lightly Active',
    description: 'Light exercise or sports 1-3 days a week.',
    icon: 'walk-outline' as const,
  },
  {
    id: 'moderately_active',
    title: 'Moderately Active',
    description: 'Moderate exercise or sports 3-5 days a week.',
    icon: 'barbell-outline' as const,
  },
  {
    id: 'very_active',
    title: 'Very Active',
    description: 'Hard exercise or sports 6-7 days a week.',
    icon: 'bicycle-outline' as const,
  },
  {
    id: 'extremely_active',
    title: 'Extremely Active',
    description: 'Very hard daily exercise or physical job.',
    icon: 'flame-outline' as const,
  },
];

const ActivityLevelScreen: React.FC<ActivityLevelScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(user?.profile?.activityLevel || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!selectedLevel) {
      Alert.alert('Selection Required', 'Please select your activity level to continue.');
      return;
    }

    if (!user || !token) {
      Alert.alert('Authentication Error', 'You must be logged in to continue.');
      return;
    }

    setIsLoading(true);

    try {
      const profileData: OnboardingProfileData = {
        activityLevel: selectedLevel,
      };

      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        // Navigate to the next screen in your onboarding flow
        navigation.navigate('OnboardingSummary'); 
      } else {
        Alert.alert('Update Failed', response.message || 'Could not save your activity level.');
      }
    } catch (error) {
      console.error('Failed to update activity level:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving your activity level.');
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

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us your activity level</Text>
          <Text style={styles.subtitle}>This helps tailor your fitness plan perfectly.</Text>
        </View>

        <View style={styles.optionsContainer}>
          {ACTIVITY_LEVELS.map((level) => {
            const isSelected = selectedLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
                onPress={() => setSelectedLevel(level.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={level.icon}
                  size={30}
                  color={isSelected ? '#FFFFFF' : '#01D38D'}
                  style={styles.optionIcon}
                />
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, isSelected && styles.selectedOptionText]}>
                    {level.title}
                  </Text>
                  <Text style={[styles.optionDescription, isSelected && styles.selectedOptionText]}>
                    {level.description}
                  </Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInnerCircle} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, isLoading || !selectedLevel ? styles.disabledButton : {}]}
          onPress={handleNext}
          disabled={isLoading || !selectedLevel}
        >
          {isLoading ? (
            <ActivityIndicator color="#191E29" />
          ) : (
            <Text style={styles.nextButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 80, 
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#696E79',
    textAlign: 'center',
    maxWidth: '85%',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#2A2D32',
  },
  selectedOptionCard: {
    backgroundColor: '#01D38D',
    borderColor: '#01D38D',
  },
  optionIcon: {
    marginRight: 20,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  optionDescription: {
    color: '#A0A5B1',
    fontSize: 14,
    marginTop: 4,
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#696E79',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  radioCircleSelected: {
    borderColor: '#FFFFFF',
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#01D38D',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#2A2D32',
  },
});

export default ActivityLevelScreen; 