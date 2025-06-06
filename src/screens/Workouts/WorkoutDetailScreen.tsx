import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Button, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, WorkoutsStackParamList } from '../../navigation/types';
import { Workout, fetchWorkoutById, ExerciseDetail } from '../../api/workoutService';
import { useAuth } from '../../store/AuthContext';
import { PlannedExercise, BaseExercise } from '../Planner/ManualPlanCreatorScreen';
import { DisplayableWorkoutPlan } from './WorkoutListScreen';

// Define the param list for this screen using the correct Stack a
// type WorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;
// type WorkoutDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutDetail'>;

type WorkoutDetailScreenRouteProp = RouteProp<WorkoutsStackParamList, 'WorkoutDetail'>;
type WorkoutDetailScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutDetail'>;

interface WorkoutDetailScreenProps {
  // navigation: WorkoutDetailScreenNavigationProp; // Navigation is now obtained via useNavigation hook
  route: WorkoutDetailScreenRouteProp;
}

// Simplified Exercise type for the card in this screen
// It needs to accommodate exercises from general workouts (ApiExerciseDetail)
// and exercises from custom plans (PlannedExercise)
interface ScreenExerciseDetail {
  exerciseName: string;
  sets?: string | number;
  reps?: string;
  durationSeconds?: number; 
  // Add other common fields you want to display, e.g., description from PlannedExercise
  description?: string;
}

// ExerciseCard now accepts PlannedExercise directly, as DisplayableWorkoutPlan stores exercises as PlannedExercise[]
const ExerciseCard: React.FC<{ exercise: PlannedExercise }> = ({ exercise }) => (
  <View style={styles.exerciseCard}>
    <Text style={styles.exerciseName}>{exercise.name}</Text>
    {exercise.sets && <Text style={styles.exerciseDetailText}>Sets: {exercise.sets}</Text>}
    {exercise.reps && <Text style={styles.exerciseDetailText}>Reps: {exercise.reps}</Text>}
    {/* PlannedExercise extends BaseExercise which can have description */}
    {exercise.description && <Text style={styles.exerciseDetailText}>Notes: {exercise.description}</Text>}
    {/* If you add duration to PlannedExercise/BaseExercise, you can display it here */}
    {/* {(exercise as any).durationSeconds && <Text style={styles.exerciseDetailText}>Duration: {(exercise as any).durationSeconds}s</Text>} */}
  </View>
);

