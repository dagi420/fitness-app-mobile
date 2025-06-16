import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  ImageBackground,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';

type OnboardingSummaryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingSummary'>;

interface OnboardingSummaryScreenProps {
  navigation: OnboardingSummaryScreenNavigationProp;
}

const OnboardingSummaryScreen: React.FC<OnboardingSummaryScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext, isAuthenticated } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Check if this is profile editing (user already authenticated and has profile) or initial onboarding
  const isProfileEditing = isAuthenticated && user?.profile?.gender;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please restart the app.');
      return;
    }

    if (isProfileEditing) {
      // For profile editing, just go back to profile
      Alert.alert('Success', 'Your profile has been updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Profile'),
        },
      ]);
    } else {
      // For initial onboarding, check if required data exists and complete onboarding
      if (!user.profile?.gender) {
        Alert.alert('Incomplete Profile', 'Please go back and complete all onboarding steps.');
        return;
      }

      try {
        // Mark onboarding as complete by ensuring all profile data is properly set
        // This is just a final update to ensure consistency
        const profileData: OnboardingProfileData = {
          // Only update fields if they're missing (shouldn't happen if previous screens worked correctly)
          ...(user.profile?.workoutGoals ? {} : { workoutGoals: [] }),
          ...(user.profile?.activityLevel ? {} : { activityLevel: 'moderate' }),
        };

        // Only make API call if there's actually data to update
        if (Object.keys(profileData).length > 0) {
          const response = await updateUserProfileOnboarding(user._id, profileData, token);
          if (response.success && response.user) {
            await updateUserInContext(response.user);
          } else {
            Alert.alert('Setup Failed', response.message || 'Could not complete setup. Please try again.');
            return;
          }
        }

        // If we reach here, onboarding is complete and the AppNavigator will automatically
        // navigate to MainApp due to the user.profile.gender check
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        console.error('Onboarding completion error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.celebrationContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Text style={styles.celebrationIcon}>🎉</Text>
              </Animated.View>
              
              <Text style={styles.title}>
                {isProfileEditing ? 'Profile Updated!' : 'You\'re All Set!'}
              </Text>
              <Text style={styles.subtitle}>
                {isProfileEditing 
                  ? 'Your profile changes have been saved' 
                  : 'Your personalized fitness journey starts now'
                }
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.summaryContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>What's Next?</Text>
                
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>🤖</Text>
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>AI-Powered Workouts</Text>
                      <Text style={styles.featureDescription}>
                        Get personalized workout plans based on your goals and preferences
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>📈</Text>
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Progress Tracking</Text>
                      <Text style={styles.featureDescription}>
                        Monitor your fitness journey with detailed analytics and photos
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>🍎</Text>
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Nutrition Guidance</Text>
                      <Text style={styles.featureDescription}>
                        Discover meal plans and nutrition tips tailored to your goals
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>🏆</Text>
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Achievement System</Text>
                      <Text style={styles.featureDescription}>
                        Stay motivated with badges and milestone celebrations
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.motivationContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.motivationText}>
                "The journey of a thousand miles begins with one step"
              </Text>
              <Text style={styles.motivationAuthor}>- Lao Tzu</Text>
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
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53'] as [string, string]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.getStartedText}>
                  {isProfileEditing ? 'Back to Profile' : 'Start My Journey'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.trustIndicators}>
              <Text style={styles.trustText}>Join thousands of users transforming their lives</Text>
              <View style={styles.starsContainer}>
                <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
                <Text style={styles.rating}>4.8/5 rating</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  celebrationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  summaryContainer: {
    marginBottom: 40,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  motivationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  motivationText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 26,
  },
  motivationAuthor: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  getStartedButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trustIndicators: {
    alignItems: 'center',
  },
  trustText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    fontSize: 16,
  },
  rating: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
});

export default OnboardingSummaryScreen; 