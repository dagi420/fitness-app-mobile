import { API_BASE_URL } from './apiConfig';

export interface MeasurementData {
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  leftArmCm?: number;
  rightArmCm?: number;
  leftThighCm?: number;
  rightThighCm?: number;
  notes?: string;
}

export interface ProgressLog {
  _id: string;
  userId: string;
  date: string; // ISO date string
  weightKg: number;
  bodyFatPercentage?: number;
  measurements?: MeasurementData;
  createdAt?: string;
  updatedAt?: string;
  photoUrls?: string[]; // Added for photo progress
}

export interface ProgressLogInputData {
  date?: string; // ISO date string, defaults to today on backend if not provided
  weightKg: number;
  bodyFatPercentage?: number;
  measurements?: MeasurementData;
  error?: string;
}

// Interface for photo data to be uploaded
export interface PhotoUpload {
  uri: string;
  name: string;
  type: string; // e.g., 'image/jpeg'
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  log?: T;
  logs?: T[];
  error?: string;
}

const getHeaders = (token: string, isFormData: boolean = false) => {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Add a new progress log
export const addProgressLog = async (
  token: string,
  logData: ProgressLogInputData
): Promise<ApiResponse<ProgressLog>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/progress`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(logData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error in addProgressLog:', error);
    return { success: false, message: 'Network error or unable to reach server.', error: error instanceof Error ? error.message : String(error) };
  }
};

// Fetch all progress logs for a user
export const fetchUserProgressLogs = async (
  token: string,
  userId: string
): Promise<ApiResponse<ProgressLog>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/progress/user/${userId}`, {
      method: 'GET',
      headers: getHeaders(token),
    });
    return await response.json();
  } catch (error) {
    console.error('Error in fetchUserProgressLogs:', error);
    return { success: false, message: 'Network error or unable to reach server.', error: error instanceof Error ? error.message : String(error) };
  }
};

// Update a progress log
export const updateProgressLog = async (
  token: string,
  logId: string,
  logData: Partial<ProgressLogInputData> // Allow partial updates
): Promise<ApiResponse<ProgressLog>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/progress/${logId}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(logData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error in updateProgressLog:', error);
    return { success: false, message: 'Network error or unable to reach server.', error: error instanceof Error ? error.message : String(error) };
  }
};

// Delete a progress log
export const deleteProgressLog = async (
  token: string,
  logId: string
): Promise<ApiResponse<ProgressLog>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/progress/${logId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return await response.json();
  } catch (error) {
    console.error('Error in deleteProgressLog:', error);
    return { success: false, message: 'Network error or unable to reach server.', error: error instanceof Error ? error.message : String(error) };
  }
};

// Upload photos for a progress log
export const uploadProgressPhotos = async (
  token: string,
  logId: string,
  photos: PhotoUpload[] // Array of photo objects
): Promise<ApiResponse<ProgressLog>> => {
  if (photos.length === 0) {
    return { success: true, message: 'No photos to upload.' };
  }

  const formData = new FormData();
  photos.forEach(photo => {
    // The backend multer setup expects field name 'progressPhotos'
    formData.append('progressPhotos', {
      uri: photo.uri,
      name: photo.name,
      type: photo.type,
    } as any); // Type assertion needed for react-native FormData
  });

  try {
    const response = await fetch(`${API_BASE_URL}/progress/${logId}/photos`, {
      method: 'POST',
      headers: getHeaders(token, true), // Indicate FormData is being sent
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error('Error in uploadProgressPhotos:', error);
    return { success: false, message: 'Network error or unable to upload photos.', error: error instanceof Error ? error.message : String(error) };
  }
}; 