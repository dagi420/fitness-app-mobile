import { NavigatorScreenParams } from '@react-navigation/native';
import { Workout } from '../api/workoutService';
import { Exercise } from '../api/exerciseService';
import { BaseExercise } from '../screens/Planner/ManualPlanCreatorScreen';
import { DisplayableWorkoutPlan } from '../screens/Workouts/WorkoutListScreen';
import { FoodItem } from '../api/dietService';
import { UserWorkoutPlan } from '../api/planService';
import { ProgressLog } from '../api/progressService';

export interface AIPlanConfigData {
  goal: string;
  foodPreferences: string;
  supplements: string;
  otherNotes: string;
}

export type AIWorkoutConfigData = {
  fitnessGoal: string;
  fitnessLevel: string;
  workoutTypePreferences: string;
  availableEquipment: string[];
  timePerSession: number;
  workoutsPerWeek: number;
  gender: 'male' | 'female' | 'other' | 'not_specified';
};

export type WorkoutsStackParamList = {
  WorkoutsHome: undefined;
  WorkoutList: undefined;
  WorkoutDetail: { workout: DisplayableWorkoutPlan };
  ActiveWorkout: { plan: UserWorkoutPlan };
  ExerciseLibrary: undefined;
  ExerciseDetail: { exercise: Exercise };
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  GoalSelection: undefined;
  UserDetails: undefined;
  MainApp: NavigatorScreenParams<MainTabParamList> | undefined;
  Onboarding: undefined;
  CreatePlan: undefined;
  Profile: undefined;
  ManualPlanCreator: {
    preSelectedExercises?: BaseExercise[];
  };
  ExercisePicker: {
    fromScreen: 'ManualPlanCreator';
  };
  ActiveWorkout: { plan: DisplayableWorkoutPlan };
  ManualDietPlanner: undefined;
  FoodItemPicker: { mealId: string; onFoodItemSelected: (foodItem: FoodItem) => void };
  AIConfigurationScreen: { onSubmit: (config: AIPlanConfigData) => void };
  AIWorkoutConfigurationScreen: {
    onSubmit: (config: AIWorkoutConfigData) => Promise<void>;
  };
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabParamList: NavigatorScreenParams<MainTabParamList>;
  AIOnboarding: undefined;
  AIGeneration: { planType: 'workout' | 'diet' };
  Progress: undefined;
  ProgressHistory: undefined;
  ProgressLogEntry: {
    existingLogData?: ProgressLog;
  };
  PhotoViewer: {
    photoUrls: string[];
    logDate?: string;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: NavigatorScreenParams<WorkoutsStackParamList>;
  CreatePlanTab: undefined;
  Diet: { refresh?: boolean };
  Progress: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

export type DietStackParamList = {
  DietPlanList: undefined;
  DietPlanDetail: { planId: string };
  ManualDietCreator: undefined;
};

export interface UserProfileData {
    age?: number;
    gender?: string;
    height?: number; // cm
    weight?: number; // kg
    workoutGoals?: string[];
    activityLevel?: string; // e.g., Sedentary, Lightly Active, Moderately Active, Very Active
    healthConditions?: string[];
    dietaryRestrictions?: string[];
}
  
export interface OnboardingProfileData extends UserProfileData {
    // any additional fields specific to onboarding that might not be in general UserProfileData
}

export interface AIDietConfigData {
    goal: string; // e.g., 'Weight Loss', 'Muscle Gain', 'Maintenance'
    foodPreferences?: string;
    allergies?: string[];
    dislikedFoods?: string[];
    dailyMeals?: number; // e.g., 3, 5
    snacksPerDay?: number;
    cuisinePreferences?: string;
    cookingTimeAvailable?: string; // e.g., 'Quick (under 30 min)', 'Moderate', 'No limit'
    supplements?: string;
    otherNotes?: string;
}

export type AIPlanStackParamList = {
  AIOnboarding: undefined;
  AIGeneration: { planType: 'workout' | 'diet' };
  AIWorkoutConfigurationScreen: { onSubmit: (config: AIWorkoutConfigData) => void };
  AIDietConfigurationScreen: { onSubmit: (config: AIDietConfigData) => void };
};

export type ProgressLogEntryScreenParams = {
  logToEditId?: string;
  existingLogData?: ProgressLog;
}; 