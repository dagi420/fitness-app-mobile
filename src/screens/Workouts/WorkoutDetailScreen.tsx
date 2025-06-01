import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Button, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { Workout, fetchWorkoutById, ExerciseDetail } from '../../api/workoutService';
import { useAuth } from '../../store/AuthContext';
import { PlannedExercise, BaseExercise } from '../Planner/ManualPlanCreatorScreen';
import { DisplayableWorkoutPlan } from './WorkoutListScreen';

// Define the param list for this screen
// Ensure 'WorkoutDetail: { workoutId: string }' is added to your RootStackParamList
type WorkoutDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;

// Define navigation prop for WorkoutDetailScreen to navigate to ActiveWorkoutScreen
type WorkoutDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutDetail'>;

interface WorkoutDetailScreenProps {
  // navigation: WorkoutDetailScreenNavigationProp;
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
    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
    {exercise.planSets && <Text style={styles.exerciseDetailText}>Sets: {exercise.planSets}</Text>}
    {exercise.planReps && <Text style={styles.exerciseDetailText}>Reps: {exercise.planReps}</Text>}
    {/* PlannedExercise extends BaseExercise which can have description */}
    {exercise.description && <Text style={styles.exerciseDetailText}>Notes: {exercise.description}</Text>}
    {/* If you add duration to PlannedExercise/BaseExercise, you can display it here */}
    {/* {(exercise as any).durationSeconds && <Text style={styles.exerciseDetailText}>Duration: {(exercise as any).durationSeconds}s</Text>} */}
  </View>
);

const WorkoutDetailScreen: React.FC<WorkoutDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
  const { workoutId, planObject } = route.params;
  const { token } = useAuth();

  const [currentPlan, setCurrentPlan] = useState<DisplayableWorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlanDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (planObject) {
        // If a full plan object is passed, use it directly.
        // Its exercises are already PlannedExercise[] as per DisplayableWorkoutPlan definition.
        setCurrentPlan(planObject);
      } else if (workoutId && token) {
        const response = await fetchWorkoutById(workoutId, token);
        if (response.success && response.workout) {
          const fetchedApiWorkout = response.workout;
          // Map ApiWorkout to DisplayableWorkoutPlan
          // And ApiExerciseDetail to PlannedExercise
          const mappedExercises: PlannedExercise[] = fetchedApiWorkout.exercises.map((ex: ExerciseDetail, index: number): PlannedExercise => ({
            _id: `${fetchedApiWorkout._id}_ex_${index}`, // Create a unique ID
            exerciseName: ex.exerciseName,
            type: (ex as any).type || 'N/A', // ApiExerciseDetail might not have type/difficulty
            difficulty: (ex as any).difficulty || 'N/A',
            targetMuscleGroups: (ex as any).targetMuscleGroups || [],
            equipmentNeeded: (ex as any).equipmentNeeded || [],
            description: (ex as any).description || undefined,
            // videoUrl: (ex as any).videoUrl || undefined,
            // imageUrl: (ex as any).imageUrl || undefined,
            planSets: String(ex.sets), // Ensure planSets is string if PlannedExercise expects string
            planReps: ex.reps,
          }));

          setCurrentPlan({
            _id: fetchedApiWorkout._id,
            planName: fetchedApiWorkout.name,
            exercises: mappedExercises,
            description: fetchedApiWorkout.description,
            type: fetchedApiWorkout.type,
            difficulty: fetchedApiWorkout.difficulty,
            durationEstimateMinutes: fetchedApiWorkout.durationEstimateMinutes,
            // ApiWorkout type doesn't define createdAt/updatedAt. Provide defaults for DisplayableWorkoutPlan.
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString(),
          });
        } else {
          setError(response.message || 'Failed to load workout details.');
        }
      } else if (!token) {
        setError('Authentication required.');
      } else {
        setError('Workout ID or Plan Object not provided.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlanDetails();
  }, [workoutId, planObject, token]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" onPress={loadPlanDetails} />
        </View>
    );
  }

  if (!currentPlan) {
    return <View style={styles.centered}><Text>Workout details not found.</Text></View>;
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
    marginBottom: 10, // Space for button
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