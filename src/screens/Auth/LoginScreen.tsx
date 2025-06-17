import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { loginUser } from '../../api/authService';
import { useAuth } from '../../store/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login: loginToContext } = useAuth();
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title: string, message: string, iconName?: keyof typeof Ionicons.glyphMap) => {
    setAlertInfo({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
      iconName,
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Login Error', 'Please enter both email and password.', 'alert-circle-outline');
      return;
    }
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      if (response.success && response.user && response.token) {
        await loginToContext(response.user, response.token);
        
        if (response.user.profile && response.user.profile.gender) {
            navigation.replace('MainApp');
        } else {
            navigation.replace('GenderSelection');
        }

      } else {
        showAlert('Login Failed', response.message || 'Invalid credentials or server error.', 'close-circle-outline');
      }
    } catch (error) {
      showAlert('Error', 'An unexpected error occurred. Please try again.', 'alert-circle-outline');
      console.error('Login screen error:', error);
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        
        <View style={styles.formContainer}>
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
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        iconName={alertInfo.iconName}
        iconColor={'#FF6B6B'}
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
  forgotPasswordButton: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#01D38D',
    fontSize: 16,
    fontWeight: '600',
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

export default LoginScreen; 