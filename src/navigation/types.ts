import { NavigatorScreenParams } from '@react-navigation/native';
import { ExerciseDetail } from '../api/workoutService';
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

export interface AIWorkoutConfigData {
  fitnessGoal: string;
  fitnessLevel: string;
  gender: string;
  workoutTypePreferences: string;
  availableEquipment: string[];
  timePerSession: number;
  workoutsPerWeek: number;
  targetMuscleGroups?: string;
  otherNotes?: string;
}

export type WorkoutsStackParamList = {
  WorkoutList: undefined;
  WorkoutDetail: { workoutId?: string; planObject?: DisplayableWorkoutPlan };
  ManualPlanCreator: { preSelectedExercises?: BaseExercise[] };
  ExercisePicker: { fromScreen: string };
  ActiveWorkout: { plan: DisplayableWorkoutPlan };
  ExerciseLibrary: undefined;
  ExerciseDetail: { exercise: BaseExercise };
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
  ManualPlanCreator: { preSelectedExercises?: BaseExercise[] };
  ExercisePicker: { fromScreen: string };
  ActiveWorkout: { plan: DisplayableWorkoutPlan };
  ManualDietPlanner: undefined;
  FoodItemPicker: { mealId: string; onFoodItemSelected: (foodItem: FoodItem) => void };
  AIConfigurationScreen: { onSubmit: (config: AIPlanConfigData) => void };
  AIWorkoutConfigurationScreen: { onSubmit: (config: AIWorkoutConfigData) => void };
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabParamList: NavigatorScreenParams<MainTabParamList>;
  AIOnboarding: undefined;
  AIGeneration: { planType: 'workout' | 'diet' };
  ProgressLogEntry: ProgressLogEntryScreenParams | undefined;
  ProgressHistory: undefined;
  PhotoViewer: { photoUrls: string[]; logDate?: string; };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: NavigatorScreenParams<WorkoutsStackParamList>;
  Diet: { refresh?: boolean };
  AIPlanner: NavigatorScreenParams<AIPlanStackParamList>;
  Profile: undefined;
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