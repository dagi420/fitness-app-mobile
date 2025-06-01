import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types'; // Assuming types are in this path
import { useAuth } from '../../store/AuthContext';
import { saveUserDietPlan, DietPlan, Meal, FoodItem, Macronutrients } from '../../api/dietService'; // Will be needed later

type ManualDietPlannerNavigationProp = StackNavigationProp<RootStackParamList, 'ManualDietPlanner'>;
// type ManualDietPlannerRouteProp = RouteProp<RootStackParamList, 'ManualDietPlanner'>; // If it needs params

const ManualDietPlannerScreen = () => {
  const navigation = useNavigation<ManualDietPlannerNavigationProp>();
  // const route = useRoute<ManualDietPlannerRouteProp>();
  const { user, token } = useAuth();

  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetFat, setTargetFat] = useState('');
  const [meals, setMeals] = useState<Meal[]>([]); // Replace any with Meal[] later
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMeal = () => {
    setMeals(prevMeals => [
      ...prevMeals,
      { 
        _id: `temp-meal-${Date.now()}`, // Temporary ID, backend will assign actual
        mealName: `Meal ${prevMeals.length + 1}`, 
        foodItems: [],
        // timeSuggestion could be added later if needed
      }
    ]);
  };

  const handleRemoveMeal = (mealIdToRemove: string) => {
    setMeals(prevMeals => prevMeals.filter(meal => meal._id !== mealIdToRemove));
  };

  const handleMealNameChange = (newName: string, mealIdToUpdate: string) => {
    setMeals(prevMeals => 
      prevMeals.map(meal => 
        meal._id === mealIdToUpdate ? { ...meal, mealName: newName } : meal
      )
    );
  };

  const handleAddFoodItemToMeal = (mealId: string) => {
    // Placeholder for navigating to a food item picker or opening a modal
    // Alert.alert("Add Food", `Logic to add food to meal ${mealId} will be here.`);
    navigation.navigate('FoodItemPicker', {
      mealId,
      onFoodItemSelected: (foodItem) => handleFoodItemSelected(mealId, foodItem),
    });
  };

  const handleFoodItemSelected = (mealId: string, foodItem: FoodItem) => {
    setMeals(prevMeals =>
      prevMeals.map(meal =>
        meal._id === mealId
          ? { ...meal, foodItems: [...meal.foodItems, foodItem] }
          : meal
      )
    );
  };

  const handleRemoveFoodItemFromMeal = (mealId: string, foodItemId: string) => {
    setMeals(prevMeals =>
      prevMeals.map(meal =>
        meal._id === mealId
          ? { ...meal, foodItems: meal.foodItems.filter(item => item._id !== foodItemId) }
          : meal
      )
    );
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for your diet plan.');
      return;
    }
    if (!targetCalories.trim() || !targetProtein.trim() || !targetCarbs.trim() || !targetFat.trim()) {
      Alert.alert('Validation Error', 'Please fill in all target calorie and macronutrient fields.');
      return;
    }
    if (meals.some(meal => meal.foodItems.length === 0)) {
      Alert.alert('Validation Error', 'All meals must contain at least one food item.');
      return;
    }
    if (meals.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one meal to your diet plan.');
      return;
    }

    setIsLoading(true);
    try {
      if (!user?._id || !token) {
        Alert.alert("Error", "User not authenticated.");
        setIsLoading(false);
        return;
      }

      const planToSave: Omit<DietPlan, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        planName: planName.trim(),
        description: description.trim() || undefined,
        dailyCaloricTarget: parseInt(targetCalories, 10),
        macronutrientTargets: {
          proteinGr: parseInt(targetProtein, 10),
          carbsGr: parseInt(targetCarbs, 10),
          fatGr: parseInt(targetFat, 10),
        },
        meals: meals.map(m => ({
            mealName: m.mealName,
            foodItems: m.foodItems.map(fi => ({
                foodName: fi.foodName,
                quantity: fi.quantity,
                calories: fi.calories,
                macronutrients: fi.macronutrients,
            })),
            timeSuggestion: m.timeSuggestion || undefined,
        })) as any, // Cast to any to bypass strict Meal type check for submission
      };
      
      console.log("Plan to save:", JSON.stringify(planToSave, null, 2));
      
      const result = await saveUserDietPlan(token, user._id, planToSave);
      if (result.success && result.plan) {
        Alert.alert("Success", "Diet plan saved successfully!");
        navigation.navigate('MainApp', { screen: 'Diet', params: { refresh: true } });
      } else {
        Alert.alert("Error saving plan", result.message || "Could not save diet plan. Please try again.");
      }

    } catch (error) {
      console.error("Error saving diet plan:", error);
      Alert.alert('Error', 'An unexpected error occurred while saving the diet plan. ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create New Diet Plan</Text>

        <TextInput
          style={styles.input}
          placeholder="Plan Name (e.g., My Lean Bulk Plan)"
          value={planName}
          onChangeText={setPlanName}
        />
        <TextInput
          style={styles.input}
          placeholder="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        
        <Text style={styles.sectionTitle}>Daily Targets</Text>
        <TextInput
          style={styles.input}
          placeholder="Target Calories (e.g., 2500 kcal)"
          value={targetCalories}
          onChangeText={setTargetCalories}
          keyboardType="numeric"
        />
        <View style={styles.macrosRow}>
          <TextInput
            style={[styles.input, styles.macrosInput]}
            placeholder="Protein (g)"
            value={targetProtein}
            onChangeText={setTargetProtein}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.macrosInput]}
            placeholder="Carbs (g)"
            value={targetCarbs}
            onChangeText={setTargetCarbs}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.macrosInput]}
            placeholder="Fat (g)"
            value={targetFat}
            onChangeText={setTargetFat}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.sectionTitle}>Meals</Text>
        {/* Placeholder for meals list and add food items to meals */}
        <View style={styles.mealSectionPlaceholder}>
            <Text>Meal management UI will go here.</Text>
            <Button title="Add Meal" onPress={handleAddMeal} />
        </View>
        
        {/* Display Meals and Food Items (to be implemented) */}
        {meals.map((meal, mealIndex) => (
          <View key={meal._id} style={styles.mealContainer}>
            <View style={styles.mealHeader}>
              <TextInput
                style={styles.mealNameInput}
                value={meal.mealName}
                onChangeText={(text) => handleMealNameChange(text, meal._id)}
                placeholder="Meal Name (e.g., Breakfast)"
              />
              <TouchableOpacity onPress={() => handleRemoveMeal(meal._id)} style={styles.removeMealButton}>
                <Text style={styles.removeMealButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
            {/* Placeholder for food items in this meal */}
            <Text style={styles.foodItemsPlaceholderText}>Food items for this meal will appear here.</Text>
            <Button title="Add Food Item" onPress={() => handleAddFoodItemToMeal(meal._id)} />

            {/* Render food items here once implemented */}
            {meal.foodItems.length > 0 ? (
              meal.foodItems.map((foodItem, foodItemIndex) => (
                <View key={`${foodItem._id}-${foodItemIndex}`} style={styles.foodItemContainer}>
                  <View style={styles.foodItemDetailsContainer}>
                    <Text style={styles.foodItemName}>{foodItem.foodName} ({foodItem.quantity})</Text>
                    <Text style={styles.foodItemMacros}>
                      {foodItem.calories} kcal | P: {foodItem.macronutrients.proteinGr}g, C: {foodItem.macronutrients.carbsGr}g, F: {foodItem.macronutrients.fatGr}g
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeFoodItemButton}
                    onPress={() => handleRemoveFoodItemFromMeal(meal._id, foodItem._id)}>
                    <Text style={styles.removeFoodItemButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noFoodItemsText}>No food items added to this meal yet.</Text>
            )}
            {/* meal.foodItems.map((foodItem, foodItemIndex) => ( ... )) */}
          </View>
        ))}

        <View style={styles.saveButtonContainer}>
          <Button title={isLoading ? "Saving..." : "Save Diet Plan"} onPress={handleSavePlan} disabled={isLoading} color="#007AFF"/>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#444',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macrosInput: {
    flex: 1,
    marginHorizontal: 4, // Add some spacing between macro inputs
  },
  mealSectionPlaceholder: {
    padding: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    marginBottom: 20,
  },
  saveButtonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  mealContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
  },
  removeMealButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ff4d4f',
    borderRadius: 5,
  },
  removeMealButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  foodItemsPlaceholderText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginVertical: 10,
  },
  noFoodItemsText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#888',
    marginVertical: 10,
  },
  foodItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  foodItemDetailsContainer: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodItemMacros: {
    fontSize: 12,
    color: '#555',
  },
  removeFoodItemButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ff6b6b',
    borderRadius: 4,
    marginLeft: 10,
  },
  removeFoodItemButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  }
});

export default ManualDietPlannerScreen; 