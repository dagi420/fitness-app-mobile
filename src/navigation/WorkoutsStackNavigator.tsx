import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WorkoutsStackParamList } from './types';
import WorkoutsHomeScreen from '../screens/Workouts/WorkoutsHomeScreen';
import WorkoutListScreen from '../screens/Workouts/WorkoutListScreen';
import WorkoutDetailScreen from '../screens/Workouts/WorkoutDetailScreen';
import ActiveWorkoutScreen from '../screens/Workouts/ActiveWorkoutScreen';
import ExerciseLibraryScreen from '../screens/Exercises/ExerciseLibraryScreen';
import ExerciseDetailScreen from '../screens/Exercises/ExerciseDetailScreen';
import { useAppTheme } from '../styles/useAppTheme';

const Stack = createStackNavigator<WorkoutsStackParamList>();

const WorkoutsStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.currentColors.background }
      }}
    >
      <Stack.Screen name="WorkoutsHome" component={WorkoutsHomeScreen} />
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
    </Stack.Navigator>
  );
};

export default WorkoutsStackNavigator; 