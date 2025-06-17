import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { updateUserProfileOnboarding, OnboardingProfileData } from '../../api/authService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import { CommonActions } from '@react-navigation/native';

type GenderSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GenderSelection'>;

interface GenderSelectionScreenProps {
  navigation: GenderSelectionScreenNavigationProp;
}

const { height } = Dimensions.get('window');

const GenderSelectionScreen: React.FC<GenderSelectionScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext, isAuthenticated } = useAuth();
  const [selectedGender, setSelectedGender] = useState<string | null>(user?.profile?.gender || null);
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
      // If no previous screen (first time onboarding), go to Welcome
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      );
    }
  };

  const handleContinue = async () => {
    if (!selectedGender) {
      showAlert('Selection Required', 'Please select a gender to continue.', 'alert-circle-outline');
      return;
    }
    if (!user || !token) {
      showAlert('Authentication Error', 'You must be logged in to continue.', 'alert-circle-outline');
      return;
    }
    setIsLoading(true);
    try {
      const profileData: OnboardingProfileData = { gender: selectedGender };
      const response = await updateUserProfileOnboarding(user._id, profileData, token);
      if (response.success && response.user) {
        await updateUserInContext(response.user);
        navigation.navigate('GoalSelection');
      } else {
        showAlert('Update Failed', response.message || 'Could not save your selection.', 'close-circle-outline');
      }
    } catch (error) {
      showAlert('Error', 'An unexpected error occurred. Please try again.', 'alert-circle-outline');
    } finally {
      setIsLoading(false);
    }
  };

  const GenderOption = ({
    label,
    value,
    iconName,
    imageUrl,
  }: {
    label: string;
    value: string;
    iconName: React.ComponentProps<typeof Ionicons>['name'];
    imageUrl: string;
  }) => (
    <TouchableOpacity
      style={styles.optionButton}
      onPress={() => setSelectedGender(value)}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.optionBackground}
        imageStyle={styles.optionImage}
      >
        <LinearGradient
          colors={
            selectedGender === value
              ? ['rgba(1, 211, 141, 0.5)', 'rgba(1, 211, 141, 0.8)']
              : ['rgba(25, 30, 41, 0.5)', 'rgba(25, 30, 41, 0.9)']
          }
          style={styles.optionOverlay}
        >
          <Ionicons name={iconName} size={48} color="#FFFFFF" />
          <Text style={styles.optionLabel}>{label}</Text>
          {selectedGender === value && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
          )}
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Text style={styles.title}>Tell us about yourself!</Text>
        <Text style={styles.subtitle}>To give you a better experience we need to know your gender</Text>
      </View>

      <View style={styles.optionsContainer}>
        <GenderOption
          label="Male"
          value="male"
          iconName="male"
          imageUrl="https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?cs=srgb&dl=pexels-anush-1431282.jpg&fm=jpg"
        />
        <GenderOption
          label="Female"
          value="female"
          iconName="female"
          imageUrl="https://i.pinimg.com/736x/91/e2/c1/91e2c1474ea2447b12db1ae44b2464e4.jpg"
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !selectedGender || isLoading ? styles.disabledButton : {}]}
          onPress={handleContinue}
          disabled={!selectedGender || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#191E29" /> : <Text style={styles.nextButtonText}>Next</Text>}
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        iconName={alertInfo.iconName}
        iconColor={alertInfo.iconName?.includes('alert') || alertInfo.iconName?.includes('close') ? '#FF6B6B' : '#01D38D'}
        onClose={() => setAlertInfo(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#696E79',
    textAlign: 'center',
    marginTop: 8,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
  },
  optionButton: {
    width: height * 0.2,
    height: height * 0.35,
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionImage: {
    borderRadius: 20,
  },
  optionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#01D38D',
    borderRadius: 12,
  },
  optionLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  footer: {
    padding: 20,
  },
  nextButton: {
    backgroundColor: '#01D38D',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
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

export default GenderSelectionScreen; 