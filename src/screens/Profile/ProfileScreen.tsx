import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity, View, Text, Dimensions } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const { width } = Dimensions.get('window');

interface ProfileStatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const ProfileStatCard: React.FC<ProfileStatCardProps> = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );
};

interface ProfileDetailItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}

const ProfileDetailItem: React.FC<ProfileDetailItemProps> = ({ icon, label, value, onPress }) => {
  return (
    <TouchableOpacity style={styles.detailItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.detailItemLeft}>
        <View style={styles.detailIconContainer}>
          <Ionicons name={icon} size={20} color="#667eea" />
        </View>
        <View>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
};

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await logout();
            Alert.alert("Logged Out", "You have been successfully logged out.");
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#E5E7EB" />
          <Text style={styles.errorTitle}>No Profile Found</Text>
          <Text style={styles.errorSubtitle}>Please login to view your profile</Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogout}>
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
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

  const formatActivityLevel = (level: string) => {
    return level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {getInitials(user.fullName || 'User')}
                </Text>
              </LinearGradient>
              <View style={styles.statusDot} />
            </View>
            
            <Text style={styles.userName}>{user.fullName || 'Fitness Enthusiast'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('GenderSelection')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#667eea" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Health Overview</Text>
          <View style={styles.statsGrid}>
            <ProfileStatCard
              icon="fitness-outline"
              label="Weight"
              value={user.profile?.weight ? `${user.profile.weight} kg` : 'N/A'}
              color="#10B981"
            />
            <ProfileStatCard
              icon="resize-outline"
              label="Height"
              value={user.profile?.height ? `${user.profile.height} cm` : 'N/A'}
              color="#3B82F6"
            />
            <ProfileStatCard
              icon="analytics-outline"
              label="BMI"
              value={calculateBMI()}
              color="#F59E0B"
            />
            <ProfileStatCard
              icon="calendar-outline"
              label="Age"
              value={user.profile?.age ? `${user.profile.age} yrs` : 'N/A'}
              color="#EF4444"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            {user.profile?.gender && (
              <ProfileDetailItem
                icon="body-outline"
                label="Gender"
                value={user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1)}
              />
            )}
            {user.profile?.activityLevel && (
              <ProfileDetailItem
                icon="walk-outline"
                label="Activity Level"
                value={formatActivityLevel(user.profile.activityLevel)}
              />
            )}
          </View>
        </View>

        {user.profile?.workoutGoals && user.profile.workoutGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            <View style={styles.card}>
              <View style={styles.goalsContainer}>
                {user.profile.workoutGoals.map((goal, index) => (
                  <View key={index} style={styles.goalChip}>
                    <Ionicons name="trophy" size={14} color="#667eea" />
                    <Text style={styles.goalText}>
                      {goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.card}>
            <ProfileDetailItem
              icon="analytics-outline"
              label="Progress History"
              value="View your fitness journey"
              onPress={() => navigation.navigate('ProgressHistory')}
            />
            <View style={styles.divider} />
            <ProfileDetailItem
              icon="settings-outline"
              label="App Settings"
              value="Notifications & preferences"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={styles.logoutGradient}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Section Styles
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Detail Item Styles
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },

  // Goals Styles
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Logout Section
  logoutSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileScreen; 