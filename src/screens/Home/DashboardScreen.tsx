import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../store/AuthContext'; // To access logout
import { StackNavigationProp } from '@react-navigation/stack'; // For navigation type
import { RootStackParamList } from '../../navigation/types'; // Assuming MainApp might want to navigate

// If DashboardScreen is part of RootStackParamList directly, or a nested navigator's param list
type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>; // Or a more specific type if MainApp is a navigator

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // AppNavigator will automatically redirect to Auth screens due to change in isAuthenticated
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.fullName || 'User'}!</Text>
      <Text style={styles.subtitle}>This is your main dashboard.</Text>
      {/* Add more dashboard content here */}
      <Button title="Go to Profile (Example)" onPress={() => console.log('Navigate to Profile')} />
      <View style={styles.spacer} />
      <Button title="Logout" onPress={handleLogout} color="#dc3545"/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
  },
  spacer: {
    height: 20,
  }
});

export default DashboardScreen; 