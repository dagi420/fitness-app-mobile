import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';

type ActivityLevelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActivityLevel'>;

interface ActivityLevelScreenProps {
  navigation: ActivityLevelScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    subtitle: 'Little to no exercise',
    description: 'Desk job, minimal physical activity',
    icon: '🪑',
    gradient: ['#D1D5DB', '#9CA3AF'],
    multiplier: '1.2x BMR',
  },
  {
    id: 'lightly_active',
    title: 'Lightly Active',
    subtitle: 'Light exercise 1-3 days/week',
    description: 'Light sports or walking occasionally',
    icon: '🚶‍♂️',
    gradient: ['#FEF3C7', '#F59E0B'],
    multiplier: '1.375x BMR',
  },
  {
    id: 'moderately_active',
    title: 'Moderately Active',
    subtitle: 'Moderate exercise 3-5 days/week',
    description: 'Regular workouts or sports',
    icon: '🏃‍♀️',
    gradient: ['#DBEAFE', '#3B82F6'],
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
  const { user, token, updateUserInContext } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(user?.profile?.activityLevel || null);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
      Alert.alert('No Level Selected', 'Please select your activity level to continue.');
      return;
    }

    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please restart the app.');
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
        navigation.navigate('OnboardingSummary');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not save your activity level. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Activity level selection error:', error);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Activity Level</Text>
        <Text style={styles.subtitle}>
          How active are you currently? This helps us calculate your daily calorie needs.
        </Text>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={[styles.progressDot, styles.activeDot]} />
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.levelsContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {ACTIVITY_LEVELS.map((level, index) => (
            <Animated.View
              key={level.id}
              style={[
                styles.levelWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, 30 + index * 10],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.levelCard,
                  selectedLevel === level.id && styles.selectedLevelCard,
                ]}
                onPress={() => handleLevelSelect(level.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedLevel === level.id
                      ? ['#667eea', '#764ba2'] as [string, string]
                      : level.gradient as [string, string]
                  }
                  style={styles.levelGradient}
                >
                  <View style={styles.levelContent}>
                    <View style={styles.levelHeader}>
                      <Text style={[
                        styles.levelIcon,
                        selectedLevel === level.id && styles.selectedIcon
                      ]}>
                        {level.icon}
                      </Text>
                      {selectedLevel === level.id && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.levelInfo}>
                      <Text style={[
                        styles.levelTitle,
                        selectedLevel === level.id && styles.selectedText
                      ]}>
                        {level.title}
                      </Text>
                      <Text style={[
                        styles.levelSubtitle,
                        selectedLevel === level.id && styles.selectedSubtext
                      ]}>
                        {level.subtitle}
                      </Text>
                      <Text style={[
                        styles.levelDescription,
                        selectedLevel === level.id && styles.selectedSubtext
                      ]}>
                        {level.description}
                      </Text>
                      <Text style={[
                        styles.levelMultiplier,
                        selectedLevel === level.id && styles.selectedSubtext
                      ]}>
                        Calorie factor: {level.multiplier}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[
          styles.bottomContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (!selectedLevel || isLoading) && styles.disabledButton
            ]} 
            onPress={handleContinue}
            disabled={!selectedLevel || isLoading}
          >
            <LinearGradient
              colors={
                selectedLevel && !isLoading
                  ? ['#667eea', '#764ba2'] as [string, string]
                  : ['#D1D5DB', '#D1D5DB'] as [string, string]
              }
              style={styles.buttonGradient}
            >
              <Text style={[
                styles.continueButtonText,
                (!selectedLevel || isLoading) && styles.disabledButtonText
              ]}>
                {isLoading ? 'Saving...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => navigation.navigate('OnboardingSummary')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#667eea',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  levelsContainer: {
    flex: 1,
  },
  levelWrapper: {
    marginBottom: 16,
  },
  levelCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedLevelCard: {
    elevation: 6,
    shadowOpacity: 0.2,
    transform: [{ scale: 1.02 }],
  },
  levelGradient: {
    padding: 20,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelHeader: {
    marginRight: 16,
    alignItems: 'center',
    position: 'relative',
  },
  levelIcon: {
    fontSize: 32,
  },
  selectedIcon: {
    transform: [{ scale: 1.1 }],
  },
  checkmark: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  levelSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedSubtext: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  levelDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  levelMultiplier: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  continueButton: {
    borderRadius: 25,
    overflow: 'hidden',
    flex: 1,
    marginLeft: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});

export default ActivityLevelScreen; 