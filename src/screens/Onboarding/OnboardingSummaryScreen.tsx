import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { updateUserProfileOnboarding } from '../../api/authService';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';

type OnboardingSummaryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OnboardingSummary'
>;

interface OnboardingSummaryScreenProps {
  navigation: OnboardingSummaryScreenNavigationProp;
}

const OnboardingSummaryScreen: React.FC<OnboardingSummaryScreenProps> = ({ navigation }) => {
  const { user, token, updateUserInContext, isAuthenticated } = useAuth();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
  }>({ visible: false, title: '', message: '', buttons: [] });

  // If user is authenticated and has a gender, they are editing, not doing initial onboarding
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

  const handleComplete = async () => {
    // If just editing, simply navigate back to the profile screen.
    if (isProfileEditing) {
      rootNavigation.navigate('Profile');
      return;
    }

    // Otherwise, complete the initial onboarding flow.
    if (!user || !token) {
      showAlert('Authentication Error', 'You must be logged in to continue.', 'alert-circle-outline');
      return;
    }

    try {
      // For initial onboarding completion, we just mark it as complete
      // without sending additional profile data since it should already be set
      // from previous onboarding steps
      const response = await updateUserProfileOnboarding(
        user._id,
        { onboardingCompleted: true },
        token
      );

      if (response.success && response.user) {
        await updateUserInContext(response.user);
        // Navigate to the main app after successful onboarding completion
        rootNavigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      } else {
        console.error('Onboarding completion failed:', response.message);
        showAlert(
          'Finalization Failed',
          response.message || 'Could not complete your setup. Please try again.',
          'close-circle-outline'
        );
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      showAlert('Error', 'An unexpected error occurred. Please try again.', 'alert-circle-outline');
    }
  };

  const FeatureCard = ({ icon, title, description }: { icon: any; title: string; description: string }) => (
    <View style={styles.featureCard}>
      <Ionicons name={icon} size={32} color="#01D38D" style={styles.featureIcon} />
      <View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={50} color="#01D38D" />
          <Text style={styles.title}>{isProfileEditing ? 'Profile Updated!' : "You're All Set!"}</Text>
          <Text style={styles.subtitle}>
            {isProfileEditing
              ? 'Your changes have been saved successfully.'
              : 'Your personalized fitness journey is ready to begin.'}
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Inside</Text>
          <FeatureCard
            icon="analytics-outline"
            title="Personalized Plans"
            description="AI-driven workouts and nutrition, just for you."
          />
          <FeatureCard
            icon="bar-chart-outline"
            title="Track Your Progress"
            description="Log workouts, monitor metrics, and see your growth."
          />
          <FeatureCard
            icon="trophy-outline"
            title="Stay Motivated"
            description="Earn achievements and celebrate your milestones."
          />
        </View>

        <View style={styles.quoteSection}>
          <Text style={styles.quoteText}>
            "The only bad workout is the one that didn't happen."
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleComplete}>
          <Text style={styles.startButtonText}>
            {isProfileEditing ? 'Return to Profile' : 'Start My Journey'}
          </Text>
          <Ionicons name="arrow-forward-outline" size={22} color="#FFFFFF" />
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
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 80,
    paddingBottom: 120, // Space for the footer
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#A0A5B1',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: '85%',
  },
  featuresSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    marginLeft: 5,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#1E2328',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featureDescription: {
    fontSize: 14,
    color: '#A0A5B1',
    marginTop: 5,
    lineHeight: 20,
  },
  quoteSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#696E79',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40, // Safe area for home indicator
    backgroundColor: '#191E29', // To match the container background
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#01D38D',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default OnboardingSummaryScreen; 