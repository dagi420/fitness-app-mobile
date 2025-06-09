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
import { RootStackParamList, WorkoutsStackParamList } from '../../navigation/types';
import { PlannedExercise } from '../Planner/ManualPlanCreatorScreen';
import { Ionicons } from '@expo/vector-icons';

// Define a unified type for items that WorkoutCard can display
export interface DisplayableWorkoutPlan extends Omit<UserWorkoutPlan, 'userId' | 'isAIgenerated'> {
  description?: string;
  type?: string;
  difficulty?: string;
  durationEstimateMinutes?: number;
  isAIGenerated?: boolean;
}

// Define navigation prop type for this screen
type WorkoutListNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutList'>;

// Basic Card component for displaying a workout
const WorkoutCard: React.FC<{ workout: DisplayableWorkoutPlan; onPress: () => void }> = ({ workout, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{workout.planName || (workout as any).name}</Text>
        {workout.isAIGenerated && (
            <Ionicons name="sparkles-outline" size={20} color={styles.aiIcon.color} style={styles.aiIcon} />
        )}
    </View>
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

const SectionTitleWithIcon: React.FC<{ title: string }> = ({ title }) => {
    let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'list-outline';
    let iconColor = '#495057';

    if (title === 'AI Generated Plans') {
        iconName = 'bulb-outline';
        iconColor = '#28a745';
    } else if (title === 'My Custom Plans') {
        iconName = 'person-circle-outline';
        iconColor = '#007bff';
    } else if (title === 'Featured Workouts') {
        iconName = 'star-outline';
        iconColor = '#ffc107';
    }

    return (
        <View style={styles.sectionHeaderContainer}>
            <Ionicons name={iconName} size={24} color={iconColor} style={styles.sectionHeaderIcon} />
            <Text style={[styles.sectionHeader, { color: iconColor }]}>{title}</Text>
        </View>
    );
};

const WorkoutListScreen = () => {
  const { user, token } = useAuth();
  const navigation = useNavigation<WorkoutListNavigationProp>();

  const [sections, setSections] = useState<Array<{ title: string; data: DisplayableWorkoutPlan[]; isAIGenerated?: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mapWorkoutToDisplayablePlan = (workout: Workout): DisplayableWorkoutPlan => ({
    _id: workout._id,
    planName: workout.name,
    exercises: workout.exercises.map((ex: ExerciseDetail, index: number): PlannedExercise => ({
        _id: ex._id || `${workout._id}_ex_${index}`,
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
    })),
    description: workout.description,
    type: workout.type,
    difficulty: workout.difficulty,
    durationEstimateMinutes: workout.durationEstimateMinutes,
    createdAt: (workout as any).createdAt || new Date().toISOString(), 
    updatedAt: (workout as any).updatedAt || new Date().toISOString(), 
    isAIGenerated: false,
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

      const loadedSectionsData: { [key: string]: DisplayableWorkoutPlan[] } = {
        ai: [],
        custom: [],
        featured: []
      };

      if (userPlansResponse.success && userPlansResponse.plans) {
        userPlansResponse.plans.forEach(p => {
          const displayablePlan: DisplayableWorkoutPlan = {
            ...p,
            isAIGenerated: p.isAIgenerated,
          };
          if (p.isAIgenerated) {
            loadedSectionsData.ai.push(displayablePlan);
          } else {
            loadedSectionsData.custom.push(displayablePlan);
          }
        });
      }

      if (generalWorkoutsResponse.success && generalWorkoutsResponse.workouts) {
        generalWorkoutsResponse.workouts.forEach(w => {
            loadedSectionsData.featured.push(mapWorkoutToDisplayablePlan(w));
        });
      }
      
      const finalSections = [];
      if (loadedSectionsData.ai.length > 0) {
        finalSections.push({ title: 'AI Generated Plans', data: loadedSectionsData.ai, isAIGenerated: true });
      }
      if (loadedSectionsData.custom.length > 0) {
        finalSections.push({ title: 'My Custom Plans', data: loadedSectionsData.custom, isAIGenerated: false });
      }
      if (loadedSectionsData.featured.length > 0) {
        finalSections.push({ title: 'Featured Workouts', data: loadedSectionsData.featured, isAIGenerated: false });
      }
      
      setSections(finalSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      if(!refresh) setIsLoading(false);
      if(refresh) setIsRefreshing(false);
    }
  }, [token, user?._id, mapWorkoutToDisplayablePlan]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAllData(true);
  };

  const handleWorkoutPress = (plan: DisplayableWorkoutPlan) => {
    if (plan._id) {
        navigation.navigate('WorkoutDetail', { workout: plan });
    } else {
        Alert.alert("Error", "Workout data is incomplete.");
    }
  };

  if (isLoading && sections.length === 0) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item._id + index + item.planName}
        renderItem={({ item }) => (
            <WorkoutCard workout={item} onPress={() => handleWorkoutPress(item)} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <SectionTitleWithIcon title={title} />
        )}
        ListEmptyComponent={
            !isLoading ? (
                <View style={styles.centeredMessageContainer}>
                    <Ionicons name="sad-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyStateText}>No Workouts Yet!</Text>
                    <Text style={styles.infoText}>
                        Create a custom plan, generate one with AI, or check back later for featured workouts.
                    </Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.refreshButtonEmptyState}>
                        <Ionicons name="refresh-outline" size={20} color="#007AFF" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : null
        }
        contentContainerStyle={sections.length === 0 ? styles.centered : styles.listContainer}
        ListHeaderComponent={<Text style={styles.mainTitle}>Your Workouts</Text>}
        stickySectionHeadersEnabled={false}
        refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#007AFF"]} tintColor="#007AFF"/>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F7F9',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 5,
    color: '#1C1C1E',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionHeaderIcon: {
    marginRight: 10,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoText: {
    color: '#777',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  refreshButtonEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderColor: '#007AFF',
    borderWidth: 1,
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    marginHorizontal: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#0A7AFF',
    flex: 1,
  },
  aiIcon: {
    marginLeft: 8,
    color: '#FFC107',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 6,
  },
  cardDuration: {
    fontSize: 13,
    color: '#6C6C70',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 10,
    lineHeight: 20,
  },
  cardExerciseCount: {
    fontSize: 13,
    color: '#0A7AFF',
    marginTop: 8,
    fontWeight: '500',
  }
});

export default WorkoutListScreen; 