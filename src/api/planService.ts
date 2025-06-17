import { API_BASE_URL } from './apiConfig';
import { PlannedExercise } from '../screens/Planner/ManualPlanCreatorScreen'; // Assuming PlannedExercise is exported

export interface UserWorkoutPlan {
  _id: string;
  userId: string;
  planName: string;
  exercises: PlannedExercise[];
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  isAIgenerated: boolean;
  durationEstimateMinutes?: number;
  caloriesBurned?: number;
  description?: string;
  type?: string;
  difficulty?: string;
}

interface SaveWorkoutPlanData {
  userId: string;
  planName: string;
  exercises: PlannedExercise[];
}

interface SaveWorkoutPlanResponse {
  success: boolean;
  message: string;
  planId?: string;
  plan?: UserWorkoutPlan;
}

export const saveUserWorkoutPlan = async (
  token: string,
  planData: SaveWorkoutPlanData
): Promise<SaveWorkoutPlanResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/workout-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });

    const data: SaveWorkoutPlanResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save workout plan');
    }
    return data;
  } catch (error) {
    console.error('Save workout plan API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
};

interface FetchUserWorkoutPlansResponse {
  success: boolean;
  plans?: UserWorkoutPlan[]; // Reuses the UserWorkoutPlan interface
  message?: string;
}

export const fetchUserWorkoutPlans = async (
  token: string,
  userId: string
): Promise<FetchUserWorkoutPlansResponse> => {
  try {
    // Ensure userId is provided
    if (!userId) {
      console.error('Fetch user workout plans: User ID is missing.');
      return { success: false, message: 'User ID is required.' };
    }

    const response = await fetch(`${API_BASE_URL}/user/workout-plans?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: FetchUserWorkoutPlansResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user workout plans');
    }
    return data;
  } catch (error) {
    console.error('Fetch user workout plans API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
};

interface DeleteWorkoutPlanResponse {
  success: boolean;
  message: string;
}

export const deleteUserWorkoutPlan = async (
  token: string,
  planId: string
): Promise<DeleteWorkoutPlanResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/workout-plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: DeleteWorkoutPlanResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete workout plan');
    }
    return data;
  } catch (error) {
    console.error('Delete workout plan API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
}; 