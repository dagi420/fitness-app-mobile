import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';

type WelcomeScreenNavigationProp = NavigationProp<RootStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#191E29', '#132D46']}
        style={styles.gradient}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>
            FitnessApp
          </Text>
          <Text style={styles.tagline}>
            Your Journey to a Healthier You Starts Here
          </Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsContainer}>
          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </TouchableOpacity>

          {/* Get Started Button */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('GenderSelection')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              Get Started
            </Text>
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest Option (commented out as in original) */}
        {/* <TouchableOpacity style={styles.guestButton}>
          <Text style={styles.guestText}>
            Continue as Guest (Limited Access)
          </Text>
        </TouchableOpacity> */}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    color: '#696E79',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
  },
  loginButtonText: {
    color: '#191E29',
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#01D38D',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#01D38D',
  },
  outlineButtonText: {
    color: '#01D38D',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestButton: {
    marginTop: 32,
  },
  guestText: {
    color: '#4A4D52',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen; 