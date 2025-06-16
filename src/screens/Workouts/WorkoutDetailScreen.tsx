import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { PlannedExercise } from '../Planner/ManualPlanCreatorScreen';
import { UserWorkoutPlan } from '../../api/planService';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type WorkoutDetailScreenRouteProp = RouteProp<WorkoutsStackParamList, 'WorkoutDetail'>;
type WorkoutDetailScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutDetail'>;

const ExerciseCard: React.FC<{ exercise: PlannedExercise; index: number }> = ({
  exercise,
  index,
}) => {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseNumberContainer}>
        <Text style={styles.exerciseNumber}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={styles.exerciseMeta}>
          {exercise.sets} sets x {exercise.reps} reps
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#696E79" />
    </View>
  );
};

const WorkoutDetailScreen = () => {
  const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
  const route = useRoute<WorkoutDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const workout = useMemo(() => route.params.workout, [route.params.workout]);

  const handleStartWorkout = () => {
    if (!workout) return;
    const planForActiveWorkout: UserWorkoutPlan = {
      _id: workout._id,
      planName: workout.planName,
      exercises: workout.exercises,
      userId: '', // This should be handled by the auth context where needed, not here
      isAIgenerated: workout.isAIGenerated || false,
      createdAt: workout.createdAt || new Date().toISOString(),
      updatedAt: workout.updatedAt || new Date().toISOString(),
      durationEstimateMinutes: workout.durationEstimateMinutes,
      caloriesBurned: workout.caloriesBurned,
      description: workout.description,
      type: workout.type,
      difficulty: workout.difficulty,
    };
    navigation.navigate('ActiveWorkout', { plan: planForActiveWorkout });
  };

  const defaultImage =
    'https://images.unsplash.com/photo-1554344728-77cf90d922a2?fit=crop&w=1200&q=80';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: workout.imageUrl || defaultImage }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.planTitle}>{workout.planName}</Text>
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.metaText}>{workout.durationEstimateMinutes || 'N/A'} mins</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="body-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.metaText}>{workout.difficulty || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {workout.exercises.map((exercise, index) => (
            <ExerciseCard key={exercise._id || index} exercise={exercise} index={index} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
          <Text style={styles.startButtonText}>Start Workout</Text>
          <Ionicons name="play-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    height: 300,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: 25,
  },
  backButton: {
    position: 'absolute',
    top: 50, // Adjust as needed based on safe area
    left: 25,
    zIndex: 10,
  },
  headerContent: {
    alignSelf: 'flex-end',
    width: '100%',
  },
  planTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  contentContainer: {
    padding: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  exerciseNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(1, 211, 141, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseNumber: {
    color: '#01D38D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseMeta: {
    fontSize: 14,
    color: '#A0A5B1',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 25,
    paddingTop: 10,
    backgroundColor: '#191E29', // To ensure it blends
  },
  startButton: {
    backgroundColor: '#01D38D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default WorkoutDetailScreen; 