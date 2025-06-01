import { API_BASE_URL } from './apiConfig';
import { AIPlanConfigData } from '../navigation/types';

// --- Interfaces for Diet Plans ---

export interface Macronutrients {
  proteinGr: number;
  carbsGr: number;
  fatGr: number;
}

export interface FoodItem {
  _id: string; // Or be ObjectId if directly from MongoDB schema for consistency
  foodName: string;
  quantity: string; // e.g., "100g", "1 cup", "1 medium"
  calories: number;
  macronutrients: Macronutrients;
  // description?: string;
  // brandName?: string;
}

export interface Meal {
  _id: string;
  mealName: string; // e.g., "Breakfast", "Lunch", "Snack 1"
  timeSuggestion?: string; // e.g., "08:00", "13:00"
  foodItems: FoodItem[];
  totalMealCalories?: number; // Optional, can be calculated
  totalMealMacronutrients?: Macronutrients; // Optional, can be calculated
}

export interface DietPlan {
  _id: string;
  userId: string; // To associate with a user
  planName: string;
  description?: string;
  dailyCaloricTarget?: number;
  macronutrientTargets?: Macronutrients; // Daily targets
  meals: Meal[];
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  isAIGenerated?: boolean;
  // notes?: string;
}

// --- API Service Function --- 

interface FetchUserDietPlansResponse {
  success: boolean;
  plans?: DietPlan[];
  message?: string;
}

/**
 * Fetches all diet plans for a specific user.
 */
export const fetchUserDietPlans = async (
  token: string,
  userId: string
): Promise<FetchUserDietPlansResponse> => {
  if (!userId) {
    console.error('Fetch user diet plans: User ID is missing.');
    return { success: false, message: 'User ID is required.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/diet-plans?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: FetchUserDietPlansResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user diet plans');
    }
    return data;
  } catch (error) {
    console.error('Fetch user diet plans API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
};

// TODO: Add functions for:
// - fetchDietPlanById(token: string, planId: string)
// - saveUserDietPlan(token: string, dietPlanData: Omit<DietPlan, '_id' | 'createdAt' | 'updatedAt'>)
// - updateUserDietPlan(token: string, planId: string, updates: Partial<DietPlan>)
// - deleteUserDietPlan(token: string, planId: string)

// --- Interface for Save Diet Plan Response ---
interface SaveUserDietPlanResponse {
  success: boolean;
  plan?: DietPlan; // The saved or updated plan
  message?: string;
}

/**
 * Saves a new diet plan for the user.
 */
export const saveUserDietPlan = async (
  token: string,
  userId: string,
  dietPlanData: Omit<DietPlan, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SaveUserDietPlanResponse> => {
  try {
    const payload = {
      ...dietPlanData,
      userId,
    };

    const response = await fetch(`${API_BASE_URL}/user/diet-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data: SaveUserDietPlanResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save diet plan');
    }
    return data;
  } catch (error) {
    console.error('Save user diet plan API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while saving.';
    return { success: false, message: errorMessage };
  }
};

// --- Interface for AI Generated Diet Plan Response ---
export interface GenerateAIDietPlanResponse {
  success: boolean;
  plan?: DietPlan; // The newly generated AI diet plan
  message?: string;
}

/**
 * Requests the AI to generate a diet plan for the authenticated user.
 * The backend will use the user's profile data (goals, health info, etc.) linked to their token.
 */
export const generateAIDietPlan = async (
  token: string,
  config: AIPlanConfigData
): Promise<GenerateAIDietPlanResponse> => {
  try {
    const payload = { 
      config 
    };

    const response = await fetch(`${API_BASE_URL}/ai/generate-diet-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data: GenerateAIDietPlanResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate AI diet plan');
    }
    return data;
  } catch (error) {
    console.error('AI Generate Diet Plan API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during AI plan generation.';
    return { success: false, message: errorMessage };
  }
}; 