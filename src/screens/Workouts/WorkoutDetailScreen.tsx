import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { DisplayableWorkoutPlan } from './WorkoutListScreen';
import { PlannedExercise } from '../Planner/ManualPlanCreatorScreen';
import { useAuth } from '../../store/AuthContext';
import { useAppTheme } from '../../styles/useAppTheme';
import { AppText } from '../../components/AppText';
import { NeumorphicButton } from '../../components/NeumorphicButton';
import Ionicons from '@expo/vector-icons/Ionicons';

type WorkoutDetailScreenRouteProp = RouteProp<WorkoutsStackParamList, 'WorkoutDetail'>;
type WorkoutDetailScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutDetail'>;

interface WorkoutDetailScreenProps {
  route: WorkoutDetailScreenRouteProp;
}

interface ScreenExerciseDetail {
  exerciseName: string;
  sets?: string | number;
  reps?: string;
  durationSeconds?: number;
  description?: string;
  equipment?: string;
  difficulty?: string;
  muscleGroups?: string[];
  videoUrl?: string;
  type?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ExerciseCard: React.FC<{ 
  exercise: PlannedExercise; 
  index: number;
  onPress: () => void;
}> = ({ exercise, index, onPress }) => {
  const theme = useAppTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.exerciseCard,
        { backgroundColor: theme.currentColors.surface }
      ]}
    >
      <View style={styles.exerciseCardContent}>
        <View style={styles.exerciseNumberBadge}>
          <AppText variant="h3" style={{ color: theme.currentColors.primary }}>
            {(index + 1).toString().padStart(2, '0')}
          </AppText>
        </View>
        
        <View style={styles.exerciseMainInfo}>
          <AppText variant="h3" style={{ color: theme.currentColors.textPrimary }}>
            {exercise.name}
          </AppText>
          
          <View style={styles.exerciseMetaRow}>
            {exercise.type && (
              <View style={[styles.badge, { backgroundColor: theme.currentColors.primary + '20' }]}>
                <AppText variant="caption" style={{ color: theme.currentColors.primary }}>
                  {exercise.type}
                </AppText>
              </View>
            )}
            {exercise.difficulty && (
              <View style={[styles.badge, { backgroundColor: theme.currentColors.secondary + '20' }]}>
                <AppText variant="caption" style={{ color: theme.currentColors.secondary }}>
                  {exercise.difficulty}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.exerciseStats}>
            {exercise.sets && (
              <View style={styles.statItem}>
                <Ionicons name="repeat" size={16} color={theme.currentColors.textSecondary} />
                <AppText variant="caption" style={{ color: theme.currentColors.textSecondary }}>
                  {exercise.sets} sets
                </AppText>
              </View>
            )}
            {exercise.reps && (
              <View style={styles.statItem}>
                <Ionicons name="fitness" size={16} color={theme.currentColors.textSecondary} />
                <AppText variant="caption" style={{ color: theme.currentColors.textSecondary }}>
                  {exercise.reps}
                </AppText>
              </View>
            )}
          </View>
        </View>

        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={theme.currentColors.textSecondary}
          style={styles.exerciseCardArrow}
        />
      </View>

      {exercise.targetMuscleGroups && exercise.targetMuscleGroups.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.muscleGroupsScroll}
        >
          {exercise.targetMuscleGroups.map((muscle, idx) => (
            <View 
              key={idx} 
              style={[
                styles.muscleGroupTag,
                { backgroundColor: theme.currentColors.accent + '15' }
              ]}
            >
              <AppText 
                variant="caption" 
                style={{ color: theme.currentColors.accent }}
              >
                {muscle}
              </AppText>
            </View>
          ))}
        </ScrollView>
      )}
    </TouchableOpacity>
  );
};

