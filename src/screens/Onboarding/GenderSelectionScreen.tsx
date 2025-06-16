import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';

type GenderSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GenderSelection'>;

interface GenderSelectionScreenProps {
  navigation: GenderSelectionScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const GenderSelectionScreen: React.FC<GenderSelectionScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext } = useAuth();
  const [selectedGender, setSelectedGender] = useState<string | null>(user?.profile?.gender || null);
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

  const handleGenderSelect = async (gender: string) => {
    setSelectedGender(gender);
  };

  const handleContinue = async () => {
    if (!selectedGender) {
      Alert.alert('No Selection', 'Please select your gender to continue.');
      return;
    }

    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please restart the app.');
      return;
    }

    setIsLoading(true);

    try {
      const profileData: OnboardingProfileData = {
        gender: selectedGender,
      };

      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('GoalSelection');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not save your selection. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Gender selection error:', error);
    }
    setIsLoading(false);
  };

  const handleSkip = () => {
    navigation.navigate('GoalSelection');
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
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          Help us personalize your fitness journey
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.optionsContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.genderOption,
            selectedGender === 'male' && styles.selectedOption,
          ]}
          onPress={() => handleGenderSelect('male')}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1567013127542-490d757e51cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            }}
            style={styles.genderImage}
            imageStyle={styles.imageStyle}
          >
            <LinearGradient
              colors={
                selectedGender === 'male'
                  ? ['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.9)']
                  : ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.6)']
              }
              style={styles.genderOverlay}
            >
              <View style={styles.genderContent}>
                <Text style={styles.genderIcon}>👨</Text>
                <Text style={styles.genderLabel}>Male</Text>
                {selectedGender === 'male' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderOption,
            selectedGender === 'female' && styles.selectedOption,
          ]}
          onPress={() => handleGenderSelect('female')}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            }}
            style={styles.genderImage}
            imageStyle={styles.imageStyle}
          >
            <LinearGradient
              colors={
                selectedGender === 'female'
                  ? ['rgba(236, 72, 153, 0.8)', 'rgba(236, 72, 153, 0.9)']
                  : ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.6)']
              }
              style={styles.genderOverlay}
            >
              <View style={styles.genderContent}>
                <Text style={styles.genderIcon}>👩</Text>
                <Text style={styles.genderLabel}>Female</Text>
                {selectedGender === 'female' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.otherOption,
            selectedGender === 'other' && styles.selectedOtherOption,
          ]}
          onPress={() => handleGenderSelect('other')}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.otherLabel}>Prefer not to say</Text>
          {selectedGender === 'other' && (
            <View style={styles.checkmarkSmall}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {selectedGender && (
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleContinue}
            disabled={isLoading}
          >
            <LinearGradient
              colors={
                !isLoading 
                  ? ['#667eea', '#764ba2'] as [string, string] 
                  : ['#D1D5DB', '#D1D5DB'] as [string, string]
              }
              style={styles.nextButtonGradient}
            >
              <Text style={[
                styles.nextButtonText,
                isLoading && styles.disabledButtonText
              ]}>
                {isLoading ? 'Saving...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
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
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  genderOption: {
    height: 180,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedOption: {
    elevation: 8,
    shadowOpacity: 0.35,
    transform: [{ scale: 1.02 }],
  },
  genderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    borderRadius: 20,
  },
  genderOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  genderContent: {
    alignItems: 'center',
    position: 'relative',
  },
  genderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkmark: {
    position: 'absolute',
    top: -10,
    right: -20,
    backgroundColor: '#10B981',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkSmall: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  otherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOtherOption: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  otherLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  bottomContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
  },
  nextButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 16,
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

export default GenderSelectionScreen; 