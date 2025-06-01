import { API_BASE_URL } from './apiConfig'; // Import from new config file

interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
}

interface RegistrationResponse {
  success: boolean;
  message: string;
  userId?: string;
  token?: string;
  // Add any other relevant fields from your API response
}

export const registerUser = async (userData: RegistrationData): Promise<RegistrationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data: RegistrationResponse = await response.json();

    if (!response.ok) {
      // If server returns an error (e.g., 4xx, 5xx status codes)
      // data.message should ideally contain the error message from the backend
      throw new Error(data.message || 'Registration failed due to server error');
    }

    return data; // Should include { success: true, ... }
  } catch (error) {
    console.error('Registration API error:', error);
    // Handle network errors or other issues
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during registration.';
    return { success: false, message: errorMessage };
  }
};

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  dateOfBirth?: Date | string | null; // Date or string depending on how you store/send it
  gender?: string | null;
  age?: number | null; // Added
  height?: number | null; // Added, cm
  weight?: number | null; // Added, kg
  workoutGoals?: string[];
  activityLevel?: string;
  healthConditions?: string[];
  dietaryRestrictions?: string[];
  preferredWorkoutTypes?: string[];
  availableEquipment?: string[];
  // Add other profile fields from your schema
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  // Add other fields you expect in the user object from the server
  // (excluding hashedPassword)
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export const loginUser = async (credentials: LoginData): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data: LoginResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed due to server error');
    }
    return data;
  } catch (error) {
    console.error('Login API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during login.';
    return { success: false, message: errorMessage };
  }
};

// Interface for the data sent during onboarding profile update
export interface OnboardingProfileData {
  // From GoalSelectionScreen (example - you might get this from previous step or state)
  workoutGoals?: string[]; 
  
  // From UserDetailsScreen
  age?: number;
  gender?: string;
  height?: number; // cm
  weight?: number; // kg
  activityLevel?: string;
  healthConditions?: string[];
  dietaryRestrictions?: string[];
  // Add any other fields you collect
}

// Interface for the response from the profile update endpoint
// It should ideally return the updated user object
export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user?: User; // The updated user object
}

export const updateUserProfileOnboarding = async (userId: string, profileData: OnboardingProfileData, token: string): Promise<UpdateProfileResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile/onboard`, { // Assuming this new endpoint
      method: 'PUT', // Or POST, depending on your API design for updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Send auth token for protected route
      },
      body: JSON.stringify({ userId, ...profileData }), // Send userId if not implicitly known by token on backend
    });

    const data: UpdateProfileResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    return data;
  } catch (error) {
    console.error('Update profile API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during profile update.';
    return { success: false, message: errorMessage };
  }
};

// You can add other auth functions here later, e.g., loginUser 