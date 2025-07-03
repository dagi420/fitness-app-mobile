import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserWorkoutPlans, UserWorkoutPlan } from '../../api/planService';
import { DisplayableWorkoutPlan } from '../Workouts/WorkoutListScreen';
import { LinearGradient } from 'expo-linear-gradient';

type DashboardNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

// Helper to get the start of the current week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const AnimatedGradient = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const gradientColors = [
    ['#191E29', '#12151C', '#0D0F14'],
    ['#1D212C', '#13161E', '#191E29'],
    ['#12151C', '#191E29', '#1D212C'],
  ];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const color1 = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [gradientColors[0][0], gradientColors[1][0]],
  });
  const color2 = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [gradientColors[0][1], gradientColors[1][1]],
  });
  const color3 = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [gradientColors[0][2], gradientColors[1][2]],
  });

  // @ts-ignore - Animated.Color is not yet in the types but works
  const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

  return (
    <AnimatedLinearGradient
      // @ts-ignore
      colors={[color1, color2, color3]}
      style={StyleSheet.absoluteFill}
    />
  );
};

const DashboardScreen = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation<DashboardNavigationProp>();
  const insets = useSafeAreaInsets();

  const [recentWorkout, setRecentWorkout] = useState<UserWorkoutPlan | null>(null);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTip, setCurrentTip] = useState("");

  const motivationalTips = useMemo(() => [
    "The only bad workout is the one that didn't happen.",
    "Believe you can and you're halfway there.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "Success isn't always about greatness. It's about consistency. Consistent hard work gains success.",
    "Don't watch the clock; do what it does. Keep going.",
  ], []);

  const fetchData = async () => {
    if (!token || !user?._id) {
      setIsLoading(false);
      return;
    }
    try {
      const [workoutPlansResponse] = await Promise.all([
        fetchUserWorkoutPlans(token, user._id),
      ]);

      if (workoutPlansResponse.success && workoutPlansResponse.plans) {
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        startOfWeek.setHours(0, 0, 0, 0);

        let countThisWeek = 0;
        workoutPlansResponse.plans.forEach(plan => {
          const planDate = new Date(plan.createdAt);
          if (planDate >= startOfWeek) {
            countThisWeek++;
          }
        });
        setWorkoutsThisWeek(countThisWeek);

        const sortedPlans = [...workoutPlansResponse.plans].sort((a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        if (sortedPlans.length > 0) {
          setRecentWorkout(sortedPlans[0]);
        }
      }
      setCurrentTip(motivationalTips[Math.floor(Math.random() * motivationalTips.length)]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [token, user?._id])
  );
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = user?.fullName?.split(' ')[0] || 'User';

  const isFemale = user?.profile?.gender === 'female';

  const headerImage = isFemale
    ? 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d29tYW4lMjB3b3Jrb3V0fGVufDB8fDB8fHww'
    : 'https://st3.depositphotos.com/2389277/16160/i/450/depositphotos_161607422-stock-photo-muscular-man-doing-heavy-weight.jpg';
  
  const planImage = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?fit=crop&w=1200&q=80';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AnimatedGradient />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <ImageBackground
          source={{ uri: headerImage }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userNameText}>{userName}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="person-circle-outline" size={48} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.contentContainer}>
          {/* Daily Goal Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryTitle}>Workouts This Week</Text>
              <Text style={styles.summarySubtitle}>{workoutsThisWeek} Done</Text>
            </View>
            <View style={styles.summaryProgress}>
              <View style={[styles.summaryProgressBar, {width: `${(workoutsThisWeek / 5) * 100}%`}]} />
            </View>
          </View>

          {/* Quick Actions Section */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionCard
              title="Start Workout"
              icon="play"
              color="#FF6B6B"
              onPress={() => navigation.navigate('MainApp', { screen: 'Workouts' })}
            />
            <QuickActionCard
              title="Track Meal"
              icon="fast-food"
              color="#4ECDC4"
              onPress={() => navigation.navigate('MainApp', { screen: 'Diet' })}
            />
          </View>

          {/* Today's Plan Section */}
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <TouchableOpacity 
            style={styles.planCard} 
            activeOpacity={0.8}
            onPress={() => {
              if (recentWorkout) {
                const displayablePlan: DisplayableWorkoutPlan = {
                  _id: recentWorkout._id,
                  planName: recentWorkout.planName,
                  exercises: recentWorkout.exercises,
                  createdAt: recentWorkout.createdAt,
                  updatedAt: recentWorkout.updatedAt,
                  isAIGenerated: recentWorkout.isAIgenerated,
                };
                navigation.navigate('MainApp', {
                  screen: 'Workouts',
                  params: {
                    screen: 'WorkoutDetail',
                    params: { workout: displayablePlan },
                  },
                });
              }
            }}
          >
            <ImageBackground
              source={{ uri: planImage }}
              style={styles.planImage}
              imageStyle={{ borderRadius: 20 }}
            >
              <View style={styles.planOverlay}>
                <Text style={styles.planType}>Last Active Plan</Text>
                <Text style={styles.planTitle}>{recentWorkout?.planName || 'No recent plan'}</Text>
                <View style={styles.planDetails}>
                  <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.planDetailText}>{recentWorkout?.durationEstimateMinutes || 0} mins</Text>
                  <Ionicons name="flame-outline" size={16} color="#FFFFFF" style={{ marginLeft: 15 }} />
                  <Text style={styles.planDetailText}>350 kcal est.</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* Motivational Quote */}
          <View style={styles.quoteCard}>
            <Ionicons name="sparkles-outline" size={24} color="#01D38D" />
            <Text style={styles.quoteText}>
              {currentTip}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const QuickActionCard = ({ title, icon, color, onPress }: { title: string, icon: any, color: string, onPress: () => void }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="#FFFFFF" />
    </View>
    <Text style={styles.quickActionTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    height: 250,
    justifyContent: 'flex-end',
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  headerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: '500',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  contentContainer: {
    paddingHorizontal: 25,
    marginTop: -20, // Pulls content up to overlap with header curve
  },
  summaryCard: {
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  summaryTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  summarySubtitle: {
    color: '#01D38D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryProgress: {
    height: 8,
    backgroundColor: '#2A2D32',
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryProgressBar: {
    height: '100%',
    backgroundColor: '#01D38D',
    borderRadius: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickActionCard: {
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '48%',
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
  },
  planCard: {
    height: 180,
    borderRadius: 20,
    marginBottom: 30,
  },
  planImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  planOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
  },
  planType: {
    color: '#A0A5B1',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  planTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  planDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planDetailText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 5,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 20,
    padding: 20,
  },
  quoteText: {
    flex: 1,
    color: '#A0A5B1',
    fontSize: 15,
    fontStyle: 'italic',
    marginLeft: 15,
  },
});

export default DashboardScreen;