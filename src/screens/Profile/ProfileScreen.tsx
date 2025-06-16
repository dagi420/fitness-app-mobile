import React from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  View,
  Text,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

// Re-styled component for a more modern look
const DetailItem = ({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.detailItem} disabled={!onPress}>
    <View style={styles.detailItemContent}>
      <Ionicons name={icon} size={24} color="#01D38D" style={styles.detailIcon} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
    {onPress && <Ionicons name="chevron-forward" size={22} color="#696E79" />}
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // The AppNavigator will handle redirecting to the auth flow
        },
      },
    ]);
  };

  if (!user) {
    // This part is mostly for safety, as AppNavigator should prevent this screen from being shown.
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#696E79" />
          <Text style={styles.errorTitle}>Not Logged In</Text>
          <Text style={styles.errorSubtitle}>
            You need to be logged in to view your profile.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateBMI = () => {
    if (user.profile?.height && user.profile?.weight) {
      const heightInM = user.profile.height / 100;
      const bmi = user.profile.weight / (heightInM * heightInM);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  const formatValue = (value: string | number | undefined, suffix = '') => {
    if (value === undefined || value === null || value === '') return 'N/A';
    return `${value}${suffix}`;
  };
  
  const formatActivityLevel = (level: string) => {
    if (!level) return 'N/A';
    return level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.fullName || 'U')}</Text>
          </View>
          <Text style={styles.userName}>{user.fullName || 'Valued User'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Health Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="fitness-outline" size={28} color="#01D38D" />
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{formatValue(user.profile?.weight, ' kg')}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="male-female-outline" size={28} color="#01D38D" />
              <Text style={styles.statLabel}>Gender</Text>
              <Text style={styles.statValue}>{formatValue(user.profile?.gender, '')}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="body-outline" size={28} color="#01D38D" />
              <Text style={styles.statLabel}>BMI</Text>
              <Text style={styles.statValue}>{calculateBMI()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Preferences</Text>
          <View style={styles.detailsContainer}>
             <DetailItem
              icon="person-outline"
              label="Age"
              value={formatValue(user.profile?.age, ' years')}
            />
            <DetailItem
              icon="resize-outline"
              label="Height"
              value={formatValue(user.profile?.height, ' cm')}
            />
            <DetailItem
              icon="walk-outline"
              label="Activity Level"
              value={formatActivityLevel(user.profile?.activityLevel || '')}
            />
            <DetailItem
              icon="trophy-outline"
              label="Fitness Goal"
              value={formatActivityLevel(user.profile?.workoutGoals?.[0] || 'Not set')}
            />
          </View>
        </View>
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.detailsContainer}>
                <DetailItem
                    icon="home-outline"
                    label="Dashboard"
                    value="Return to home"
                    onPress={() => navigation.navigate('MainApp', { screen: 'Dashboard' })}
                />
                 <DetailItem
                    icon="create-outline"
                    label="Edit Profile"
                    value="Update your info"
                    onPress={() => navigation.navigate('GenderSelection')}
                />
                <DetailItem
                    icon="settings-outline"
                    label="App Settings"
                    value="Notifications, theme, etc."
                    onPress={() => {}}
                />
            </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 25,
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 25,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#01D38D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1E2328',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#A0A5B1',
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 25,
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1E2328',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '32%',
  },
  statLabel: {
    color: '#A0A5B1',
    fontSize: 14,
    marginTop: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  detailsContainer: {
    backgroundColor: '#1E2328',
    borderRadius: 15,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
  },
  detailItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 20,
  },
  detailLabel: {
    color: '#A0A5B1',
    fontSize: 14,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B1A',
    borderRadius: 15,
    paddingVertical: 15,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
  },
  errorSubtitle: {
    color: '#A0A5B1',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ProfileScreen; 