import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';

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

  const handleFinishOnboarding = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please restart the app.');
      return;
    }
    if (!age || !gender || !height || !weight) {
      Alert.alert('Error', 'Please fill in all fields.');
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
        Alert.alert('Success', 'Profile updated!');
        navigation.replace('MainApp');
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us a bit more</Text>
      <Text style={styles.subtitle}>This information helps in personalizing your experience.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Age"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender (e.g., Male, Female, Other)"
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <TouchableOpacity 
        style={[styles.nextButton, isLoading && styles.buttonDisabled]} 
        onPress={handleFinishOnboarding}
        disabled={isLoading}
      >
        <Text style={styles.nextButtonText}>{isLoading ? 'Saving...' : 'Finish Onboarding'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  nextButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#7abaff',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserDetailsScreen; 