import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import { CommonActions } from '@react-navigation/native';

type ActivityLevelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActivityLevel'>;

interface ActivityLevelScreenProps {
  navigation: ActivityLevelScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const activityLevels = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    subtitle: 'Little or no exercise',
    description: 'Desk job, minimal movement',
    icon: '🪑',
    gradient: ['#FFF3E0', '#FF9800'],
    multiplier: '1.2x BMR',
  },
  {
    id: 'lightly_active',
    title: 'Lightly Active',
    subtitle: 'Light exercise 1-3 days/week',
    description: 'Walks, light yoga',
    icon: '🚶‍♀️',
    gradient: ['#E8F5E8', '#4CAF50'],
    multiplier: '1.375x BMR',
  },
  {
    id: 'moderately_active',
    title: 'Moderately Active',
    subtitle: 'Moderate exercise 3-5 days/week',
    description: 'Regular gym sessions',
    icon: '🏃‍♂️',
    gradient: ['#E3F2FD', '#2196F3'],
    multiplier: '1.55x BMR',
  },
  {
    id: 'very_active',
    title: 'Very Active',
    subtitle: 'Hard exercise 6-7 days/week',
    description: 'Daily workouts or physical job',
    icon: '🏋️‍♂️',
    gradient: ['#D1FAE5', '#10B981'],
    multiplier: '1.725x BMR',
  },
  {
    id: 'extremely_active',
    title: 'Extremely Active',
    subtitle: 'Very hard exercise, physical job',
    description: 'Intense training or very physical work',
    icon: '🏃‍♂️',
    gradient: ['#FEE2E2', '#EF4444'],
    multiplier: '1.9x BMR',
  },
];

const ActivityLevelScreen: React.FC<ActivityLevelScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext, isAuthenticated } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(user?.profile?.activityLevel || null);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
  }>({ visible: false, title: '', message: '', buttons: [] });

  // Check if this is profile editing (user already authenticated and has profile) or initial onboarding
  const isProfileEditing = isAuthenticated && !!user?.profile?.gender;

  const showAlert = (title: string, message: string, iconName?: keyof typeof Ionicons.glyphMap) => {
    setAlertInfo({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
      iconName,
    });
  };

  const handleBackPress = () => {
    if (isProfileEditing) {
      // If editing profile, go back to profile
      navigation.goBack();
    } else if (navigation.canGoBack()) {
      // If there's a previous screen, go back
      navigation.goBack();
    } else {
      // If no previous screen (fallback), go to Welcome
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      );
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
  };

  const handleContinue = async () => {
    if (!selectedLevel) {
      showAlert('Selection Required', 'Please select your activity level to continue.', 'alert-circle-outline');
      return;
    }

    if (!user || !token) {
      showAlert('Authentication Error', 'You must be logged in to continue.', 'alert-circle-outline');
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
        showAlert('Update Failed', response.message || 'Could not save your activity level.', 'close-circle-outline');
      }
    } catch (error) {
      console.error('Failed to update activity level:', error);
      showAlert('Error', 'An unexpected error occurred while saving your activity level.', 'alert-circle-outline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us your activity level</Text>
          <Text style={styles.subtitle}>This helps tailor your fitness plan perfectly.</Text>
        </View>

        <View style={styles.optionsContainer}>
          {activityLevels.map((level) => {
            const isSelected = selectedLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.optionCard, isSelected && styles.selectedOptionCard]}
                onPress={() => handleLevelSelect(level.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{level.icon}</Text>
                </View>
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
          onPress={handleContinue}
          disabled={isLoading || !selectedLevel}
        >
          {isLoading ? (
            <ActivityIndicator color="#191E29" />
          ) : (
            <Text style={styles.nextButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        iconName={alertInfo.iconName}
        iconColor={alertInfo.iconName?.includes('alert') || alertInfo.iconName?.includes('close') ? '#FF6B6B' : '#01D38D'}
        onClose={() => setAlertInfo(prev => ({ ...prev, visible: false }))}
      />
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  icon: {
    fontSize: 20,
    color: '#FFFFFF',
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