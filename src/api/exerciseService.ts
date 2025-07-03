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
  imageUrl?: string; // Legacy field for backward compatibility
  mediaUrls?: ExerciseMediaUrls; // New comprehensive media URLs
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

export interface UploadExerciseImagesResponse {
  success: boolean;
  message?: string;
  mediaUrls?: ExerciseMediaUrls;
}

export interface UpdateExerciseVideoResponse {
  success: boolean;
  message?: string;
  mediaUrls?: ExerciseMediaUrls;
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

export const uploadExerciseImages = async (
  token: string,
  exerciseId: string,
  images: {
    image?: { uri: string; name: string; type: string };
    thumbnail?: { uri: string; name: string; type: string };
    gif?: { uri: string; name: string; type: string };
  }
): Promise<UploadExerciseImagesResponse> => {
  try {
    const formData = new FormData();

    // Append images to form data
    if (images.image) {
      formData.append('image', {
        uri: images.image.uri,
        name: images.image.name,
        type: images.image.type,
      } as any);
    }
    if (images.thumbnail) {
      formData.append('thumbnail', {
        uri: images.thumbnail.uri,
        name: images.thumbnail.name,
        type: images.thumbnail.type,
      } as any);
    }
    if (images.gif) {
      formData.append('gif', {
        uri: images.gif.uri,
        name: images.gif.name,
        type: images.gif.type,
      } as any);
    }

    const response = await fetch(`${API_BASE_URL}/exercises/${exerciseId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header, let the browser set it for FormData
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to upload exercise images',
      };
    }

    return {
      success: true,
      message: data.message,
      mediaUrls: data.mediaUrls,
    };
  } catch (error) {
    console.error('Error uploading exercise images:', error);
    return {
      success: false,
      message: 'An error occurred while uploading images',
    };
  }
};

export const updateExerciseVideo = async (
  token: string,
  exerciseId: string,
  videoUrl: string
): Promise<UpdateExerciseVideoResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercises/${exerciseId}/video`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to update exercise video',
      };
    }

    return {
      success: true,
      message: data.message,
      mediaUrls: data.mediaUrls,
    };
  } catch (error) {
    console.error('Error updating exercise video:', error);
    return {
      success: false,
      message: 'An error occurred while updating video',
    };
  }
};

// Helper function to get the best available image URL for an exercise
export const getExerciseImageUrl = (exercise: Exercise): string => {
  // Priority: mediaUrls.image -> mediaUrls.thumbnail -> imageUrl -> placeholder
  if (exercise.mediaUrls?.image) return exercise.mediaUrls.image;
  if (exercise.mediaUrls?.thumbnail) return exercise.mediaUrls.thumbnail;
  if (exercise.imageUrl) return exercise.imageUrl;
  return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?fit=crop&w=400&h=300&q=80'; // Fitness placeholder
};

// Helper function to get thumbnail URL for an exercise
export const getExerciseThumbnailUrl = (exercise: Exercise): string => {
  // Priority: mediaUrls.thumbnail -> mediaUrls.image -> imageUrl -> placeholder
  if (exercise.mediaUrls?.thumbnail) return exercise.mediaUrls.thumbnail;
  if (exercise.mediaUrls?.image) return exercise.mediaUrls.image;
  if (exercise.imageUrl) return exercise.imageUrl;
  return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?fit=crop&w=300&h=200&q=80'; // Fitness thumbnail placeholder
};

// Add more exercise-related API calls here as needed
