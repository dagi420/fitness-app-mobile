import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useAuth } from '../store/AuthContext'; // Import useAuth
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'; // Added Text for loading indicator

// Import screens
import WelcomeScreen from '../screens/Home/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
// Import Onboarding screens
import GoalSelectionScreen from '../screens/Onboarding/GoalSelectionScreen';
import UserDetailsScreen from '../screens/Onboarding/UserDetailsScreen'; // Import UserDetailsScreen
import MainTabNavigator from './MainTabNavigator'; // Import MainTabNavigator
import CreatePlanScreen from '../screens/Planner/CreatePlanScreen'; // Import CreatePlanScreen
import ProfileScreen from '../screens/Profile/ProfileScreen'; // Import ProfileScreen
import ManualPlanCreatorScreen from '../screens/Planner/ManualPlanCreatorScreen'; // Import ManualPlanCreatorScreen
import ExercisePickerScreen from '../screens/Planner/ExercisePickerScreen'; // Import ExercisePickerScreen
// import UserDetailsScreen from '../screens/Onboarding/UserDetailsScreen'; // We'll handle navigation to this from GoalSelectionScreen

// Remove MainAppPlaceholder or comment it out
/*
const MainAppPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Main App Dashboard / Home Screen</Text>
  </View>
);
*/

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* 
              Further logic can be added here: 
              If user.profile.onboardingComplete (or similar flag) is false, 
              navigate to a specific OnboardingStack. Otherwise, to MainAppStack.
              For now, we'll just show MainAppPlaceholder or Onboarding directly.
            */}
            {user && user.profile && user.profile.gender ? ( // Example check for onboarding
              <>
                <Stack.Screen name="MainApp" component={MainTabNavigator} />
                {/* Add CreatePlanScreen to the stack, possibly as a modal */}
                <Stack.Screen 
                  name="CreatePlan" 
                  component={CreatePlanScreen} 
                  options={{ 
                    headerShown: false, // Or customize header as needed
                    presentation: 'modal', // Example: present as a modal
                  }} 
                />
                <Stack.Screen 
                  name="Profile" 
                  component={ProfileScreen} 
                  options={{ 
                    headerShown: true, // Show header for Profile screen, or customize as needed
                    title: 'My Profile' 
                  }} 
                />
                <Stack.Screen 
                  name="ManualPlanCreator" 
                  component={ManualPlanCreatorScreen} 
                  options={{ 
                    headerShown: true, // Or false if it has its own header
                    title: 'Create New Plan' 
                  }} 
                />
                <Stack.Screen 
                  name="ExercisePicker" 
                  component={ExercisePickerScreen} 
                  options={{ 
                    headerShown: true, 
                    title: 'Select Exercises', 
                    // presentation: 'modal', // Optionally present as a modal
                  }} 
                />
              </>
            ) : (
              // Group onboarding screens if user is not fully onboarded
              <>
                <Stack.Screen name="Onboarding" component={GoalSelectionScreen} options={{ headerShown: true, title: 'Your Goals'}}/>
                <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ headerShown: true, title: 'Your Details' }} />
              </>
            )}
            {/* Add other authenticated screens or nested navigators here */}
            {/* e.g., <Stack.Screen name="Profile" component={ProfileScreen} /> */}
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Login' }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: true, title: 'Create Account' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: 'Reset Password' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator; 