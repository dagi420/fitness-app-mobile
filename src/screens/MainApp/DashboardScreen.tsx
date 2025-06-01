import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
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

// Neumorphic components
import { useAppTheme } from '../../styles/useAppTheme';
import NeumorphicView from '../../components/common/NeumorphicView';
import AppText from '../../components/common/AppText';
import NeumorphicButton from '../../components/common/NeumorphicButton';

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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.currentColors.primary]} tintColor={theme.currentColors.primary} />}
      >
        {/* Header Area */}
        <View style={themedStyles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={themedStyles.avatarContainer}>
            {/* Placeholder for Avatar - an icon for now */}
            <Ionicons name="person-circle-outline" size={44} color={theme.currentColors.primary} />
          </TouchableOpacity>
          <View style={themedStyles.greetingContainer}>
            <AppText variant="h2" fontWeight="bold">Hello, {user?.fullName?.split(' ')[0] || 'User'}!</AppText>
            <AppText variant="body2" color="textSecondary">Let's make today count.</AppText>
          </View>
          <NeumorphicButton 
            iconName="notifications-outline" 
            neumorphicType="flat" 
            neumorphicSize="small"
            containerStyle={{...themedStyles.headerIcon, padding: 0}}
            iconSize={26}
            onPress={() => {/* TODO: Notification action */}}
          />
        </View>

        {/* Main Info/Gauge Area (Circular Placeholder) */}
        <View style={themedStyles.gaugePlaceholderOuter}>
          <NeumorphicView 
            type="flat"
            style={themedStyles.circularGaugePlaceholder}
          >
            <Ionicons name="trophy-outline" size={60} color={theme.currentColors.accent} />
            <AppText variant="h3" color="accent" style={{marginTop: theme.spacing.sm}}>Daily Goal</AppText>
            <AppText variant="caption" color="textSecondary" style={{marginTop: theme.spacing.xs}}>75% Complete</AppText> 
          </NeumorphicView>
        </View>

        {/* Quick Action Buttons (Circular) */}
        <View style={themedStyles.quickActionsRowContainer}>
          {/* Start/Continue Workout Button */}
          <View style={themedStyles.quickActionButtonWrapper}>
            <NeumorphicButton
              neumorphicType="raised" 
              iconName={recentWorkout ? "play-circle-outline" : "walk-outline"}
              iconSize={28}
              buttonType="default"
              containerStyle={{...themedStyles.circularButton, paddingVertical: 0, paddingHorizontal: 0}}
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
                    });
                } else {
                    navigation.navigate('Workouts', {
                        screen: 'WorkoutList',
                    });
                }
              }}
            />
            <AppText variant="caption" style={themedStyles.quickActionLabel}>Workout</AppText>
          </View>

          {/* Create New Plan Button */}
          <View style={themedStyles.quickActionButtonWrapper}>
            <NeumorphicButton
              neumorphicType="raised"
              iconName="add-circle-outline"
              iconSize={28}
              buttonType="default"
              containerStyle={{...themedStyles.circularButton, paddingVertical: 0, paddingHorizontal: 0}}
              onPress={() => navigation.navigate('CreatePlan')}
            />
            <AppText variant="caption" style={themedStyles.quickActionLabel}>New Plan</AppText>
          </View>

          {/* View Diet Button */}
          <View style={themedStyles.quickActionButtonWrapper}>
            <NeumorphicButton
              neumorphicType="raised"
              iconName="restaurant-outline"
              iconSize={28}
              buttonType="default"
              containerStyle={{...themedStyles.circularButton, paddingVertical: 0, paddingHorizontal: 0}}
              onPress={() => navigation.dispatch(TabActions.jumpTo('Diet'))}
            />
            <AppText variant="caption" style={themedStyles.quickActionLabel}>My Diet</AppText>
          </View>

          {/* Log Progress Button */}
          <View style={themedStyles.quickActionButtonWrapper}>
            <NeumorphicButton
              neumorphicType="raised"
              iconName="checkmark-done-outline"
              iconSize={28}
              buttonType="default"
              containerStyle={{...themedStyles.circularButton, paddingVertical: 0, paddingHorizontal: 0}}
              onPress={() => navigation.dispatch(TabActions.jumpTo('Progress'))}
            />
            <AppText variant="caption" style={themedStyles.quickActionLabel}>Log Entry</AppText>
          </View>
        </View>

        {/* Compact Info Cards */}
        <View style={themedStyles.compactCardsContainer}>
          {[
            {
              id: 'totalWorkouts',
              icon: 'barbell-outline' as keyof typeof Ionicons.glyphMap,
              title: 'Total Plans',
              data: `${totalWorkouts}`,
              color: theme.currentColors.primary,
              onPress: () => navigation.dispatch(TabActions.jumpTo('Workouts')),
            },
            {
              id: 'workoutsThisWeek',
              icon: 'flame-outline' as keyof typeof Ionicons.glyphMap,
              title: 'This Week',
              data: `${workoutsThisWeek} Done`,
              color: theme.currentColors.accentSecondary, // Orange accent
              onPress: () => navigation.dispatch(TabActions.jumpTo('Progress')),
            },
            {
              id: 'currentDiet',
              icon: 'fast-food-outline' as keyof typeof Ionicons.glyphMap,
              title: 'Current Diet',
              data: recentDietPlan?.planName || 'Not Set',
              color: theme.currentColors.accent, // Green accent
              onPress: () => navigation.dispatch(TabActions.jumpTo('Diet')),
            },
          ].map((card) => (
            <TouchableOpacity 
                key={card.id} 
                style={themedStyles.compactCardWrapper} 
                onPress={card.onPress} 
                activeOpacity={0.8}
            >
              <NeumorphicView type="raised" size="small" style={themedStyles.compactCard}>
                <Ionicons name={card.icon} size={26} color={card.color || theme.currentColors.primary} style={themedStyles.compactCardIcon} />
                <View style={themedStyles.compactCardTextContainer}>
                    <AppText variant="label" fontWeight="semibold" style={{color: card.color || theme.currentColors.primary}}>{card.title}</AppText>
                    <AppText variant="caption" color="textSecondary" numberOfLines={2}>{card.data}</AppText>
                </View>
              </NeumorphicView>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Full-width Today's Tip Card */}
        <TouchableOpacity
          style={themedStyles.tipCardFullWidthWrapper}
          onPress={() => setCurrentTip(motivationalTips[Math.floor(Math.random() * motivationalTips.length)])}
          activeOpacity={0.8}
        >
          <NeumorphicView type="raised" size="medium" style={themedStyles.tipCardFullWidth}>
            <Ionicons name="bulb-outline" size={28} color={theme.currentColors.secondary} style={themedStyles.tipCardIconStyle} />
            <View style={themedStyles.tipCardTextContentStyle}>
              <AppText variant="label" fontWeight="semibold" style={{ color: theme.currentColors.secondary }}>Today's Tip</AppText>
              <AppText variant="body2" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
                {currentTip || 'Stay motivated!'}
              </AppText>
            </View>
            {/* Optional: Refresh icon, can be added back here if desired */}
            {/* <Ionicons name="refresh-outline" size={22} color={theme.currentColors.textSecondary} style={themedStyles.tipCardRefreshIconStyle} /> */}
          </NeumorphicView>
        </TouchableOpacity>

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
    padding: theme.spacing.md,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  greetingContainer: {
    flex: 1,
  },
  headerIcon: {
    padding: theme.spacing.sm,
  },
  gaugePlaceholderOuter: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  circularGaugePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
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
  // Styles for Quick Action Buttons
  quickActionsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start', 
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md, // Add some margin top after the gauge placeholder
  },
  quickActionButtonWrapper: {
    alignItems: 'center',
    maxWidth: 80, 
  },
  circularButton: {
    width: 64, // Slightly larger for better touch
    height: 64,
    borderRadius: 32,
    // NeumorphicButton handles internal centering of icon
    // padding props are for the NeumorphicView container inside TouchableOpacity
    // If icon is not centered, might need to adjust NeumorphicButton internal styles or pass specific iconStyle prop
  },
  quickActionLabel: {
    marginTop: theme.spacing.xs, 
    textAlign: 'center',
    color: theme.currentColors.textSecondary, 
    fontSize: theme.typography.fontSizes.xs, 
  },
  // Styles for Compact Info Cards
  compactCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg, // Increased margin top
  },
  compactCardWrapper: {
    width: '48.5%', // Adjusted for a tiny bit more space with justifyContent: space-between
    marginBottom: theme.spacing.md, 
  },
  compactCard: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 90, // Ensure cards have a decent minimum height for tapability and content
  },
  compactCardIcon: {
    marginRight: theme.spacing.md, // Increased margin for icon
  },
  compactCardTextContainer: {
    flex: 1, 
  },
  // Styles for Full-width Tip Card
  tipCardFullWidthWrapper: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tipCardFullWidth: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCardIconStyle: {
    marginRight: theme.spacing.md,
  },
  tipCardTextContentStyle: {
    flex: 1,
  },
  tipCardRefreshIconStyle: { // Style for the refresh icon
    marginLeft: theme.spacing.sm,
  }
});

export default DashboardScreen; 