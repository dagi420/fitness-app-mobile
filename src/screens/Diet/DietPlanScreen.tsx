import React, { useEffect, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  ScrollView, // For potentially detailed view
  RefreshControl,
  Button, // Added Button for header
  Alert
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack'; // For typing navigation
import { RootStackParamList, MainTabParamList, AIPlanConfigData } from '../../navigation/types'; // For typing navigation, MainTabParamList for route type
import { DietPlan, Meal, FoodItem, fetchUserDietPlans, Macronutrients, generateAIDietPlan } from '../../api/dietService'; // Import DietPlan related types and fetch function

// --- Helper Functions for Calculations ---
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

const calculatePlanTotals = (plan: DietPlan): { calories: number; macros: Macronutrients } => {
  let totalCalories = 0;
  let totalMacros: Macronutrients = { proteinGr: 0, carbsGr: 0, fatGr: 0 };

  plan.meals.forEach(meal => {
    const mealTotals = calculateMealTotals(meal);
    totalCalories += mealTotals.calories;
    totalMacros.proteinGr += mealTotals.macros.proteinGr;
    totalMacros.carbsGr += mealTotals.macros.carbsGr;
    totalMacros.fatGr += mealTotals.macros.fatGr;
  });

  return { calories: totalCalories, macros: totalMacros };
};

// Component to render a single Food Item detail
const FoodItemCard: React.FC<{ item: FoodItem }> = ({ item }) => (
  <View style={styles.foodItemCard}>
    <Text style={styles.foodItemName}>{item.foodName} ({item.quantity})</Text>
    <Text style={styles.foodItemDetail}>Calories: {item.calories} kcal</Text>
    <Text style={styles.foodItemDetail}>
      P: {item.macronutrients.proteinGr}g | C: {item.macronutrients.carbsGr}g | F: {item.macronutrients.fatGr}g
    </Text>
  </View>
);

// Component to render a single Meal
const MealCard: React.FC<{ meal: Meal }> = ({ meal }) => {
  // Calculate meal totals using useMemo to avoid recalculating on every render unless meal changes
  const mealTotals = useMemo(() => calculateMealTotals(meal), [meal]);

  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealName}>{meal.mealName} {meal.timeSuggestion ? `(${meal.timeSuggestion})` : ''}</Text>
        <Text style={styles.mealTotalsText}>
            {mealTotals.calories} kcal (P:{mealTotals.macros.proteinGr}g C:{mealTotals.macros.carbsGr}g F:{mealTotals.macros.fatGr}g)
        </Text>
      </View>
      {meal.foodItems.map(food => <FoodItemCard key={food._id} item={food} />)}
    </View>
  );
};

// Component to render a single Diet Plan (can be expanded)
const DietPlanItem: React.FC<{ plan: DietPlan; onPress: () => void; isExpanded: boolean }> = ({ plan, onPress, isExpanded }) => {
  // Calculate plan totals using useMemo
  const planTotals = useMemo(() => calculatePlanTotals(plan), [plan]);

  return (
    <TouchableOpacity style={styles.planItemContainer} onPress={onPress}>
      <Text style={styles.planName}>{plan.planName}</Text>
      {plan.description && <Text style={styles.planDescription}>{plan.description}</Text>}
      
      <View style={styles.planMetaRow}>
        {plan.dailyCaloricTarget && 
          <Text style={styles.planMeta}>Target: {plan.dailyCaloricTarget} kcal</Text>}
        <Text style={styles.planMeta}>Actual: {planTotals.calories} kcal</Text>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.macrosSummaryContainer}>
            <Text style={styles.macrosTitle}>Daily Macronutrients:</Text>
            <View style={styles.macrosRow}>
                <Text style={styles.macrosLabel}>Target:</Text>
                {plan.macronutrientTargets ? (
                    <Text style={styles.macrosText}>
                        P: {plan.macronutrientTargets.proteinGr}g | C: {plan.macronutrientTargets.carbsGr}g | F: {plan.macronutrientTargets.fatGr}g
                    </Text>
                ) : <Text style={styles.macrosText}>Not set</Text>}
            </View>
            <View style={styles.macrosRow}>
                <Text style={styles.macrosLabel}>Actual:</Text>
                <Text style={styles.macrosText}>
                    P: {planTotals.macros.proteinGr}g | C: {planTotals.macros.carbsGr}g | F: {planTotals.macros.fatGr}g
                </Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Meals:</Text>
          {plan.meals.map(meal => <MealCard key={meal._id} meal={meal} />)}
        </View>
      )}
    </TouchableOpacity>
  );
};

