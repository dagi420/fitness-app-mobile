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

type UserDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetails'>;

interface UserDetailsScreenProps {
  navigation: UserDetailsScreenNavigationProp;
}

const DetailsSchema = Yup.object().shape({
  age: Yup.number()
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Age seems a bit high!')
    .required('Age is required'),
  height: Yup.number()
    .min(100, 'Height must be over 100cm')
    .max(250, 'Height must be under 250cm')
    .required('Height is required'),
  weight: Yup.number()
    .min(30, 'Weight must be over 30kg')
    .max(300, 'Weight must be under 300kg')
    .required('Weight is required'),
});

const UserDetailsScreen: React.FC<UserDetailsScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async (values: { age: string; height: string; weight: string }) => {
    if (!user || !token) {
      Alert.alert('Authentication Error', 'You must be logged in to continue.');
      return;
    }
    setIsLoading(true);
    try {
      const profileData: OnboardingProfileData = {
        age: parseInt(values.age, 10),
        height: parseFloat(values.height),
        weight: parseFloat(values.weight),
      };
      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('ActivityLevel');
      } else {
        Alert.alert('Update Failed', response.message || 'Could not save your details.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
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
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
          validationSchema={DetailsSchema}
          onSubmit={handleNext}
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