const WorkoutDetailScreen: React.FC<WorkoutDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation<WorkoutDetailScreenNavigationProp>();
  const { token } = useAuth();
  const theme = useAppTheme();

  const planObjectFromParams = useMemo(() => route.params.workout, [route.params.workout]);
  const [currentPlan, setCurrentPlan] = useState<DisplayableWorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (planObjectFromParams) {
          setCurrentPlan(planObjectFromParams);
        } else {
          setError('Workout details not provided.');
          setCurrentPlan(null);
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
  }, [planObjectFromParams]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setCurrentPlan(null);
  };

  const handleExercisePress = (exercise: PlannedExercise) => {
    const exerciseForDetail = {
      ...exercise,
      targetMuscleGroups: exercise.targetMuscleGroups || [],
      equipmentNeeded: exercise.equipmentNeeded || [],
      muscleGroups: exercise.targetMuscleGroups || [],
      equipment: exercise.equipment || exercise.equipmentNeeded?.join(', ') || '',
      description: {
        short: exercise.description || '',
        full: exercise.description || '',
        benefits: [],
        commonMistakes: []
      },
      instructions: exercise.instructions || []
    };
    navigation.navigate('ExerciseDetail', { exercise: exerciseForDetail });
  };

  const handleStartWorkout = () => {
    if (!currentPlan) return;
    
    const workoutPlan = {
      ...currentPlan,
      userId: '',
      isAIgenerated: currentPlan.isAIGenerated || false
    };
    
    navigation.navigate('ActiveWorkout', { plan: workoutPlan });
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.currentColors.background }]}>
        <ActivityIndicator size="large" color={theme.currentColors.primary} />
      </View>
    );
  }

  if (error || !currentPlan) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.currentColors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.currentColors.error} />
        <AppText 
          variant="h2" 
          style={[styles.errorText, { color: theme.currentColors.error }]}
        >
          {error || 'Workout not found'}
        </AppText>
        <NeumorphicButton
          onPress={handleRetry}
          buttonType="secondary"
          neumorphicType="flat"
        >
          <AppText variant="button">Try Again</AppText>
        </NeumorphicButton>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.currentColors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Header */}
        <View style={styles.header}>
          <AppText variant="h1" style={{ color: theme.currentColors.textPrimary }}>
            {currentPlan.planName}
          </AppText>
          
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={20} color={theme.currentColors.primary} />
              <AppText variant="body2" style={{ color: theme.currentColors.textSecondary }}>
                {currentPlan.durationEstimateMinutes || '30'} mins
              </AppText>
            </View>
            
            <View style={styles.metadataItem}>
              <Ionicons name="barbell-outline" size={20} color={theme.currentColors.primary} />
              <AppText variant="body2" style={{ color: theme.currentColors.textSecondary }}>
                {currentPlan.exercises?.length || 0} exercises
              </AppText>
            </View>

            {currentPlan.difficulty && (
              <View style={styles.metadataItem}>
                <Ionicons name="speedometer-outline" size={20} color={theme.currentColors.primary} />
                <AppText variant="body2" style={{ color: theme.currentColors.textSecondary }}>
                  {currentPlan.difficulty}
                </AppText>
              </View>
            )}
          </View>

          {currentPlan.description && (
            <AppText 
              variant="body1" 
              style={[styles.description, { color: theme.currentColors.textSecondary }]}
            >
              {currentPlan.description}
            </AppText>
          )}
        </View>

        {/* Exercises Section */}
        <View style={styles.exercisesSection}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Workout Plan
          </AppText>
          
          {currentPlan.exercises?.map((exercise, index) => (
            <ExerciseCard
              key={`${exercise._id}-${index}`}
              exercise={exercise}
              index={index}
              onPress={() => handleExercisePress(exercise)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Start Workout Button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.currentColors.background }]}>
        <NeumorphicButton
          onPress={handleStartWorkout}
          buttonType="primary"
          neumorphicType="raised"
          containerStyle={styles.startButton}
        >
          <Ionicons name="play" size={24} color="white" style={{ marginRight: 8 }} />
          <AppText variant="button" style={{ color: 'white' }}>
            Start Workout
          </AppText>
        </NeumorphicButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  header: {
    padding: 20,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  description: {
    marginTop: 16,
    lineHeight: 24,
  },
  exercisesSection: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  exerciseCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseMainInfo: {
    flex: 1,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseCardArrow: {
    marginLeft: 8,
  },
  muscleGroupsScroll: {
    marginTop: 12,
  },
  muscleGroupTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});

export default WorkoutDetailScreen; 