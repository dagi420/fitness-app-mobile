import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { registerUser } from '../../api/authService'; // Import the service
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

type SignupScreenNavigationProp = NavigationProp<RootStackParamList, 'Signup'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (
    title: string,
    message: string,
    buttons: any[],
    iconName?: keyof typeof Ionicons.glyphMap,
    iconColor?: string,
  ) => {
    setAlertInfo({ visible: true, title, message, buttons, iconName, iconColor });
  };

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      showAlert(
        'Missing Fields', 
        'Please fill in all fields to create your account.', 
        [{ text: 'OK', onPress: () => {} }], 
        'alert-circle-outline', 
        '#FF9F0A');
      return;
    }
    if (password !== confirmPassword) {
      showAlert(
        'Password Mismatch', 
        'The passwords you entered do not match. Please re-enter them.', 
        [{ text: 'OK', onPress: () => {} }], 
        'alert-circle-outline', 
        '#FF9F0A');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerUser({ fullName, email, password });
      if (response.success) {
        showAlert(
            'Account Created!', 
            'Welcome aboard! Please sign in to start setting up your personalized fitness profile.', 
            [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }],
            'checkmark-circle-outline',
            '#01D38D'
        );
      } else {
        showAlert(
            'Registration Failed', 
            response.message || 'An unknown error occurred.',
            [{ text: 'OK', onPress: () => {} }],
            'close-circle-outline',
            '#FF6B6B'
        );
      }
    } catch (error) {
      showAlert(
        'Error', 
        'An unexpected error occurred. Please try again.', 
        [{ text: 'OK', onPress: () => {} }],
        'alert-circle-outline',
        '#FF6B6B'
      );
      console.error('Signup screen error:', error);
    }
    setIsLoading(false);
  };

  return (
    <LinearGradient
      colors={['#191E29', '#132D46']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#191E29" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us and start your fitness journey</Text>
        
        <View style={styles.formContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Full Name"
            placeholderTextColor="#696E79"
            value={fullName} 
            onChangeText={setFullName} 
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#696E79"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#696E79"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#696E79"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        iconName={alertInfo.iconName}
        iconColor={alertInfo.iconColor}
        onClose={() => setAlertInfo(prev => ({ ...prev, visible: false }))}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#696E79',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#01D38D',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(1, 211, 141, 0.6)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#696E79',
    fontSize: 16,
  },
  linkText: {
    color: '#01D38D',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupScreen; 