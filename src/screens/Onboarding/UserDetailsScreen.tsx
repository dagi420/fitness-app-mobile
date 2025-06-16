import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';
import { LinearGradient } from 'expo-linear-gradient';

type UserDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetails'>;

interface UserDetailsScreenProps {
  navigation: UserDetailsScreenNavigationProp;
}

const UserDetailsScreen: React.FC<UserDetailsScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext } = useAuth();

  const [age, setAge] = useState(user?.profile?.age?.toString() || '');
  const [gender, setGender] = useState(user?.profile?.gender || '');
  const [height, setHeight] = useState(user?.profile?.height?.toString() || '');
  const [weight, setWeight] = useState(user?.profile?.weight?.toString() || '');
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

  const validateFields = () => {
    if (!age || !height || !weight) {
      Alert.alert('Missing Information', 'Please fill in all fields to continue.');
      return false;
    }

    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (ageNum < 13 || ageNum > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 13 and 120.');
      return false;
    }

    if (heightNum < 100 || heightNum > 250) {
      Alert.alert('Invalid Height', 'Please enter a valid height between 100cm and 250cm.');
      return false;
    }

    if (weightNum < 30 || weightNum > 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 30kg and 300kg.');
      return false;
    }

    return true;
  };

  const handleFinishOnboarding = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please restart the app.');
      return;
    }

    if (!validateFields()) {
      return;
    }

    const profileData: OnboardingProfileData = {
      age: parseInt(age, 10),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
    };

    setIsLoading(true);
    try {
      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('ActivityLevel');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not update profile.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while updating your profile.');
      console.error('Update profile error:', error);
    }
    setIsLoading(false);
  };

  const handleContinue = async () => {
    if (!validateFields()) {
      return;
    }

    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please restart the app.');
      return;
    }

    const profileData: OnboardingProfileData = {
      age: parseInt(age, 10),
      height: parseFloat(height),
      weight: parseFloat(weight),
    };

    setIsLoading(true);
    try {
      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('ActivityLevel');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not update profile.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while updating your profile.');
      console.error('Update profile error:', error);
    }
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text style={styles.title}>Personal Details</Text>
        <Text style={styles.subtitle}>
          Help us calculate your personalized fitness metrics
        </Text>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={[styles.progressDot, styles.activeDot]} />
          <View style={[styles.progressDot, styles.activeDot]} />
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
            styles.formContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                maxLength={3}
              />
              <Text style={styles.inputUnit}>years</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your height"
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
                maxLength={3}
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your weight"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                maxLength={4}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              This information helps us create personalized workout and nutrition plans for you.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.navigationContainer}>
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
            ((!age || !height || !weight) || isLoading) && styles.disabledButton
          ]} 
          onPress={handleContinue}
          disabled={(!age || !height || !weight) || isLoading}
        >
          <LinearGradient
            colors={
              (age && height && weight && !isLoading)
                ? ['#667eea', '#764ba2'] as [string, string]
                : ['#D1D5DB', '#D1D5DB'] as [string, string]
            }
            style={styles.buttonGradient}
          >
            <Text style={[
              styles.continueButtonText,
              ((!age || !height || !weight) || isLoading) && styles.disabledButtonText
            ]}>
              {isLoading ? 'Saving...' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    marginTop: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  inputUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  navigationContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  continueButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 16,
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
});

export default UserDetailsScreen; 