import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { fetchAllWorkouts, Workout, ExerciseDetail } from '../../api/workoutService';
import { fetchUserWorkoutPlans, UserWorkoutPlan } from '../../api/planService';
import { useAuth } from '../../store/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { PlannedExercise } from '../Planner/ManualPlanCreatorScreen'; // For mapping general exercises

// Define a unified type for items that WorkoutCard can display
// We use UserWorkoutPlan as the base because it already includes `exercises` and `planName`
// General workouts will be mapped to this structure for consistency in the card.
export interface DisplayableWorkoutPlan extends Omit<UserWorkoutPlan, 'userId' | 'isAIgenerated'> {
  // Ensure all fields WorkoutCard needs are here or can be derived
  // `name` will be `planName` for UserWorkoutPlan, or mapped from Workout.name
  // `description` needs to be present or mapped
  // `type` and `difficulty` need to be present or mapped
  // `durationEstimateMinutes` might not exist for UserWorkoutPlan, handle optionally
  description?: string;
  type?: string;
  difficulty?: string;
  durationEstimateMinutes?: number;
}

// Define navigation prop type for this screen
type WorkoutListNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutList'>;

// Basic Card component for displaying a workout
const WorkoutCard: React.FC<{ workout: DisplayableWorkoutPlan; onPress: () => void }> = ({ workout, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.cardTitle}>{workout.planName || (workout as any).name}</Text>
    {(workout.type || workout.difficulty) && (
        <Text style={styles.cardSubtitle}>
            {workout.type}{workout.type && workout.difficulty ? ' - ' : ''}{workout.difficulty}
        </Text>
    )}
    {workout.durationEstimateMinutes ? (
        <Text style={styles.cardDuration}>{workout.durationEstimateMinutes} mins</Text>
    ) : null}
    {workout.description && (
        <Text numberOfLines={2} style={styles.cardDescription}>{workout.description}</Text>
    )}
    {Array.isArray(workout.exercises) && workout.exercises.length > 0 && (
        <Text style={styles.cardExerciseCount}>{workout.exercises.length} exercise(s)</Text>
    )}
  </TouchableOpacity>
);

const WorkoutListScreen = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation<WorkoutListNavigationProp>();

  const [sections, setSections] = useState<Array<{ title: string; data: DisplayableWorkoutPlan[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mapWorkoutToDisplayablePlan = (workout: Workout): DisplayableWorkoutPlan => ({
    _id: workout._id,
    planName: workout.name,
    exercises: workout.exercises.map((ex: ExerciseDetail, index: number) => ({
        // Attempt to map ExerciseDetail to PlannedExercise more completely
        _id: `${workout._id}_ex_${index}`, // Create a unique-ish ID for these mapped exercises
        exerciseName: ex.exerciseName,
        // General workouts from `workouts` collection might not have type/difficulty per exercise like BaseExercise does
        // So we provide defaults or leave them out if WorkoutCard doesn't strictly need them for this view.
        type: (ex as any).type || 'N/A', // Assuming ExerciseDetail might not have these
        difficulty: (ex as any).difficulty || 'N/A',
        targetMuscleGroups: (ex as any).targetMuscleGroups || [],
        equipmentNeeded: (ex as any).equipmentNeeded || [],
        planSets: String(ex.sets), // Convert sets to string if PlannedExercise.planSets is string
        planReps: ex.reps,
        // description, videoUrl, imageUrl might be missing for these mapped exercises
    })),
    description: workout.description,
    type: workout.type,
    difficulty: workout.difficulty,
    durationEstimateMinutes: workout.durationEstimateMinutes,
    // These are from UserWorkoutPlan, provide sensible defaults or ensure DisplayableWorkoutPlan doesn't require them
    createdAt: (workout as any).createdAt || new Date().toISOString(), 
    updatedAt: (workout as any).updatedAt || new Date().toISOString(), 
  });

  const loadAllData = useCallback(async (refresh = false) => {
    if (!token || !user?._id) {
      setError('Authentication details not found. Please login again.');
      setIsLoading(false);
      if(refresh) setIsRefreshing(false);
      return;
    }
    if(!refresh) setIsLoading(true);
    setError(null);

    try {
      const [generalWorkoutsResponse, userPlansResponse] = await Promise.all([
        fetchAllWorkouts(token),
        fetchUserWorkoutPlans(token, user._id)
      ]);

      const loadedSections = [];

      if (userPlansResponse.success && userPlansResponse.plans && userPlansResponse.plans.length > 0) {
        // Map UserWorkoutPlan to DisplayableWorkoutPlan
        const customPlans: DisplayableWorkoutPlan[] = userPlansResponse.plans.map(p => ({
            ...p, // Spread all properties from UserWorkoutPlan
            // planName is already there, description, type, difficulty might be missing or part of exercises structure
            // For simplicity, WorkoutCard will handle optional fields
        }));
        loadedSections.push({ title: 'My Custom Workout Plans', data: customPlans });
      }

      if (generalWorkoutsResponse.success && generalWorkoutsResponse.workouts && generalWorkoutsResponse.workouts.length > 0) {
        // Map Workout to DisplayableWorkoutPlan
        const generalPlans: DisplayableWorkoutPlan[] = generalWorkoutsResponse.workouts.map(mapWorkoutToDisplayablePlan);
        loadedSections.push({ title: 'Available Workouts', data: generalPlans });
      }
      
      setSections(loadedSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      if(!refresh) setIsLoading(false);
      if(refresh) setIsRefreshing(false);
    }
  }, [token, user?._id, mapWorkoutToDisplayablePlan]);

  // Initial load and refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAllData(true);
  };

  const handleWorkoutPress = (plan: DisplayableWorkoutPlan, sectionTitle: string) => {
    if (plan._id) {
      if (sectionTitle === 'My Custom Workout Plans') {
        // It's a user-created plan, pass the whole object
        // The `plan` object here is already a DisplayableWorkoutPlan, which is compatible
        navigation.navigate('WorkoutDetail', { planObject: plan });
      } else {
        // It's a general workout, pass only the ID for fetching
        navigation.navigate('WorkoutDetail', { workoutId: plan._id });
      }
    } else {
        Alert.alert("Error", "Workout ID is missing.");
    }
  };

  if (isLoading && sections.length === 0) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" /></SafeAreaView>;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => loadAllData()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (sections.length === 0 && !isLoading) {
    return (
        <SafeAreaView style={styles.centered}>
            <Text style={styles.emptyStateText}>No workouts or plans available.</Text>
            <Text style={styles.infoText}>Pull down to refresh or create a new plan!</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item._id + index}
        renderItem={({ item, section }) => (
            <WorkoutCard workout={item} onPress={() => handleWorkoutPress(item, section.title)} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.mainTitle}>All Workouts & Plans</Text>}
        stickySectionHeadersEnabled={false}
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
    backgroundColor: '#f4f4f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f8',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    marginLeft: 10,
    color: '#333'
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#e9ecef',
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 6,
    color: '#495057'
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 5,
  },
  infoText: {
    color: '#555',
    fontSize: 14,
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
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007AFF'
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  cardDuration: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  cardExerciseCount: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 5,
    fontWeight: '500',
  }
});

export default WorkoutListScreen; 