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

type GoalSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GoalSelection'>;

interface GoalSelectionScreenProps {
  navigation: GoalSelectionScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const GOALS = [
  { 
    id: 'lose_weight', 
    label: 'Lose Weight', 
    icon: '🔥',
    description: 'Burn calories and shed pounds',
    gradient: ['#FF6B6B', '#FF8E53']
  },
  { 
    id: 'gain_muscle', 
    label: 'Build Muscle', 
    icon: '💪',
    description: 'Increase strength and muscle mass',
    gradient: ['#4ECDC4', '#44A08D']
  },
  { 
    id: 'improve_stamina', 
    label: 'Improve Endurance', 
    icon: '🏃‍♂️',
    description: 'Boost cardiovascular fitness',
    gradient: ['#667eea', '#764ba2']
  },
  { 
    id: 'flexibility', 
    label: 'Increase Flexibility', 
    icon: '🧘‍♀️',
    description: 'Enhance mobility and range of motion',
    gradient: ['#f093fb', '#f5576c']
  },
  { 
    id: 'stress_relief', 
    label: 'Stress Relief', 
    icon: '😌',
    description: 'Find inner peace and relaxation',
    gradient: ['#4facfe', '#00f2fe']
  },
  { 
    id: 'overall_fitness', 
    label: 'Overall Fitness', 
    icon: '⚡',
    description: 'Complete health and wellness',
    gradient: ['#a8edea', '#fed6e3']
  },
];

const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user?.profile?.workoutGoals || []);
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

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    );
  };

  const handleNext = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please restart the app.');
      return;
    }

    if (selectedGoals.length === 0) {
      Alert.alert('No Goals Selected', 'Please select at least one fitness goal to continue.');
      return;
    }

    setIsLoading(true);

    try {
      const profileData: OnboardingProfileData = {
        workoutGoals: selectedGoals,
      };

      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('UserDetails');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not save your goals. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Goals selection error:', error);
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
        <Text style={styles.title}>What are your fitness goals?</Text>
        <Text style={styles.subtitle}>
          Select all that apply. We'll personalize your journey accordingly.
        </Text>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.goalsGrid,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {GOALS.map((goal, index) => (
            <Animated.View
              key={goal.id}
              style={[
                styles.goalWrapper,
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
                  styles.goalCard,
                  selectedGoals.includes(goal.id) && styles.selectedGoalCard,
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedGoals.includes(goal.id)
                      ? goal.gradient as [string, string]
                      : ['#FFFFFF', '#FFFFFF'] as [string, string]
                  }
                  style={styles.goalGradient}
                >
                  <View style={styles.goalContent}>
                    <Text style={[
                      styles.goalIcon,
                      selectedGoals.includes(goal.id) && styles.selectedIcon
                    ]}>
                      {goal.icon}
                    </Text>
                    <Text style={[
                      styles.goalLabel,
                      selectedGoals.includes(goal.id) && styles.selectedLabel
                    ]}>
                      {goal.label}
                    </Text>
                    <Text style={[
                      styles.goalDescription,
                      selectedGoals.includes(goal.id) && styles.selectedDescription
                    ]}>
                      {goal.description}
                    </Text>
                    {selectedGoals.includes(goal.id) && (
                      <View style={styles.checkmarkContainer}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
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
              styles.nextButton,
              (selectedGoals.length === 0 || isLoading) && styles.disabledButton
            ]} 
            onPress={handleNext} 
            disabled={selectedGoals.length === 0 || isLoading}
          >
            <LinearGradient
              colors={
                selectedGoals.length > 0 && !isLoading
                  ? ['#667eea', '#764ba2'] as [string, string]
                  : ['#D1D5DB', '#D1D5DB'] as [string, string]
              }
              style={styles.nextButtonGradient}
            >
              <Text style={[
                styles.nextButtonText,
                (selectedGoals.length === 0 || isLoading) && styles.disabledButtonText
              ]}>
                {isLoading ? 'Saving...' : `Continue ${selectedGoals.length > 0 ? `(${selectedGoals.length})` : ''}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalWrapper: {
    width: (width - 60) / 2,
    marginBottom: 16,
  },
  goalCard: {
    height: 160,
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
  selectedGoalCard: {
    elevation: 6,
    shadowOpacity: 0.2,
    transform: [{ scale: 1.05 }],
  },
  goalGradient: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  selectedIcon: {
    transform: [{ scale: 1.1 }],
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
  goalDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedDescription: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 16,
    borderRadius: 25,
    overflow: 'hidden',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default GoalSelectionScreen; 