const WorkoutDetailScreen: React.FC<WorkoutDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
  const { token } = useAuth();

  const planObjectFromParams = useMemo(() => route.params.planObject, [route.params.planObject]);
  const workoutIdFromParams = useMemo(() => route.params.workoutId, [route.params.workoutId]);

  const [currentPlan, setCurrentPlan] = useState<DisplayableWorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true as we always attempt to load
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);      // Set loading true at the start of any load attempt
      setError(null);        // Clear previous errors
      // setCurrentPlan(null); // Clear previous plan; a new plan will be set or it remains null if error/no data
                            // Decided to set currentPlan to null only if there's an actual attempt to load new data
                            // or if dependencies indicate a change.
                            // If planObjectFromParams is present, it *is* the new data.

      try {
        if (planObjectFromParams) {
          // If a plan object is passed directly, it's the source of truth.
          setCurrentPlan(planObjectFromParams);
        } else if (workoutIdFromParams && token) {
          // Fetch by ID if no planObject was passed.
          setCurrentPlan(null); // Clear any old plan before fetching new one
          const response = await fetchWorkoutById(workoutIdFromParams, token);
          if (response.success && response.workout) {
            const fetchedApiWorkout = response.workout;
            const mappedExercises: PlannedExercise[] = fetchedApiWorkout.exercises.map((ex: ExerciseDetail, index: number): PlannedExercise => ({
              _id: ex._id || `${fetchedApiWorkout._id}_ex_${index}`,
              name: ex.name,
              type: ex.type || 'N/A',
              category: (ex as any).category || 'General',
              difficulty: ex.difficulty || 'N/A',
              targetMuscleGroups: ex.muscleGroups || [],
              equipment: ex.equipment || undefined,
              description: ex.description || undefined,
              videoUrl: ex.videoUrl || undefined,
              imageUrl: ex.imageUrl || undefined,
              instructions: ex.instructions || undefined,
              sets: ex.sets !== undefined ? String(ex.sets) : undefined,
              reps: ex.reps !== undefined ? String(ex.reps) : undefined,
              durationSeconds: ex.durationSeconds || undefined,
              order: ex.order !== undefined ? ex.order : index,
            }));
            setCurrentPlan({
              _id: fetchedApiWorkout._id,
              planName: fetchedApiWorkout.name,
              exercises: mappedExercises,
              description: fetchedApiWorkout.description,
              type: fetchedApiWorkout.type,
              difficulty: fetchedApiWorkout.difficulty,
              durationEstimateMinutes: fetchedApiWorkout.durationEstimateMinutes,
              createdAt: (fetchedApiWorkout as any).createdAt || new Date().toISOString(),
              updatedAt: (fetchedApiWorkout as any).updatedAt || new Date().toISOString(),
              isAIGenerated: false, // General workouts fetched by ID are not AI generated
            });
          } else {
            setError(response.message || 'Failed to load workout details.');
            setCurrentPlan(null); // Ensure no stale plan is shown
          }
        } else if (!token && !planObjectFromParams && workoutIdFromParams) {
            setError('Authentication required to fetch workout details.');
            setCurrentPlan(null);
        } else if (!planObjectFromParams && !workoutIdFromParams) {
            setError('Workout ID or Plan Object not provided.');
            setCurrentPlan(null);
        } else {
            // This case means planObjectFromParams is null, and workoutIdFromParams might be null or token is null.
            // If planObjectFromParams was initially null and no workoutId, this is covered.
            // If dependencies change such that these become null later, we should clear the plan.
            setCurrentPlan(null);
            // If no error was set above but we can't load data, ensure a generic message or rely on UI for !currentPlan
            if (!error) setError("Cannot display workout details."); 
        }
      } catch (err) {
        console.error("Error loading workout details:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setCurrentPlan(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

  }, [workoutIdFromParams, planObjectFromParams, token]); // Effect dependencies

  const handleRetry = () => {
    // To retry, we simply re-trigger the loading process defined in useEffect.
    // The useEffect will run because its dependencies (workoutIdFromParams, planObjectFromParams, token)
    // will be the same, but we reset the component's state to initiate the load sequence again.
    setIsLoading(true);
    setError(null);
    setCurrentPlan(null);
    // The useEffect should re-run its loadData function. Forcing a re-run if deps are identical:
    // This typically isn't needed if state changes cause re-render and effect re-evaluates.
    // However, to be explicit for a retry button when deps might not have *changed*: 
    // we can rely on the fact that loadData() will be called by the effect.
    // If we want to force the loadData() call if nothing else changed, one might temporarily change a dummy state
    // that is a dependency, or directly call a re-fetch function not tied to the effect. 
    // For now, setting isLoading to true and other states to null should allow the UI to update,
    // and the effect will execute its logic again as it runs on component updates if dependencies are re-evaluated.
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" onPress={handleRetry} />
        </View>
    );
  }

  if (!currentPlan) {
    return <View style={styles.centered}><Text>Workout details not found or could not be loaded.</Text></View>;
  }

  const handleStartWorkout = () => {
    if (currentPlan) {
      navigation.navigate('ActiveWorkout', { plan: currentPlan });
    } else {
      Alert.alert("Error", "Cannot start workout. Plan details are missing.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* <Image source={{ uri: workout.imageUrl || 'default_image_url' }} style={styles.image} /> */}
      <Text style={styles.title}>{currentPlan.planName}</Text>
      <View style={styles.metaContainer}>
        {currentPlan.type && <Text style={styles.metaText}>Type: {currentPlan.type}</Text>}
        {currentPlan.difficulty && <Text style={styles.metaText}>Difficulty: {currentPlan.difficulty}</Text>}
        {currentPlan.durationEstimateMinutes && <Text style={styles.metaText}>Duration: {currentPlan.durationEstimateMinutes} mins</Text>}
      </View>
      {currentPlan.description && <Text style={styles.description}>{currentPlan.description}</Text>}
      
      <Text style={styles.sectionTitle}>Exercises</Text>
      {currentPlan.exercises && currentPlan.exercises.length > 0 ? (
        currentPlan.exercises.map((ex, index) => (
          // ExerciseCard now expects PlannedExercise, which currentPlan.exercises contains
          <ExerciseCard key={`${ex._id}-${index}`} exercise={ex} /> 
        ))
      ) : (
        <Text>No exercises listed for this workout plan.</Text>
      )}

      <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
        <Text style={styles.startButtonText}>Start Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center', // Center align error text
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#eee', // Placeholder color
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  metaContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between', // Can cause wide spacing if only 1-2 items
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  metaText: {
    fontSize: 14,
    color: '#555',
    marginRight: 15, // Consistent spacing between meta items
    marginBottom: 5, // Spacing if items wrap
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: '#444',
  },
  exerciseCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 5,
  },
  exerciseDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  startButton: {
    backgroundColor: '#28a745', // A nice green color
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30, // Space above the button
    marginBottom: 20, // Space below the button
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default WorkoutDetailScreen; 