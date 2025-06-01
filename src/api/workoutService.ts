import { API_BASE_URL } from './apiConfig'; // Import from new config file
import { AIWorkoutConfigData } from '../navigation/types'; // Import the config type
import { UserWorkoutPlan } from './planService'; // To type the response for a generated plan

// Define the structure of a Workout object based on your server's response
// This should align with the data in your 'workouts' collection (and the mock data)
export interface ExerciseDetail {
  _id: string;
  name: string;
  description: string;
  muscleGroups: string[]; // e.g., ['Chest', 'Triceps']
  equipment?: string; // e.g., 'Dumbbells', 'Bench'
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions?: string[]; // Step-by-step instructions
  imageUrl?: string; // Optional image URL for visual aid
  videoUrl?: string; // Optional video URL for tutorial
  // Plan-specific properties that can come with an exercise when part of a fetched workout
  sets?: number | string;
  reps?: string;
  durationSeconds?: number;
  order?: number;
  type?: string; // Added type to align with BaseExercise and server mock data for workouts
  // Reps, Sets, Duration, Rest will be part of the WorkoutPlan structure, not the exercise itself
}

export interface Workout {
  _id: string; // Or could be ObjectId if you handle that on client
  name: string;
  description: string;
  type: string;
  difficulty: string;
  durationEstimateMinutes: number;
  exercises: ExerciseDetail[];
  // Add any other fields like imageUrl, tags etc.
}

interface FetchWorkoutsResponse {
  success: boolean;
  workouts?: Workout[];
  message?: string;
}

export const fetchAllWorkouts = async (token: string): Promise<FetchWorkoutsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workouts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // If fetching workouts is a protected route, include Authorization header
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: FetchWorkoutsResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch workouts');
    }
    return data;
  } catch (error) {
    console.error('Fetch workouts API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
};

interface FetchSingleWorkoutResponse {
  success: boolean;
  workout?: Workout; // Uses the same Workout interface
  message?: string;
}

export const fetchWorkoutById = async (workoutId: string, token: string): Promise<FetchSingleWorkoutResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workouts/${workoutId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: FetchSingleWorkoutResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch workout details');
    }
    return data;
  } catch (error) {
    console.error('Fetch single workout API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
};

// Interface for the AI Workout Plan Generation API Response
interface GenerateAIWorkoutPlanResponse {
  success: boolean;
  message: string;
  plan?: UserWorkoutPlan; // The AI generated plan
}

// Function to call the backend for AI workout plan generation
export const generateAIWorkoutPlan = async (
  token: string, 
  config: AIWorkoutConfigData
): Promise<GenerateAIWorkoutPlanResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-workout-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ config }), // Send config in the body
    });

    const data: GenerateAIWorkoutPlanResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate AI workout plan');
    }
    return data;
  } catch (error) {
    console.error('Generate AI workout plan API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
}; 