import React, { useState, useMemo } from 'react';
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
  StatusBar,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types'; // Assuming types are in this path
import { useAuth } from '../../store/AuthContext';
import { saveUserDietPlan, DietPlan, Meal, FoodItem, Macronutrients } from '../../api/dietService'; // Will be needed later
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

type ManualDietPlannerNavigationProp = StackNavigationProp<RootStackParamList, 'ManualDietPlanner'>;
// type ManualDietPlannerRouteProp = RouteProp<RootStackParamList, 'ManualDietPlanner'>; // If it needs params

// Helper function to calculate meal totals
const calculateMealTotals = (meal: Meal): { calories: number; macros: Macronutrients } => {
  let totalCalories = 0;
  let totalMacros: Macronutrients = { proteinGr: 0, carbsGr: 0, fatGr: 0 };

  meal.foodItems.forEach(item => {
    totalCalories += item.calories;
    totalMacros.proteinGr += item.macronutrients.proteinGr;
    totalMacros.carbsGr += item.macronutrients.carbsGr;
    totalMacros.fatGr += item.macronutrients.fatGr;
  });

  return { calories: totalCalories, macros: totalMacros };
};

// Helper function to calculate total plan macros
const calculatePlanTotals = (meals: Meal[]): { calories: number; macros: Macronutrients } => {
  let totalCalories = 0;
  let totalMacros: Macronutrients = { proteinGr: 0, carbsGr: 0, fatGr: 0 };

  meals.forEach(meal => {
    const mealTotals = calculateMealTotals(meal);
    totalCalories += mealTotals.calories;
    totalMacros.proteinGr += mealTotals.macros.proteinGr;
    totalMacros.carbsGr += mealTotals.macros.carbsGr;
    totalMacros.fatGr += mealTotals.macros.fatGr;
  });

  return { calories: totalCalories, macros: totalMacros };
};

// Modern Food Item Component
const FoodItemCard: React.FC<{ 
  item: FoodItem; 
  onRemove: () => void;
}> = ({ item, onRemove }) => (
  <View style={styles.foodItemCard}>
    <View style={styles.foodItemHeader}>
      <View style={styles.foodItemInfo}>
        <Text style={styles.foodItemName}>{item.foodName}</Text>
        <Text style={styles.foodItemQuantity}>{item.quantity}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeFoodButton}>
        <Ionicons name="close-circle" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
    <View style={styles.foodItemNutrition}>
      <View style={styles.caloriesContainer}>
        <Ionicons name="flame-outline" size={14} color="#FF6B6B" />
        <Text style={styles.caloriesText}>{item.calories} kcal</Text>
      </View>
      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>P</Text>
          <Text style={styles.macroValue}>{item.macronutrients.proteinGr}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>C</Text>
          <Text style={styles.macroValue}>{item.macronutrients.carbsGr}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>F</Text>
          <Text style={styles.macroValue}>{item.macronutrients.fatGr}g</Text>
        </View>
      </View>
    </View>
  </View>
);

