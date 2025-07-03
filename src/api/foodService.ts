import { API_BASE_URL } from './apiConfig';
import { FoodItem, Macronutrients } from './dietService'; // Reuse FoodItem and Macronutrients from dietService

export type { FoodItem, Macronutrients }; // Re-export for convenience

interface SearchFoodItemsResponse {
  success: boolean;
  foodItems?: FoodItem[];
  message?: string;
}

const mockFoodDatabase: FoodItem[] = [
  { _id: 'food_apple_123', foodName: 'Apple', quantity: '1 medium (approx 182g)', calories: 95, macronutrients: { proteinGr: 0.5, carbsGr: 25, fatGr: 0.3 } },
  { _id: 'food_banana_456', foodName: 'Banana', quantity: '1 medium (approx 118g)', calories: 105, macronutrients: { proteinGr: 1.3, carbsGr: 27, fatGr: 0.4 } },
  { _id: 'food_chicken_breast_789', foodName: 'Chicken Breast, Cooked', quantity: '100g', calories: 165, macronutrients: { proteinGr: 31, carbsGr: 0, fatGr: 3.6 } },
  { _id: 'food_salmon_101', foodName: 'Salmon, Atlantic, Wild, Cooked', quantity: '100g', calories: 182, macronutrients: { proteinGr: 25, carbsGr: 0, fatGr: 8 } },
  { _id: 'food_brown_rice_112', foodName: 'Brown Rice, Cooked', quantity: '1 cup (approx 195g)', calories: 216, macronutrients: { proteinGr: 5, carbsGr: 45, fatGr: 1.8 } },
  { _id: 'food_white_rice_113', foodName: 'White Rice, Long-grain, Cooked', quantity: '1 cup (approx 158g)', calories: 205, macronutrients: { proteinGr: 4.3, carbsGr: 45, fatGr: 0.4 } },
  { _id: 'food_broccoli_114', foodName: 'Broccoli, Cooked', quantity: '1 cup chopped (approx 91g)', calories: 55, macronutrients: { proteinGr: 3.7, carbsGr: 11.2, fatGr: 0.6 } },
  { _id: 'food_spinach_115', foodName: 'Spinach, Raw', quantity: '1 cup (approx 30g)', calories: 7, macronutrients: { proteinGr: 0.9, carbsGr: 1.1, fatGr: 0.1 } },
  { _id: 'food_almonds_116', foodName: 'Almonds', quantity: '1 oz (approx 23 nuts, 28g)', calories: 164, macronutrients: { proteinGr: 6, carbsGr: 6.1, fatGr: 14.2 } },
  { _id: 'food_peanut_butter_117', foodName: 'Peanut Butter, Smooth', quantity: '2 tablespoons (approx 32g)', calories: 190, macronutrients: { proteinGr: 7, carbsGr: 7.7, fatGr: 16 } },
  { _id: 'food_egg_118', foodName: 'Egg, Large, Hard-boiled', quantity: '1 large (approx 50g)', calories: 78, macronutrients: { proteinGr: 6.3, carbsGr: 0.6, fatGr: 5.3 } },
  { _id: 'food_milk_119', foodName: 'Milk, Whole, 3.25% fat', quantity: '1 cup (approx 244g)', calories: 149, macronutrients: { proteinGr: 7.7, carbsGr: 11.7, fatGr: 8 } },
  { _id: 'food_oats_120', foodName: 'Oats, Rolled, Dry', quantity: '1/2 cup (approx 40g)', calories: 150, macronutrients: { proteinGr: 5, carbsGr: 27, fatGr: 2.5 } },
];

/**
 * Searches for food items based on a query string (mock implementation).
 * In a real app, this would call a backend API.
 */
export const searchFoodItems = async (
  query: string,
  // token: string // If authentication is needed for food search
): Promise<SearchFoodItemsResponse> => {
  console.log(`[foodService] Searching for: "${query}"`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!query.trim()) {
    return { success: true, foodItems: [] }; // Return empty if query is blank
  }

  const lowerCaseQuery = query.toLowerCase();
  const results = mockFoodDatabase.filter(item => 
    item.foodName.toLowerCase().includes(lowerCaseQuery)
  );

  if (results.length > 0) {
    return { success: true, foodItems: results };
  } else {
    return { success: false, message: 'No food items found matching your search.', foodItems: [] };
  }
};

// Potential future functions:
// - fetchFoodItemById(id: string): Promise<FoodItem | null>
// - addCustomFoodItem(foodItemData: Omit<FoodItem, '_id'>): Promise<FoodItem> 