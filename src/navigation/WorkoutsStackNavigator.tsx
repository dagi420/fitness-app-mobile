import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorkoutListScreen from '../screens/Workouts/WorkoutListScreen';
import WorkoutDetailScreen from '../screens/Workouts/WorkoutDetailScreen';
import { RootStackParamList } from './types'; // Or a more specific ParamList if needed

const Stack = createStackNavigator<RootStackParamList>(); // Use RootStackParamList for now

const WorkoutsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hiding header here if MainTabNavigator shows its own
      }}
    >
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
    </Stack.Navigator>
  );
};

export default WorkoutsStackNavigator; 