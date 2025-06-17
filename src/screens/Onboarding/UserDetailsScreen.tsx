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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomInput from '../../components/ui/CustomInput';
import CustomAlert from '../../components/CustomAlert';
import { CommonActions } from '@react-navigation/native';

const validationSchema = Yup.object().shape({
  age: Yup.number()
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Please enter a valid age')
    .required('Age is required'),
  height: Yup.number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must be less than 250 cm')
    .required('Height is required'),
  weight: Yup.number()
    .min(30, 'Weight must be at least 30 kg')
    .max(300, 'Weight must be less than 300 kg')
    .required('Weight is required'),
});

type UserDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetails'>;

interface UserDetailsScreenProps {
  navigation: UserDetailsScreenNavigationProp;
}

const UserDetailsScreen: React.FC<UserDetailsScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (values: { age: string; height: string; weight: string }) => {
    if (!user || !token) {
      showAlert('Authentication Error', 'You must be logged in to continue.', 'alert-circle-outline');
      return;
    }
    setIsLoading(true);
    try {
      const profileData: OnboardingProfileData = {
        age: parseInt(values.age),
        height: parseInt(values.height),
        weight: parseInt(values.weight),
      };
      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('ActivityLevel');
      } else {
        showAlert('Update Failed', response.message || 'Could not save your details.', 'close-circle-outline');
      }
    } catch (error) {
      showAlert('Error', 'An unexpected error occurred.', 'alert-circle-outline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Details</Text>
          <Text style={styles.subtitle}>This helps us calculate your personalized fitness metrics.</Text>
        </View>

        <Formik
          initialValues={{
            age: user?.profile?.age?.toString() || '',
            height: user?.profile?.height?.toString() || '',
            weight: user?.profile?.weight?.toString() || '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View>
              <CustomInput
                label="Age"
                unit="years"
                keyboardType="number-pad"
                onChangeText={handleChange('age')}
                onBlur={handleBlur('age')}
                value={values.age}
                error={errors.age}
                touched={touched.age}
                maxLength={3}
              />
              <CustomInput
                label="Height"
                unit="cm"
                keyboardType="number-pad"
                onChangeText={handleChange('height')}
                onBlur={handleBlur('height')}
                value={values.height}
                error={errors.height}
                touched={touched.height}
                maxLength={5}
              />
              <CustomInput
                label="Weight"
                unit="kg"
                keyboardType="number-pad"
                onChangeText={handleChange('weight')}
                onBlur={handleBlur('weight')}
                value={values.weight}
                error={errors.weight}
                touched={touched.weight}
                maxLength={5}
              />
              <TouchableOpacity
                style={[styles.nextButton, isLoading ? styles.disabledButton : {}]}
                onPress={() => handleSubmit()}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#191E29" /> : <Text style={styles.nextButtonText}>Next</Text>}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
    marginBottom: 40,
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
  nextButton: {
    backgroundColor: '#01D38D',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
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

export default UserDetailsScreen; 