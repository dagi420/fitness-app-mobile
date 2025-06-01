import { ExerciseDetail } from '../api/workoutService';
import { BaseExercise } from '../screens/Planner/ManualPlanCreatorScreen';
import { DisplayableWorkoutPlan } from '../screens/Workouts/WorkoutListScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  GoalSelection: undefined;
  UserDetails: undefined;
  MainApp: undefined;
  Onboarding: undefined;
  WorkoutList: undefined;
  WorkoutDetail: { workoutId?: string, planObject?: DisplayableWorkoutPlan };
  CreatePlan: undefined;
  Profile: undefined;
  ManualPlanCreator: { preSelectedExercises?: BaseExercise[] };
  ExercisePicker: { fromScreen: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  CreatePlanTab: undefined; 
  Diet: undefined;
  Progress: undefined;
}; 