import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

type WelcomeScreenNavigationProp = NavigationProp<RootStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FitnessApp</Text>
      <Text style={styles.tagline}>Your Journey to a Healthier You Starts Here</Text>
      <TouchableOpacity 
        style={[styles.button, styles.loginButton]} 
        onPress={() => navigation.navigate('Login')
        }
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.button, styles.signupButton]} 
        onPress={() => navigation.navigate('Signup')
      }>
        <Text style={[styles.buttonText, styles.signupButtonText]}>Sign Up</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity onPress={() => console.log('Continue as Guest')}> 
        <Text style={styles.guestText}>Continue as Guest (Limited Access)</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff', // A primary color for the welcome screen
    padding: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 50,
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButton: {
    backgroundColor: '#fff',
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff', // Text color for login button
  },
  signupButtonText: {
    color: '#fff', // Text color for signup button
  },
  guestText: {
    color: '#f0f0f0',
    marginTop: 20,
    textDecorationLine: 'underline',
  }
});

export default WelcomeScreen; 