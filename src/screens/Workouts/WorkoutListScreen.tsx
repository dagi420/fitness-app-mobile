import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { Workout, fetchAllWorkouts } from '../../api/workoutService';
import { fetchUserWorkoutPlans } from '../../api/planService';
import { useAuth } from '../../store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { UserWorkoutPlan } from '../../api/planService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface DisplayableWorkoutPlan extends Omit<UserWorkoutPlan, 'userId' | 'isAIgenerated'> {
  description?: string;
  type?: string;
  difficulty?: string;
  durationEstimateMinutes?: number;
  isAIGenerated?: boolean;
  imageUrl?: string;
}

type WorkoutListNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutList'>;

const WorkoutCard: React.FC<{ workout: DisplayableWorkoutPlan; onPress: () => void, cardStyle: any }> = React.memo(
  ({ workout, onPress, cardStyle }) => {
    const defaultImage = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?fit=crop&w=1200&q=80';
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        <ImageBackground
          source={{ uri: workout.imageUrl || defaultImage }}
          style={styles.cardBackground}
          imageStyle={styles.cardImageStyle}
        >
          <View style={styles.cardOverlay}>
            {workout.isAIGenerated && (
              <View style={styles.aiTag}>
                <Ionicons name="flash" size={12} color="#FFFFFF" />
                <Text style={styles.aiTagText}>AI</Text>
              </View>
            )}
            <Text style={styles.workoutTitle} numberOfLines={2}>
              {workout.planName}
            </Text>
            <View style={styles.workoutDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                <Text style={styles.detailText}>{workout.durationEstimateMinutes || 'N/A'} mins</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="barbell-outline" size={14} color="#FFFFFF" />
                <Text style={styles.detailText}>{workout.exercises.length} exercises</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }
);

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="sad-outline" size={80} color="#696E79" />
    <Text style={styles.emptyTitle}>No Workouts Yet</Text>
    <Text style={styles.emptySubtitle}>
      Your created or saved workout plans will appear here.
    </Text>
    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
      <Ionicons name="refresh" size={20} color="#01D38D" />
      <Text style={styles.refreshButtonText}>Tap to Refresh</Text>
    </TouchableOpacity>
  </View>
);

const WorkoutListScreen = () => {
  const navigation = useNavigation<WorkoutListNavigationProp>();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [userPlans, setUserPlans] = useState<DisplayableWorkoutPlan[]>([]);
  const [recommendedWorkouts, setRecommendedWorkouts] = useState<DisplayableWorkoutPlan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkouts = async () => {
    if (!token || !user) return;
    try {
      setRefreshing(true);
      const [plansResponse, workoutsResponse] = await Promise.all([
        fetchUserWorkoutPlans(token, user._id),
        fetchAllWorkouts(token),
      ]);

      if (plansResponse.success && plansResponse.plans) {
        setUserPlans(plansResponse.plans as DisplayableWorkoutPlan[]);
      }

      if (workoutsResponse.success && workoutsResponse.workouts) {
        const displayableWorkouts = workoutsResponse.workouts.map(mapWorkoutToDisplayablePlan);
        setRecommendedWorkouts(displayableWorkouts);
      }
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadWorkouts();
    }, [token, user])
  );

  const mapWorkoutToDisplayablePlan = (workout: Workout): DisplayableWorkoutPlan => ({
    _id: workout._id,
    planName: workout.name,
    description: workout.description,
    type: workout.type,
    difficulty: workout.difficulty,
    exercises: workout.exercises.map((e) => ({
      _id: e._id,
      exerciseId: e._id,
      name: e.name,
      reps: e.reps || '10-12',
      sets: String(e.sets || '3'),
      durationMinutes: e.durationSeconds ? e.durationSeconds / 60 : 1,
      type: e.type || 'Strength',
      category: 'General',
      difficulty: e.difficulty || 'Intermediate',
      targetMuscleGroups: e.muscleGroups || [],
      equipment: e.equipment || '',
      imageUrl: e.imageUrl || '',
      videoUrl: e.videoUrl || '',
      description: e.description || '',
      instructions: e.instructions || [],
    })),
    durationEstimateMinutes: workout.durationEstimateMinutes,
    isAIGenerated: false,
    imageUrl: workout.imageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleWorkoutPress = (workout: DisplayableWorkoutPlan) => {
    navigation.navigate('WorkoutDetail', { workout: workout });
  };

  const renderWorkoutSection = (
    title: string,
    workouts: DisplayableWorkoutPlan[],
    horizontal = false
  ) => {
    if (!workouts || workouts.length === 0) {
      return null;
    }
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView
          horizontal={horizontal}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={horizontal ? { paddingHorizontal: 25 } : styles.verticalListContent}
        >
          {workouts.map((item) => (
            <WorkoutCard 
              key={item._id} 
              workout={item} 
              onPress={() => handleWorkoutPress(item)} 
              cardStyle={horizontal ? styles.workoutCardHorizontal : styles.workoutCardVertical}
            />
          ))}
        </ScrollView>
      </View>
    );
  };
  
  if (isLoading) {
    return (
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
             <Text style={{color: 'white'}}>Loading...</Text>
        </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Workouts</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadWorkouts} tintColor="#01D38D" />
        }
      >
        {userPlans.length === 0 && recommendedWorkouts.length === 0 ? (
          <EmptyState onRefresh={loadWorkouts} />
        ) : (
          <>
            {renderWorkoutSection('My Plans', userPlans, true)}
            {renderWorkoutSection('Recommended For You', recommendedWorkouts, false)}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const cardWidth = Dimensions.get('window').width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    paddingHorizontal: 25,
  },
  workoutCardHorizontal: {
    width: cardWidth,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 15,
  },
  workoutCardVertical: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  verticalListContent: {
    paddingHorizontal: 25,
  },
  cardBackground: {
    flex: 1,
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 15,
    justifyContent: 'space-between',
  },
  aiTag: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  workoutDetails: {
    flexDirection: 'row',
    gap: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#A0A5B1',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01D38D20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#01D38D',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default WorkoutListScreen;