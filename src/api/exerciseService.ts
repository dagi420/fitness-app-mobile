import { API_BASE_URL } from './apiConfig';
import { BaseExercise } from '../screens/Planner/ManualPlanCreatorScreen'; // Import BaseExercise type

interface FetchAllExercisesResponse {
  success: boolean;
  exercises?: BaseExercise[];
  message?: string;
}

export const fetchAllIndividualExercises = async (token: string): Promise<FetchAllExercisesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Assuming this route needs auth
      },
    });

    const data: FetchAllExercisesResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch exercises');
    }
    return data;
  } catch (error) {
    console.error('Fetch all individual exercises API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
};
