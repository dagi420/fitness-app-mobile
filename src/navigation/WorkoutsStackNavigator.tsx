import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorkoutListScreen from '../screens/Workouts/WorkoutListScreen';
import WorkoutDetailScreen from '../screens/Workouts/WorkoutDetailScreen';
import ManualPlanCreatorScreen from '../screens/Planner/ManualPlanCreatorScreen';
import ExercisePickerScreen from '../screens/Planner/ExercisePickerScreen';
import ActiveWorkoutScreen from '../screens/Workouts/ActiveWorkoutScreen';
import ExerciseLibraryScreen from '../screens/Exercises/ExerciseLibraryScreen';
import ExerciseDetailScreen from '../screens/Exercises/ExerciseDetailScreen';
import { WorkoutsStackParamList } from './types';

const Stack = createStackNavigator<WorkoutsStackParamList>();

const WorkoutsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hiding header here if MainTabNavigator shows its own
      }}
    >
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="ManualPlanCreator" component={ManualPlanCreatorScreen} />
      <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      {/* If ActiveWorkoutScreen is primarily launched from WorkoutDetail within this stack,
          it could be added here. However, it's currently in RootStackParamList, 
          allowing navigation from other places too, which might be intended. 
          If it were here, WorkoutDetailScreen would navigate to it as a screen within this same stack.
      */}
      {/* <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} /> */}
    </Stack.Navigator>
  );
};

export default WorkoutsStackNavigator; 