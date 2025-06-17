import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList, AIPlanConfigData } from '../../navigation/types';
import { DietPlan, Meal, FoodItem, fetchUserDietPlans, Macronutrients, generateAIDietPlan } from '../../api/dietService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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

// Modern Food Item Card Component
const FoodItemCard: React.FC<{ item: FoodItem }> = ({ item }) => (
  <View style={styles.foodItemCard}>
    <View style={styles.foodItemHeader}>
      <Text style={styles.foodItemName}>{item.foodName}</Text>
      <Text style={styles.foodItemQuantity}>{item.quantity}</Text>
    </View>
    <View style={styles.foodItemNutrition}>
      <View style={styles.caloriesContainer}>
        <Ionicons name="flame-outline" size={16} color="#FF6B6B" />
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

// Modern Meal Card Component
const MealCard: React.FC<{ meal: Meal; isExpanded: boolean; onToggle: () => void }> = ({ 
  meal, 
  isExpanded, 
  onToggle 
}) => {
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
      <TouchableOpacity onPress={onToggle} style={styles.mealHeader}>
        <View style={styles.mealHeaderLeft}>
          <View style={styles.mealIconContainer}>
            <Ionicons name={getMealIcon(meal.mealName)} size={20} color="#01D38D" />
          </View>
          <View>
            <Text style={styles.mealName}>{meal.mealName}</Text>
            {meal.timeSuggestion && (
              <Text style={styles.mealTime}>{meal.timeSuggestion}</Text>
            )}
          </View>
        </View>
        <View style={styles.mealHeaderRight}>
          <Text style={styles.mealCalories}>{mealTotals.calories} kcal</Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#A0A5B1" 
          />
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.mealContent}>
          <View style={styles.mealMacrosSummary}>
            <View style={styles.macroSummaryItem}>
              <Text style={styles.macroSummaryLabel}>Protein</Text>
              <Text style={styles.macroSummaryValue}>{mealTotals.macros.proteinGr}g</Text>
            </View>
            <View style={styles.macroSummaryItem}>
              <Text style={styles.macroSummaryLabel}>Carbs</Text>
              <Text style={styles.macroSummaryValue}>{mealTotals.macros.carbsGr}g</Text>
            </View>
            <View style={styles.macroSummaryItem}>
              <Text style={styles.macroSummaryLabel}>Fat</Text>
              <Text style={styles.macroSummaryValue}>{mealTotals.macros.fatGr}g</Text>
            </View>
          </View>
          <View style={styles.foodItemsList}>
            {meal.foodItems.map(food => (
              <FoodItemCard key={food._id} item={food} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Modern Diet Plan Card Component
const DietPlanCard: React.FC<{ 
  plan: DietPlan; 
  onPress: () => void; 
  isExpanded: boolean;
  expandedMealId: string | null;
  onMealToggle: (mealId: string) => void;
}> = ({ plan, onPress, isExpanded, expandedMealId, onMealToggle }) => {
  const planTotals = useMemo(() => calculatePlanTotals(plan), [plan]);

  const calorieProgress = plan.dailyCaloricTarget 
    ? (planTotals.calories / plan.dailyCaloricTarget) * 100 
    : 0;

  return (
    <View style={styles.planCard}>
      <TouchableOpacity onPress={onPress} style={styles.planHeader}>
        <View style={styles.planHeaderContent}>
          <View style={styles.planTitleContainer}>
            <Text style={styles.planName}>{plan.planName}</Text>
            {plan.isAIGenerated && (
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={12} color="#01D38D" />
                <Text style={styles.aiTagText}>AI</Text>
              </View>
            )}
          </View>
          {plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}
          
          <View style={styles.planMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{planTotals.calories}</Text>
              <Text style={styles.metricLabel}>kcal total</Text>
            </View>
            {plan.dailyCaloricTarget && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{plan.dailyCaloricTarget}</Text>
                <Text style={styles.metricLabel}>kcal target</Text>
              </View>
            )}
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{plan.meals.length}</Text>
              <Text style={styles.metricLabel}>meals</Text>
            </View>
          </View>

          {plan.dailyCaloricTarget && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(calorieProgress, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(calorieProgress)}% of daily goal
              </Text>
            </View>
          )}
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#A0A5B1" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.planExpandedContent}>
          {plan.macronutrientTargets && (
            <View style={styles.macroTargetsSection}>
              <Text style={styles.sectionTitle}>Daily Macro Targets</Text>
              <View style={styles.macroTargetsGrid}>
                <View style={styles.macroTargetItem}>
                  <Text style={styles.macroTargetLabel}>Protein</Text>
                  <Text style={styles.macroTargetValue}>
                    {planTotals.macros.proteinGr}g / {plan.macronutrientTargets.proteinGr}g
                  </Text>
                  <View style={styles.macroProgressBar}>
                    <View 
                      style={[
                        styles.macroProgressFill,
                        { 
                          width: `${Math.min((planTotals.macros.proteinGr / plan.macronutrientTargets.proteinGr) * 100, 100)}%`,
                          backgroundColor: '#FF6B6B'
                        }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.macroTargetItem}>
                  <Text style={styles.macroTargetLabel}>Carbs</Text>
                  <Text style={styles.macroTargetValue}>
                    {planTotals.macros.carbsGr}g / {plan.macronutrientTargets.carbsGr}g
                  </Text>
                  <View style={styles.macroProgressBar}>
                    <View 
                      style={[
                        styles.macroProgressFill,
                        { 
                          width: `${Math.min((planTotals.macros.carbsGr / plan.macronutrientTargets.carbsGr) * 100, 100)}%`,
                          backgroundColor: '#4ECDC4'
                        }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.macroTargetItem}>
                  <Text style={styles.macroTargetLabel}>Fat</Text>
                  <Text style={styles.macroTargetValue}>
                    {planTotals.macros.fatGr}g / {plan.macronutrientTargets.fatGr}g
                  </Text>
                  <View style={styles.macroProgressBar}>
                    <View 
                      style={[
                        styles.macroProgressFill,
                        { 
                          width: `${Math.min((planTotals.macros.fatGr / plan.macronutrientTargets.fatGr) * 100, 100)}%`,
                          backgroundColor: '#FFB74D'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.mealsSection}>
            <Text style={styles.sectionTitle}>Meals</Text>
            {plan.meals.map(meal => (
              <MealCard 
                key={meal._id} 
                meal={meal} 
                isExpanded={expandedMealId === meal._id}
                onToggle={() => onMealToggle(meal._id)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const DietPlanScreen = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Diet'> & { params?: { refresh?: boolean } }>();
  const insets = useSafeAreaInsets();
  
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
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
  
  useEffect(() => {
    if (route.params?.refresh) {
      loadDietPlans(true);
      (navigation as any).setParams({ refresh: false }); 
    }
  }, [route.params?.refresh, loadDietPlans, navigation]);
  
  const onRefresh = () => {
    setIsRefreshing(true);
    loadDietPlans(true);
  };

  const toggleExpandPlan = (planId: string) => {
    setExpandedPlanId(currentId => (currentId === planId ? null : planId));
    setExpandedMealId(null); // Reset expanded meal when changing plans
  };

  const toggleExpandMeal = (mealId: string) => {
    setExpandedMealId(currentId => (currentId === mealId ? null : mealId));
  };

  const handleAIGeneratePlan = async (config?: AIPlanConfigData) => {
    if (!token || isGeneratingPlan) return;
    
    setIsGeneratingPlan(true);
    try {
      const defaultConfig: AIPlanConfigData = {
        goal: 'general_fitness',
        foodPreferences: '',
        supplements: '',
        otherNotes: ''
      };
      
      const response = await generateAIDietPlan(token, config || defaultConfig);
      if (response.success && response.plan) {
        showAlert(
          'Success!',
          'Your AI diet plan has been generated successfully!',
          [{ text: 'Great!', onPress: () => loadDietPlans(true) }],
          'checkmark-circle-outline',
          '#01D38D'
        );
      } else {
        showAlert(
          'Generation Failed',
          response.message || 'Failed to generate AI diet plan. Please try again.',
          [{ text: 'OK', onPress: () => {} }],
          'alert-circle-outline',
          '#FF6B6B'
        );
      }
    } catch (error) {
      showAlert(
        'Error',
        'An unexpected error occurred while generating your diet plan.',
        [{ text: 'OK', onPress: () => {} }],
        'alert-circle-outline',
        '#FF6B6B'
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const QuickActionCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onPress, 
    disabled = false 
  }: { 
    title: string; 
    description: string;
    icon: any; 
    color: string; 
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.quickActionCard, disabled && styles.disabledCard]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        {disabled ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name={icon} size={24} color="#FFFFFF" />
        )}
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDescription}>{description}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#01D38D" />
        <Text style={styles.loadingText}>Loading your diet plans...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadDietPlans()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {dietPlans.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <ImageBackground
            source={{ 
              uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?fit=crop&w=1200&q=80' 
            }}
            style={styles.emptyStateImage}
            imageStyle={{ borderRadius: 20 }}
          >
            <LinearGradient
              colors={['rgba(25, 30, 41, 0.7)', 'rgba(25, 30, 41, 0.9)']}
              style={styles.emptyStateOverlay}
            >
              <Ionicons name="restaurant-outline" size={80} color="#01D38D" />
              <Text style={styles.emptyStateTitle}>Start Your Nutrition Journey</Text>
              <Text style={styles.emptyStateSubtitle}>
                Create personalized diet plans to reach your fitness goals
              </Text>
            </LinearGradient>
          </ImageBackground>
          
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Get Started</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                title="AI Plan"
                description="Let AI create a plan for you"
                icon="sparkles"
                color="#FF6B6B"
                onPress={() => navigation.navigate('AIConfigurationScreen', { 
                  onSubmit: (config) => handleAIGeneratePlan(config)
                })}
                disabled={isGeneratingPlan}
              />
              <QuickActionCard
                title="Manual Plan"
                description="Create your own custom plan"
                icon="create"
                color="#4ECDC4"
                onPress={() => navigation.navigate('ManualDietPlanner')}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={dietPlans}
          renderItem={({ item }) => (
            <DietPlanCard 
              plan={item}
              onPress={() => toggleExpandPlan(item._id)}
              isExpanded={expandedPlanId === item._id}
              expandedMealId={expandedMealId}
              onMealToggle={toggleExpandMeal}
            />
          )}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {dietPlans.length > 0 && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => navigation.navigate('AIConfigurationScreen', { 
              onSubmit: (config) => handleAIGeneratePlan(config)
            })}
            disabled={isGeneratingPlan}
          >
            {isGeneratingPlan ? (
              <ActivityIndicator color="#191E29" size="small" />
            ) : (
              <Ionicons name="sparkles" size={24} color="#191E29" />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.fab, styles.secondaryFab]}
            onPress={() => navigation.navigate('ManualDietPlanner')}
          >
            <Ionicons name="add" size={24} color="#191E29" />
          </TouchableOpacity>
        </View>
      )}

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#191E29',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#A0A5B1',
    fontSize: 16,
    marginTop: 15,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#A0A5B1',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#01D38D',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#191E29',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyStateImage: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyStateOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyStateSubtitle: {
    color: '#A0A5B1',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  disabledCard: {
    opacity: 0.6,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  quickActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  quickActionDescription: {
    color: '#A0A5B1',
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  planCard: {
    backgroundColor: '#1E2328',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  planHeaderContent: {
    flex: 1,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01D38D20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  aiTagText: {
    color: '#01D38D',
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    color: '#A0A5B1',
    fontSize: 14,
    marginBottom: 15,
  },
  planMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#A0A5B1',
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2A2D32',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#01D38D',
    borderRadius: 3,
  },
  progressText: {
    color: '#A0A5B1',
    fontSize: 12,
    marginTop: 5,
  },
  planExpandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  macroTargetsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  macroTargetsGrid: {
    gap: 12,
  },
  macroTargetItem: {
    backgroundColor: '#2A2D32',
    padding: 15,
    borderRadius: 12,
  },
  macroTargetLabel: {
    color: '#A0A5B1',
    fontSize: 14,
    marginBottom: 5,
  },
  macroTargetValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  macroProgressBar: {
    height: 4,
    backgroundColor: '#191E29',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  mealsSection: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#2A2D32',
    borderRadius: 15,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
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
  mealName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mealTime: {
    color: '#A0A5B1',
    fontSize: 12,
    marginTop: 2,
  },
  mealHeaderRight: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    color: '#01D38D',
    fontSize: 14,
    fontWeight: '600',
  },
  mealContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  mealMacrosSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#191E29',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
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
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  foodItemsList: {
    gap: 8,
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
  foodItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  foodItemQuantity: {
    color: '#A0A5B1',
    fontSize: 12,
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
  fabContainer: {
    position: 'absolute',
    right: 20,
    flexDirection: 'column',
    gap: 15,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#01D38D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryFab: {
    backgroundColor: '#FF6B6B',
  },
});

export default DietPlanScreen; 