const DietPlanScreen = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Diet'> & { params?: { refresh?: boolean } }>(); // Type route and params
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false); // New state for AI generation loading

  const loadDietPlans = useCallback(async (refresh = false) => {
    if (!user?._id || !token) {
      setError("User not authenticated.");
      setIsLoading(false);
      if(refresh) setIsRefreshing(false);
      return;
    }
    if (!refresh) setIsLoading(true);
    setError(null);

    try {
      const response = await fetchUserDietPlans(token, user._id);
      if (response.success && response.plans) {
        setDietPlans(response.plans);
      } else {
        setError(response.message || 'Failed to load diet plans.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching diet plans.');
    } finally {
      if (!refresh) setIsLoading(false);
      if(refresh) setIsRefreshing(false);
    }
  }, [token, user?._id]);

  useFocusEffect(
    useCallback(() => {
      loadDietPlans();
    }, [loadDietPlans])
  );
  
  // Add a useEffect to specifically handle the refresh parameter
  useEffect(() => {
    if (route.params?.refresh) {
      console.log("[DietPlanScreen] Refresh param detected, reloading plans.");
      loadDietPlans(true); // Pass true to indicate it's a refresh for loading state logic
      // Reset the refresh param to prevent re-loading on subsequent focus without a new refresh trigger
      (navigation as any).setParams({ refresh: false }); 
    }
  }, [route.params?.refresh, loadDietPlans, navigation]);
  
  const onRefresh = () => {
    setIsRefreshing(true);
    loadDietPlans(true);
  }

  const toggleExpandPlan = (planId: string) => {
    setExpandedPlanId(currentId => (currentId === planId ? null : planId));
  };

  // Add button to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtonContainer}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ManualDietPlanner')} 
            style={styles.headerButton}
            disabled={isGeneratingPlan} // Disable while AI is working
          >
            <Text style={styles.headerButtonText}>Create Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('AIConfigurationScreen', { 
              onSubmit: (submittedConfig) => handleAIGeneratePlan(submittedConfig)
            })} 
            style={[styles.headerButton, styles.aiButton]}
            disabled={isGeneratingPlan} // Disable while AI is working
          >
            <Text style={styles.headerButtonText}>{isGeneratingPlan ? "Generating..." : "✨ AI Generate"}</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isGeneratingPlan]); // Added isGeneratingPlan to dependencies

  const handleAIGeneratePlan = async (config?: AIPlanConfigData) => {
    if (!config) {
      // If no config, navigate to the configuration screen
      navigation.navigate('AIConfigurationScreen', { 
        onSubmit: (submittedConfig) => handleAIGeneratePlan(submittedConfig) // Pass this function as callback
      });
      return;
    }

    // Config received, proceed with API call
    if (!token || !user?._id) { 
      Alert.alert("Error", "User information not found. Please log in again.");
      return;
    }
    setIsGeneratingPlan(true);
    setError(null); 

    console.log("AI Plan Configuration:", config);

    try {
      const result = await generateAIDietPlan(token, config);
      if (result.success && result.plan) {
        Alert.alert("Success!", "A new diet plan has been generated for you by AI based on your preferences.");
        loadDietPlans(true); // Refresh the list to show the new plan
      } else {
        Alert.alert("AI Plan Generation Failed", result.message || "Could not generate an AI diet plan. Please try again.");
      }
    } catch (err) {
      console.error("handleAIGeneratePlan error:", err);
      Alert.alert("Error", err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (isLoading && !isGeneratingPlan) { // Ensure main loading doesn't show if only AI is loading
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" /></SafeAreaView>;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => loadDietPlans()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (dietPlans.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>No diet plans found for you yet.</Text>
        <Text style={styles.infoText}>Check back later or contact support if you expect a plan.</Text>
         <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={dietPlans}
        renderItem={({ item }) => (
          <DietPlanItem 
            plan={item} 
            onPress={() => toggleExpandPlan(item._id)} 
            isExpanded={expandedPlanId === item._id} 
          />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.mainTitle}>Your Diet Plans</Text>}
        refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
    marginLeft: 10,
  },
  planItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  planMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  planMeta: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
  },
  expandedContent: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  macrosSummaryContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f8ff', // Light blue background for macros summary
    borderRadius: 6,
  },
  macrosTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 5,
    color: '#31708f',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  macrosLabel: {
    fontSize: 13,
    color: '#31708f',
    fontWeight: '500',
  },
  macrosText: {
    fontSize: 13,
    color: '#31708f',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 8,
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mealTotalsText: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
  foodItemCard: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eef',
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0056b3',
  },
  foodItemDetail: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  infoText: {
      fontSize: 14,
      color: '#777',
      textAlign: 'center',
      marginTop: 5,
      marginBottom: 15,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerButtonContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 8, // Spacing between buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 15, // Adjusted font size slightly
    fontWeight: '500',
  },
  aiButton: {
    backgroundColor: '#e0f7fa', // A slightly different background for AI button
    borderColor: '#007AFF', // Optional: border to match text
    borderWidth: 1, // Optional
  },
});

export default DietPlanScreen; 