// Modern Meal Component
const MealCard: React.FC<{
  meal: Meal;
  onUpdateName: (name: string) => void;
  onRemove: () => void;
  onAddFood: () => void;
  onRemoveFood: (foodId: string) => void;
}> = ({ meal, onUpdateName, onRemove, onAddFood, onRemoveFood }) => {
  const mealTotals = useMemo(() => calculateMealTotals(meal), [meal]);

  const getMealIcon = (mealName: string) => {
    const name = mealName.toLowerCase();
    if (name.includes('breakfast')) return 'sunny-outline';
    if (name.includes('lunch')) return 'partly-sunny-outline';
    if (name.includes('dinner')) return 'moon-outline';
    if (name.includes('snack')) return 'nutrition-outline';
    return 'restaurant-outline';
  };

  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealHeaderLeft}>
          <View style={styles.mealIconContainer}>
            <Ionicons name={getMealIcon(meal.mealName)} size={18} color="#01D38D" />
          </View>
          <TextInput
            style={styles.mealNameInput}
            value={meal.mealName}
            onChangeText={onUpdateName}
            placeholder="Meal name..."
            placeholderTextColor="#696E79"
          />
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeMealButton}>
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {mealTotals.calories > 0 && (
        <View style={styles.mealSummary}>
          <Text style={styles.mealCalories}>{mealTotals.calories} kcal</Text>
          <View style={styles.mealMacros}>
            <Text style={styles.mealMacroText}>P: {mealTotals.macros.proteinGr}g</Text>
            <Text style={styles.mealMacroText}>C: {mealTotals.macros.carbsGr}g</Text>
            <Text style={styles.mealMacroText}>F: {mealTotals.macros.fatGr}g</Text>
          </View>
        </View>
      )}

      <View style={styles.foodItemsList}>
        {meal.foodItems.length > 0 ? (
          meal.foodItems.map((foodItem, index) => (
            <FoodItemCard
              key={`${foodItem._id}-${index}`}
              item={foodItem}
              onRemove={() => onRemoveFood(foodItem._id)}
            />
          ))
        ) : (
          <View style={styles.emptyMealState}>
            <Ionicons name="restaurant-outline" size={30} color="#A0A5B1" />
            <Text style={styles.emptyMealText}>No food items added yet</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.addFoodButton} onPress={onAddFood}>
        <Ionicons name="add-circle-outline" size={20} color="#01D38D" />
        <Text style={styles.addFoodButtonText}>Add Food Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const ManualDietPlannerScreen = () => {
  const navigation = useNavigation<ManualDietPlannerNavigationProp>();
  // const route = useRoute<ManualDietPlannerRouteProp>();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();

  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetFat, setTargetFat] = useState('');
  const [meals, setMeals] = useState<Meal[]>([]); // Replace any with Meal[] later
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (
    title: string,
    message: string,
    buttons: any[],
    iconName?: keyof typeof Ionicons.glyphMap,
    iconColor?: string,
  ) => {
    setAlertInfo({ visible: true, title, message, buttons, iconName, iconColor });
  };

  const planTotals = useMemo(() => calculatePlanTotals(meals), [meals]);

  const handleAddMeal = () => {
    const mealNumber = meals.length + 1;
    const defaultMealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const mealName = mealNumber <= 4 ? defaultMealNames[mealNumber - 1] : `Meal ${mealNumber}`;
    
    setMeals(prevMeals => [
      ...prevMeals,
      { 
        _id: `temp-meal-${Date.now()}`,
        mealName,
        foodItems: [],
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

  const validateForm = (): string | null => {
    if (!planName.trim()) return 'Please enter a name for your diet plan.';
    if (!targetCalories.trim() || isNaN(Number(targetCalories)) || Number(targetCalories) <= 0) {
      return 'Please enter a valid target calorie amount.';
    }
    if (!targetProtein.trim() || isNaN(Number(targetProtein)) || Number(targetProtein) < 0) {
      return 'Please enter a valid protein target.';
    }
    if (!targetCarbs.trim() || isNaN(Number(targetCarbs)) || Number(targetCarbs) < 0) {
      return 'Please enter a valid carbs target.';
    }
    if (!targetFat.trim() || isNaN(Number(targetFat)) || Number(targetFat) < 0) {
      return 'Please enter a valid fat target.';
    }
    if (meals.length === 0) return 'Please add at least one meal to your diet plan.';
    if (meals.some(meal => meal.foodItems.length === 0)) {
      return 'All meals must contain at least one food item.';
    }
    return null;
  };

  const handleSavePlan = async () => {
    const validationError = validateForm();
    if (validationError) {
      showAlert(
        'Validation Error',
        validationError,
        [{ text: 'OK', onPress: () => {} }],
        'alert-circle-outline',
        '#FF9F0A'
      );
      return;
    }

    if (!user?._id || !token) {
      showAlert(
        'Authentication Error',
        'User not authenticated. Please log in again.',
        [{ text: 'OK', onPress: () => {} }],
        'alert-circle-outline',
        '#FF6B6B'
      );
      return;
    }

    setIsLoading(true);
    try {
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
        })) as any,
      };
      
      const result = await saveUserDietPlan(token, user._id, planToSave);
      if (result.success && result.plan) {
        showAlert(
          'Success!',
          'Your diet plan has been saved successfully!',
          [{ 
            text: 'Great!', 
            onPress: () => navigation.navigate('MainApp', { screen: 'Diet', params: { refresh: true } })
          }],
          'checkmark-circle-outline',
          '#01D38D'
        );
      } else {
        showAlert(
          'Save Failed',
          result.message || 'Could not save diet plan. Please try again.',
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle-outline',
          '#FF6B6B'
        );
      }
    } catch (error) {
      console.error("Error saving diet plan:", error);
      showAlert(
        'Error',
        'An unexpected error occurred while saving the diet plan.',
        [{ text: 'OK', onPress: () => {} }],
        'alert-circle-outline',
        '#FF6B6B'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Diet Plan</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <ImageBackground
          source={{ 
            uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?fit=crop&w=1200&q=80' 
          }}
          style={styles.heroSection}
          imageStyle={{ borderRadius: 20 }}
        >
          <LinearGradient
            colors={['rgba(25, 30, 41, 0.8)', 'rgba(25, 30, 41, 0.6)']}
            style={styles.heroOverlay}
          >
            <Ionicons name="create-outline" size={40} color="#01D38D" />
            <Text style={styles.heroTitle}>Build Your Custom Plan</Text>
            <Text style={styles.heroSubtitle}>Design a personalized nutrition plan that fits your goals</Text>
          </LinearGradient>
        </ImageBackground>

        {/* Plan Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan Details</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#A0A5B1" />
            <TextInput
              style={styles.input}
              placeholder="Plan name (e.g., My Cutting Plan)"
              placeholderTextColor="#696E79"
              value={planName}
              onChangeText={setPlanName}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="pencil-outline" size={20} color="#A0A5B1" />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Description (optional)"
              placeholderTextColor="#696E79"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Daily Targets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Targets</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="flame-outline" size={20} color="#FF6B6B" />
            <TextInput
              style={styles.input}
              placeholder="Target calories (e.g., 2500)"
              placeholderTextColor="#696E79"
              value={targetCalories}
              onChangeText={setTargetCalories}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.macrosRow}>
            <View style={styles.macroInputContainer}>
              <Text style={styles.macroInputLabel}>Protein</Text>
              <TextInput
                style={styles.macroInput}
                placeholder="150g"
                placeholderTextColor="#696E79"
                value={targetProtein}
                onChangeText={setTargetProtein}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInputContainer}>
              <Text style={styles.macroInputLabel}>Carbs</Text>
              <TextInput
                style={styles.macroInput}
                placeholder="250g"
                placeholderTextColor="#696E79"
                value={targetCarbs}
                onChangeText={setTargetCarbs}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInputContainer}>
              <Text style={styles.macroInputLabel}>Fat</Text>
              <TextInput
                style={styles.macroInput}
                placeholder="80g"
                placeholderTextColor="#696E79"
                value={targetFat}
                onChangeText={setTargetFat}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Plan Summary */}
        {meals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Plan Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Ionicons name="flame-outline" size={20} color="#FF6B6B" />
                <Text style={styles.summaryValue}>{planTotals.calories}</Text>
                <Text style={styles.summaryLabel}>Total Calories</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="restaurant-outline" size={20} color="#4ECDC4" />
                <Text style={styles.summaryValue}>{meals.length}</Text>
                <Text style={styles.summaryLabel}>Meals</Text>
              </View>
            </View>
            <View style={styles.macrosSummary}>
              <View style={styles.macroSummaryItem}>
                <Text style={styles.macroSummaryLabel}>Protein</Text>
                <Text style={styles.macroSummaryValue}>{planTotals.macros.proteinGr}g</Text>
              </View>
              <View style={styles.macroSummaryItem}>
                <Text style={styles.macroSummaryLabel}>Carbs</Text>
                <Text style={styles.macroSummaryValue}>{planTotals.macros.carbsGr}g</Text>
              </View>
              <View style={styles.macroSummaryItem}>
                <Text style={styles.macroSummaryLabel}>Fat</Text>
                <Text style={styles.macroSummaryValue}>{planTotals.macros.fatGr}g</Text>
              </View>
            </View>
          </View>
        )}

        {/* Meals Section */}
        <View style={styles.card}>
          <View style={styles.mealsHeader}>
            <Text style={styles.cardTitle}>Meals</Text>
            <TouchableOpacity style={styles.addMealButton} onPress={handleAddMeal}>
              <Ionicons name="add-circle-outline" size={20} color="#01D38D" />
              <Text style={styles.addMealButtonText}>Add Meal</Text>
            </TouchableOpacity>
          </View>

          {meals.length > 0 ? (
            meals.map((meal) => (
              <MealCard
                key={meal._id}
                meal={meal}
                onUpdateName={(name) => handleMealNameChange(name, meal._id)}
                onRemove={() => handleRemoveMeal(meal._id)}
                onAddFood={() => handleAddFoodItemToMeal(meal._id)}
                onRemoveFood={(foodId) => handleRemoveFoodItemFromMeal(meal._id, foodId)}
              />
            ))
          ) : (
            <View style={styles.emptyMealsState}>
              <Ionicons name="restaurant-outline" size={50} color="#A0A5B1" />
              <Text style={styles.emptyMealsTitle}>No meals added yet</Text>
              <Text style={styles.emptyMealsSubtitle}>Start by adding your first meal</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Save Button */}
      <View style={[styles.saveButtonContainer, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={[styles.saveButton, !planName.trim() && styles.saveButtonDisabled]} 
          onPress={handleSavePlan}
          disabled={isLoading || !planName.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#191E29" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#191E29" />
              <Text style={styles.saveButtonText}>Save Diet Plan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        iconName={alertInfo.iconName}
        iconColor={alertInfo.iconColor}
        onClose={() => setAlertInfo(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 34,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroSection: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  heroSubtitle: {
    color: '#A0A5B1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2D32',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
    marginLeft: 12,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroInputContainer: {
    flex: 1,
  },
  macroInputLabel: {
    color: '#A0A5B1',
    fontSize: 14,
    marginBottom: 8,
  },
  macroInput: {
    backgroundColor: '#2A2D32',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    color: '#A0A5B1',
    fontSize: 12,
    marginTop: 4,
  },
  macrosSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2D32',
    borderRadius: 12,
    paddingVertical: 15,
  },
  macroSummaryItem: {
    alignItems: 'center',
  },
  macroSummaryLabel: {
    color: '#A0A5B1',
    fontSize: 12,
  },
  macroSummaryValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01D38D20',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  addMealButtonText: {
    color: '#01D38D',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyMealsState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMealsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptyMealsSubtitle: {
    color: '#A0A5B1',
    fontSize: 14,
    marginTop: 5,
  },
  mealCard: {
    backgroundColor: '#2A2D32',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#191E29',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#191E29',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeMealButton: {
    padding: 8,
  },
  mealSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#191E29',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  mealCalories: {
    color: '#01D38D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 15,
  },
  mealMacroText: {
    color: '#A0A5B1',
    fontSize: 12,
  },
  foodItemsList: {
    marginBottom: 15,
    gap: 8,
  },
  emptyMealState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMealText: {
    color: '#A0A5B1',
    fontSize: 14,
    marginTop: 10,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191E29',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  addFoodButtonText: {
    color: '#01D38D',
    fontSize: 14,
    fontWeight: '600',
  },
  foodItemCard: {
    backgroundColor: '#191E29',
    borderRadius: 10,
    padding: 12,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  foodItemQuantity: {
    color: '#A0A5B1',
    fontSize: 12,
    marginTop: 2,
  },
  removeFoodButton: {
    padding: 2,
  },
  foodItemNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caloriesText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    color: '#A0A5B1',
    fontSize: 10,
  },
  macroValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButtonContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  saveButton: {
    backgroundColor: '#01D38D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#696E79',
  },
  saveButtonText: {
    color: '#191E29',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManualDietPlannerScreen; 