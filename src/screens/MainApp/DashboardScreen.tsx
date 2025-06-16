import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { useNavigation, CompositeNavigationProp, useFocusEffect, RouteProp, TabActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList, WorkoutsStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserWorkoutPlans, UserWorkoutPlan } from '../../api/planService';
import { fetchUserDietPlans, DietPlan } from '../../api/dietService';
import { DisplayableWorkoutPlan } from '../Workouts/WorkoutListScreen';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Neumorphic components
import { useAppTheme } from '../../styles/useAppTheme';
import NeumorphicView from '../../components/common/NeumorphicView';
import AppText from '../../components/common/AppText';
import NeumorphicButton from '../../components/common/NeumorphicButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define more specific navigation types for DashboardScreen
type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;

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
  const theme = useAppTheme();
  const themedStyles = createDashboardStyles(theme);

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

  const [streakCount, setStreakCount] = useState(0);
  const [nextWorkout, setNextWorkout] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailySteps, setDailySteps] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

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
    setDashboardError(null);
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

        setCurrentTip(motivationalTips[Math.floor(Math.random() * motivationalTips.length)]);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardError(error instanceof Error ? error.message : "Failed to load dashboard data.");
    } finally {
        setIsLoading(false);
        setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [token, user?._id, motivationalTips])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // New function to handle water intake tracking
  const handleWaterIntake = () => {
    setWaterIntake(prev => Math.min(prev + 250, 3000)); // Add 250ml, max 3L
  };

  // Calculate progress percentage for circular gauge
  const calculateDailyProgress = () => {
    // Example calculation based on steps, workouts, and water intake
    const stepsGoal = 10000;
    const waterGoal = 3000;
    const stepsProgress = Math.min(dailySteps / stepsGoal, 1);
    const waterProgress = Math.min(waterIntake / waterGoal, 1);
    const workoutProgress = workoutsThisWeek > 0 ? 1 : 0;
    
    return Math.round(((stepsProgress + waterProgress + workoutProgress) / 3) * 100);
  };

  if (isLoading && !isRefreshing) {
    return (
        <SafeAreaView style={[themedStyles.container, themedStyles.centered]}>
            <ActivityIndicator size="large" color={theme.currentColors.primary} />
        </SafeAreaView>
    );
  }

  if (dashboardError && !isRefreshing) {
    return (
        <SafeAreaView style={[themedStyles.container, themedStyles.centered]}>
            <Ionicons name="cloud-offline-outline" size={60} color={theme.currentColors.textSecondary} />
            <AppText variant="h3" style={themedStyles.errorText}>{dashboardError}</AppText>
            <AppText color="textSecondary" style={themedStyles.errorSubText}>Pull down to refresh or try again later.</AppText>
            <NeumorphicButton title="Try Again" onPress={fetchData} containerStyle={{marginTop: theme.spacing.lg}} buttonType="primary"/>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themedStyles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.currentColors.primary]} />}
      >
        {/* Enhanced Header with Gradient Background */}
        <LinearGradient
          colors={[theme.currentColors.primary + '20', theme.currentColors.background]}
          style={themedStyles.headerGradient}
        >
          <View style={themedStyles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={themedStyles.avatarContainer}>
              <NeumorphicView type="pressedIn" style={themedStyles.avatarWrapper}>
                <Ionicons name="person-circle-outline" size={44} color={theme.currentColors.primary} />
              </NeumorphicView>
            </TouchableOpacity>
            <View style={themedStyles.greetingContainer}>
              <Animated.View entering={FadeInDown.delay(200)}>
                <AppText variant="h2" fontWeight="bold">Hello, {user?.fullName?.split(' ')[0] || 'User'}!</AppText>
                <AppText variant="body2" color="textSecondary">Let's make today count.</AppText>
              </Animated.View>
            </View>
            <NeumorphicButton 
              iconName="notifications-outline" 
              neumorphicType="flat" 
              neumorphicSize="small"
              containerStyle={themedStyles.headerIcon}
              iconSize={26}
              onPress={() => {/* TODO: Notification action */}}
            />
          </View>
        </LinearGradient>

        {/* Enhanced Progress Circle */}
        <Animated.View entering={FadeInDown.delay(400)} style={themedStyles.gaugePlaceholderOuter}>
          <NeumorphicView 
            type="flat"
            style={themedStyles.circularGaugePlaceholder}
          >
            <View style={themedStyles.progressCircleContent}>
              <Ionicons name="trophy-outline" size={60} color={theme.currentColors.accent} />
              <AppText variant="h2" color="accent" style={themedStyles.progressPercentage}>
                {calculateDailyProgress()}%
              </AppText>
              <AppText variant="body2" color="textSecondary" style={themedStyles.progressLabel}>
                Daily Goal Progress
              </AppText>
            </View>
          </NeumorphicView>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(600)} style={themedStyles.statsGrid}>
          <View style={themedStyles.statsRow}>
            <NeumorphicView type="pressedIn" style={themedStyles.statCard}>
              <Ionicons name="footsteps-outline" size={24} color={theme.currentColors.primary} />
              <AppText variant="h3">{dailySteps.toLocaleString()}</AppText>
              <AppText variant="caption" color="textSecondary">Steps</AppText>
            </NeumorphicView>
            <NeumorphicView type="pressedIn" style={themedStyles.statCard}>
              <Ionicons name="flame-outline" size={24} color={theme.currentColors.accentSecondary} />
              <AppText variant="h3">{caloriesBurned}</AppText>
              <AppText variant="caption" color="textSecondary">Calories</AppText>
            </NeumorphicView>
          </View>
          <View style={themedStyles.statsRow}>
            <NeumorphicView type="pressedIn" style={themedStyles.statCard}>
              <Ionicons name="water-outline" size={24} color={theme.currentColors.accent} />
              <AppText variant="h3">{(waterIntake / 1000).toFixed(1)}L</AppText>
              <AppText variant="caption" color="textSecondary">Water</AppText>
            </NeumorphicView>
            <NeumorphicView type="pressedIn" style={themedStyles.statCard}>
              <Ionicons name="calendar-outline" size={24} color={theme.currentColors.secondary} />
              <AppText variant="h3">{streakCount}</AppText>
              <AppText variant="caption" color="textSecondary">Day Streak</AppText>
            </NeumorphicView>
          </View>
        </Animated.View>

        {/* Quick Actions with Enhanced Design */}
        <Animated.View entering={FadeInDown.delay(800)} style={themedStyles.quickActionsContainer}>
          <AppText variant="h3" style={themedStyles.sectionTitle}>Quick Actions</AppText>
          <View style={themedStyles.quickActionsGrid}>
            {[
              {
                id: 'startWorkout',
                icon: recentWorkout ? "play-circle-outline" : "walk-outline",
                label: recentWorkout ? "Continue Workout" : "Start Workout",
                color: theme.currentColors.primary,
                onPress: () => {
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
                      params: { workout: displayablePlan }, 
                    });
                  } else {
                    navigation.navigate('Workouts', {
                      screen: 'WorkoutList',
                    });
                  }
                }
              },
              {
                id: 'newPlan',
                icon: "add-circle-outline",
                label: "New Plan",
                color: theme.currentColors.secondary,
                onPress: () => navigation.navigate('CreatePlan')
              },
              {
                id: 'diet',
                icon: "restaurant-outline",
                label: "My Diet",
                color: theme.currentColors.accent,
                onPress: () => navigation.dispatch(TabActions.jumpTo('Diet'))
              },
              {
                id: 'progress',
                icon: "checkmark-done-outline",
                label: "Log Progress",
                color: theme.currentColors.accentSecondary,
                onPress: () => navigation.dispatch(TabActions.jumpTo('Progress'))
              }
            ].map((action) => (
              <TouchableOpacity
                key={action.id}
                style={themedStyles.quickActionButton}
                onPress={action.onPress}
              >
                <NeumorphicView type="raised" style={themedStyles.quickActionButtonInner}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                  <AppText variant="caption" style={[themedStyles.quickActionLabel, { color: action.color }]}>
                    {action.label}
                  </AppText>
                </NeumorphicView>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Enhanced Info Cards */}
        <Animated.View entering={FadeInDown.delay(1000)} style={themedStyles.infoCardsContainer}>
          <AppText variant="h3" style={themedStyles.sectionTitle}>Today's Overview</AppText>
          <View style={themedStyles.infoCardsGrid}>
            {[
              {
                id: 'totalWorkouts',
                icon: 'barbell-outline',
                title: 'Total Plans',
                data: `${totalWorkouts}`,
                color: theme.currentColors.primary,
                onPress: () => navigation.dispatch(TabActions.jumpTo('Workouts')),
              },
              {
                id: 'workoutsThisWeek',
                icon: 'flame-outline',
                title: 'This Week',
                data: `${workoutsThisWeek} Done`,
                color: theme.currentColors.accentSecondary,
                onPress: () => navigation.dispatch(TabActions.jumpTo('Progress')),
              },
              {
                id: 'currentDiet',
                icon: 'fast-food-outline',
                title: 'Current Diet',
                data: recentDietPlan?.planName || 'Not Set',
                color: theme.currentColors.accent,
                onPress: () => navigation.dispatch(TabActions.jumpTo('Diet')),
              },
              {
                id: 'nextWorkout',
                icon: 'calendar-outline',
                title: 'Next Workout',
                data: nextWorkout || 'Not Scheduled',
                color: theme.currentColors.secondary,
                onPress: () => navigation.dispatch(TabActions.jumpTo('Workouts')),
              }
            ].map((card) => (
              <TouchableOpacity 
                key={card.id} 
                style={themedStyles.infoCard} 
                onPress={card.onPress}
              >
                <NeumorphicView type="raised" style={themedStyles.infoCardInner}>
                  <Ionicons name={card.icon as any} size={26} color={card.color} style={themedStyles.infoCardIcon} />
                  <View style={themedStyles.infoCardContent}>
                    <AppText variant="label" fontWeight="semibold" style={{ color: card.color }}>{card.title}</AppText>
                    <AppText variant="caption" color="textSecondary" numberOfLines={2}>{card.data}</AppText>
                  </View>
                </NeumorphicView>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Enhanced Motivational Tip Card */}
        <Animated.View 
          entering={FadeInDown.delay(1200)}
          style={themedStyles.tipCardContainer}
        >
          <TouchableOpacity
            onPress={() => setCurrentTip(motivationalTips[Math.floor(Math.random() * motivationalTips.length)])}
            activeOpacity={0.8}
          >
            <NeumorphicView type="raised" style={themedStyles.tipCard}>
              <LinearGradient
                colors={[theme.currentColors.primary + '20', theme.currentColors.background]}
                style={themedStyles.tipCardGradient}
              >
                <View style={themedStyles.tipCardContent}>
                  <Ionicons name="bulb-outline" size={28} color={theme.currentColors.secondary} />
                  <View style={themedStyles.tipTextContainer}>
                    <AppText variant="label" fontWeight="semibold" style={{ color: theme.currentColors.secondary }}>
                      Today's Tip
                    </AppText>
                    <AppText variant="body2" color="textSecondary" style={themedStyles.tipText}>
                      {currentTip || 'Stay motivated!'}
                    </AppText>
                  </View>
                  <Ionicons 
                    name="refresh-outline" 
                    size={24} 
                    color={theme.currentColors.textSecondary} 
                    style={themedStyles.tipRefreshIcon}
                  />
                </View>
              </LinearGradient>
            </NeumorphicView>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles for the new Dashboard ---
const createDashboardStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.currentColors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  headerIcon: {
    marginLeft: theme.spacing.sm,
  },
  gaugePlaceholderOuter: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  circularGaugePlaceholder: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    marginTop: theme.spacing.sm,
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressLabel: {
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.currentColors.textPrimary,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  quickActionButtonInner: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: 12,
  },
  quickActionLabel: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  infoCardsContainer: {
    marginBottom: theme.spacing.xl,
  },
  infoCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  infoCardInner: {
    padding: theme.spacing.md,
    borderRadius: 12,
  },
  infoCardIcon: {
    marginBottom: theme.spacing.sm,
  },
  infoCardContent: {
    flex: 1,
  },
  tipCardContainer: {
    marginHorizontal: theme.spacing.md,
  },
  tipCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tipCardGradient: {
    padding: theme.spacing.lg,
  },
  tipCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTextContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  tipText: {
    marginTop: theme.spacing.xs,
  },
  tipRefreshIcon: {
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.currentColors.error,
  },
  errorSubText: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});

export default DashboardScreen; 