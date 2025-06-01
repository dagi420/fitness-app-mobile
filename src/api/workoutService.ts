import { API_BASE_URL } from './apiConfig'; // Import from new config file

// Define the structure of a Workout object based on your server's response
// This should align with the data in your 'workouts' collection (and the mock data)
export interface ExerciseDetail {
  exerciseName: string; // Or exerciseId if you reference an 'exercises' collection
  sets?: number | string;
  reps?: string;
  durationSeconds?: number;
  // Add other relevant exercise details
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