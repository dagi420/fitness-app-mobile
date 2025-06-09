import { API_BASE_URL } from '../api/apiConfig';

// Types matching our new database structure
export interface ExerciseMetadata {
  averageCaloriesBurn: number;
  recommendedRestPeriod: string;
  recommendedTempoInSeconds: {
    eccentric: number;
    isometricBottom: number;
    concentric: number;
    isometricTop: number;
  };
}

export interface ExerciseMediaUrls {
  image?: string;
  video?: string;
  thumbnail?: string;
  gif?: string;
}

export interface ExerciseModifications {
  easier: string[];
  harder: string[];
}

export interface RecommendedSets {
  beginner: string;
  intermediate: string;
  advanced: string;
}

export interface Exercise {
  _id: string;
  name: string;
  type: string;
  category: string;
  difficulty: string;
  targetMuscleGroups: string[];
  equipmentNeeded: string[];
  description: {
    short: string;
    full: string;
    benefits: string[];
    commonMistakes: string[];
  };
  mediaUrls?: {
    video?: string;
    image?: string;
  };
  instructions: string[];
  metadata?: {
    caloriesPerMinute?: number;
    restPeriodSeconds?: number;
    recommendedTempo?: string;
  };
}

export interface FetchExercisesResponse {
  success: boolean;
  message?: string;
  exercises?: Exercise[];
}

export const fetchAllExercises = async (token: string): Promise<FetchExercisesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch exercises',
      };
    }

    return {
      success: true,
      exercises: data.exercises,
    };
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return {
      success: false,
      message: 'An error occurred while fetching exercises',
    };
  }
};

// Add more exercise-related API calls here as needed
