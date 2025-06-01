import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { useNavigation, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserWorkoutPlans, UserWorkoutPlan } from '../../api/planService';
import { fetchUserDietPlans, DietPlan } from '../../api/dietService';
import { DisplayableWorkoutPlan } from '../Workouts/WorkoutListScreen';
import { MainTabParamList as AppMainTabParamList } from '../../navigation/MainTabNavigator';

// Define more specific navigation types for DashboardScreen
type DashboardTabProp = BottomTabNavigationProp<AppMainTabParamList, 'Dashboard'>;
type RootStackProp = StackNavigationProp<RootStackParamList>;
type DashboardScreenNavigationProp = CompositeNavigationProp<DashboardTabProp, RootStackProp>;

// Helper to get the start of the current week (Monday)
const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const DashboardScreen = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const [recentWorkout, setRecentWorkout] = useState<UserWorkoutPlan | null>(null);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [recentDietPlan, setRecentDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const motivationalTips = useMemo(() => [
    "The only bad workout is the one that didn't happen.",
    "Believe you can and you're halfway there.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "Success isn't always about greatness. It's about consistency. Consistent hard work gains success.",
    "Don't watch the clock; do what it does. Keep going.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Hydration is key! Don't forget your water today.",
    "A little progress each day adds up to big results.",
    "Listen to your body, but don't let it make all the decisions.",
    "Fuel your body with nutritious food. It's your temple."
  ], []);
  const [currentTip, setCurrentTip] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const fetchData = async () => {
    if (!token || !user?._id) {
        setIsLoading(false);
        setIsRefreshing(false);
        setDashboardError("User not authenticated.");
        return;
    }
    setDashboardError(null); // Clear previous errors
    try {
        const [workoutPlansResponse, dietPlansResponse] = await Promise.all([
            fetchUserWorkoutPlans(token, user._id),
            fetchUserDietPlans(token, user._id)
        ]);

        if (workoutPlansResponse.success && workoutPlansResponse.plans) {
            setTotalWorkouts(workoutPlansResponse.plans.length);
            
            // Calculate workouts this week (using createdAt as a proxy for completion for now)
            const today = new Date();
            const startOfWeek = getStartOfWeek(today);
            startOfWeek.setHours(0, 0, 0, 0); // Set to beginning of the day

            let countThisWeek = 0;
            workoutPlansResponse.plans.forEach(plan => {
                const planDate = new Date(plan.createdAt); // Assuming createdAt exists and is a valid date string/object
                if (planDate >= startOfWeek) {
                    countThisWeek++;
                }
            });
            setWorkoutsThisWeek(countThisWeek);

            // Find most recently updated or created plan
            const sortedPlans = [...workoutPlansResponse.plans].sort((a, b) => 
                new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
            );
            if (sortedPlans.length > 0) {
                setRecentWorkout(sortedPlans[0]);
            }
        }

        if (dietPlansResponse.success && dietPlansResponse.plans) {
             const sortedDiets = [...dietPlansResponse.plans].sort((a, b) => 
                new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
            );
            if (sortedDiets.length > 0) {
                setRecentDietPlan(sortedDiets[0]);
            }
        }

        setIsLoading(false);
        setIsRefreshing(false);
        // Set initial tip
        setCurrentTip(motivationalTips[Math.floor(Math.random() * motivationalTips.length)]);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardError(error instanceof Error ? error.message : "Failed to load dashboard data.");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [token, user?._id]) // Removed motivationalTips from deps as it's memoized
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(); // This will also pick a new tip via its finally block
  };
  
  const DashboardCard: React.FC<{ title: string; iconName?: React.ComponentProps<typeof Ionicons>['name']; children: React.ReactNode; onPress?: () => void; cardStyle?: object; titleStyle?: object; contentStyle?: object }> = 
    ({ title, iconName, children, onPress, cardStyle, titleStyle, contentStyle }) => (
    <TouchableOpacity onPress={onPress} style={[styles.card, cardStyle]} disabled={!onPress}>
      <View style={styles.cardHeader}>
        {iconName && <Ionicons name={iconName} size={22} color={styles.cardIcon.color} style={styles.cardIcon} />}
        <Text style={[styles.cardTitle, titleStyle]}>{title}</Text>
      </View>
      <View style={contentStyle}>
        {children}
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) {
    return (
        <SafeAreaView style={[styles.container, styles.centered]}>
            <ActivityIndicator size="large" color="#007AFF" />
        </SafeAreaView>
    );
  }

  if (dashboardError && !isRefreshing) {
    return (
        <SafeAreaView style={[styles.container, styles.centered]}>
            <Ionicons name="cloud-offline-outline" size={60} color="#ccc" />
            <Text style={styles.errorText}>{dashboardError}</Text>
            <Text style={styles.errorSubText}>Pull down to refresh.</Text>
             {/* Optional: A manual refresh button could be added here too */}
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#007AFF"]} tintColor="#007AFF" />}
      >
        <Text style={styles.mainTitle}>{getGreeting()}, {user?.fullName || 'User'}!</Text>
        <Text style={styles.subTitle}>Ready to achieve your fitness goals today?</Text>

        {/* Quick Start Workout Card */}
        <DashboardCard 
            title={recentWorkout ? "Continue Your Last Workout" : "Start a New Workout"}
            iconName={recentWorkout ? "play-circle-outline" : "compass-outline"}
            onPress={() => {
                if (recentWorkout) {
                    const displayablePlan: DisplayableWorkoutPlan = {
                        _id: recentWorkout._id,
                        planName: recentWorkout.planName,
                        exercises: recentWorkout.exercises,
                        createdAt: recentWorkout.createdAt,
                        updatedAt: recentWorkout.updatedAt,
                        description: (recentWorkout as any).description,
                        type: (recentWorkout as any).type,
                        difficulty: (recentWorkout as any).difficulty,
                        durationEstimateMinutes: (recentWorkout as any).durationEstimateMinutes,
                        isAIGenerated: recentWorkout.isAIgenerated,
                    };
                    navigation.navigate('Workouts', { 
                        screen: 'WorkoutDetail', 
                        params: { planObject: displayablePlan }, 
                    } as any);
                } else {
                    navigation.navigate('Workouts', {
                        screen: 'WorkoutList' 
                    } as any);
                }
            }}
            cardStyle={styles.highlightCard}
            titleStyle={styles.highlightCardTitle}
        >
            {recentWorkout ? (
                <>
                    <Text style={styles.highlightCardText}>{recentWorkout.planName}</Text>
                    <Text style={styles.highlightCardSubText}>{recentWorkout.exercises.length} exercises</Text>
                </>
            ) : (
                <Text style={styles.highlightCardText}>Explore featured workouts or your custom plans.</Text>
            )}
            <View style={styles.arrowContainer}>
                 <Ionicons name="arrow-forward-outline" size={24} color="#FFFFFF" />
            </View>
        </DashboardCard>

        {/* Stats Card */}
        <DashboardCard title="Your Progress" iconName="stats-chart-outline" onPress={() => navigation.navigate('Progress')}>
          <View style={styles.statItem}>
            <Ionicons name="barbell-outline" size={20} color="#4CAF50" />
            <Text style={styles.statText}>Total Workout Plans: {totalWorkouts}</Text>
          </View>
          {/* Add more stats here when available, e.g., workouts this week */}
           <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={20} color="#FF9800" />
            <Text style={styles.statText}>Workouts This Week: {workoutsThisWeek}</Text>
          </View>
        </DashboardCard>

        {/* Diet Plan Card */}
        <DashboardCard 
            title={recentDietPlan ? "Your Current Diet Plan" : "Explore Diet Plans"} 
            iconName="restaurant-outline" 
            onPress={() => navigation.navigate('Diet')}
        >
            {recentDietPlan ? (
                <View>
                    <Text style={styles.cardTextBold}>{recentDietPlan.planName}</Text>
                    {recentDietPlan.dailyCaloricTarget && (
                        <Text style={styles.cardTextDetail}>Target: {recentDietPlan.dailyCaloricTarget} kcal</Text>
                    )}
                    {recentDietPlan.macronutrientTargets && (
                        <Text style={styles.cardTextDetail}>
                            Macros (P/C/F): {recentDietPlan.macronutrientTargets.proteinGr}g / {recentDietPlan.macronutrientTargets.carbsGr}g / {recentDietPlan.macronutrientTargets.fatGr}g
                        </Text>
                    )}
                    {!recentDietPlan.dailyCaloricTarget && !recentDietPlan.macronutrientTargets && (
                        <Text style={styles.cardText}>View details and meals in the Diet tab.</Text>
                    )}
                </View>
            ) : (
                <Text style={styles.cardText}>Find or create a diet plan to match your goals.</Text>
            )}
        </DashboardCard>

        {/* Tip of the Day Card */}
        <DashboardCard title="Fuel Your Fire" iconName="bulb-outline" contentStyle={styles.tipCardContent}>
            <Ionicons name="sparkles-outline" size={24} color="#FFC107" style={styles.tipIcon}/>
            <Text style={styles.tipText}>{currentTip}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshTipButton}>
                 <Ionicons name="refresh-outline" size={18} color="#007AFF" />
                 <Text style={styles.refreshTipText}>New Tip</Text>
            </TouchableOpacity>
        </DashboardCard>
        
        {/* Quick Actions Section */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('CreatePlan')}>
                <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
                <Text style={styles.quickActionText}>Create Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Workouts', { screen: 'WorkoutList'} as any)}>
                <Ionicons name="list-outline" size={28} color="#007AFF" />
                <Text style={styles.quickActionText}>All Workouts</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Workouts', { screen: 'ExerciseLibrary' } as any)}>
                <Ionicons name="walk-outline" size={28} color="#007AFF" />
                <Text style={styles.quickActionText}>Exercises</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  highlightCard: {
    backgroundColor: '#007AFF', // Primary color for standout card
  },
  highlightCardTitle: {
    color: '#FFFFFF',
  },
  highlightCardText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  highlightCardSubText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 10,
  },
  arrowContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{translateY: -12}]
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    marginRight: 10,
    color: '#007AFF', // Default icon color
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  cardText: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
  },
  cardTextBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cardTextDetail: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  statText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 15,
    marginBottom: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    minWidth: 90, // Ensure buttons have some width
  },
  quickActionText: {
    marginTop: 5,
    fontSize: 13,
    color: '#007AFF',
    fontWeight:'500'
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  errorSubText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  tipCardContent: {
    alignItems: 'center',
  },
  tipIcon: {
    marginBottom: 10,
  },
  tipText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 23,
    marginBottom: 15,
  },
  refreshTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20, // Make it pill-shaped
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  refreshTipText: {
    marginLeft: 5,
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  }
});

export default DashboardScreen; 