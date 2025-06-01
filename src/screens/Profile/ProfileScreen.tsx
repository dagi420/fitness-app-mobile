import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

// Define navigation prop type for this screen if needed for other navigations
// type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>; // Assuming 'Profile' is a route name

interface ProfileDetailItemProps {
  label: string;
  value: string | number | undefined | null;
}

const ProfileDetailItem: React.FC<ProfileDetailItemProps> = ({ label, value }) => {
  if (value === undefined || value === null || value === '') {
    return null; // Don't render if value is not set
  }
  return (
    <View style={styles.detailItemContainer}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{String(value)}</Text>
    </View>
  );
};

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  // const navigation = useNavigation<ProfileScreenNavigationProp>(); // If you need navigation

  const handleLogout = async () => {
    await logout();
    // AppNavigator will handle redirecting to Auth screens
    Alert.alert("Logged Out", "You have been successfully logged out.");
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text>No user data found. You might be logged out.</Text>
        <Button title="Go to Login" onPress={handleLogout} /> 
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{user.fullName || 'User Profile'}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <ProfileDetailItem label="Full Name" value={user.fullName} />
          <ProfileDetailItem label="Email" value={user.email} />
          {user.profile && (
            <>
              <ProfileDetailItem label="Age" value={user.profile.age} />
              <ProfileDetailItem label="Gender" value={user.profile.gender} />
              <ProfileDetailItem label="Height" value={user.profile.height ? `${user.profile.height} cm` : undefined} />
              <ProfileDetailItem label="Weight" value={user.profile.weight ? `${user.profile.weight} kg` : undefined} />
              <ProfileDetailItem label="Activity Level" value={user.profile.activityLevel} />
              {user.profile.workoutGoals && user.profile.workoutGoals.length > 0 && (
                <ProfileDetailItem label="Workout Goals" value={user.profile.workoutGoals.join(', ')} />
              )}
              {user.profile.healthConditions && user.profile.healthConditions.length > 0 && (
                 <ProfileDetailItem label="Health Conditions" value={user.profile.healthConditions.join(', ')} />
              )}
               {user.profile.dietaryRestrictions && user.profile.dietaryRestrictions.length > 0 && (
                 <ProfileDetailItem label="Dietary Restrictions" value={user.profile.dietaryRestrictions.join(', ')} />
              )}
            </>
          )}
        </View>

        {/* Placeholder for other sections like App Settings, Help, etc. */}
        {/* <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <Text>...</Text>
        </View> */}

        <View style={styles.logoutButtonContainer}>
          <Button title="Logout" onPress={handleLogout} color="#ff3b30" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8', // Light background for the whole screen
  },
  container: {
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 25,
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1, // Allow text to wrap if long
    textAlign: 'right',
  },
  logoutButtonContainer: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden', // Ensures the button respects the border radius on Android
  },
});

export default ProfileScreen; 