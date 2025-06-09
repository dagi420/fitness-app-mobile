import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { BaseExercise } from '../Planner/ManualPlanCreatorScreen';
import { fetchAllIndividualExercises } from '../../api/exerciseService';
import { ExerciseDetail } from '../../api/workoutService';
import { useAuth } from '../../store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../styles/useAppTheme';

const { width } = Dimensions.get('window');

type ExerciseLibraryNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'ExerciseLibrary'>;

// Define muscle groups for the filter
const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Full Body',
  'Cardio'
] as const;

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

const ExerciseLibraryScreen = () => {
  const navigation = useNavigation<ExerciseLibraryNavigationProp>();
  const { token } = useAuth();
  const theme = useAppTheme();

  const [exercises, setExercises] = useState<BaseExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<typeof MUSCLE_GROUPS[number]>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<typeof DIFFICULTIES[number]>('All');

  useEffect(() => {
    loadExercises();
  }, [token]);

  const loadExercises = async () => {
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchAllIndividualExercises(token);
      if (response.success && response.exercises) {
        setExercises(response.exercises);
      } else {
        setError(response.message || 'Failed to load exercises');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesMuscleGroup = selectedMuscleGroup === 'All' || 
        exercise.targetMuscleGroups?.includes(selectedMuscleGroup);
      const matchesDifficulty = selectedDifficulty === 'All' || 
        exercise.difficulty === selectedDifficulty;
      return matchesMuscleGroup && matchesDifficulty;
    });
  }, [exercises, selectedMuscleGroup, selectedDifficulty]);

  const renderMuscleGroupFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {MUSCLE_GROUPS.map((group) => (
        <TouchableOpacity
          key={group}
          style={[
            styles.filterButton,
            selectedMuscleGroup === group && styles.filterButtonActive,
            { backgroundColor: theme.currentColors.surface }
          ]}
          onPress={() => setSelectedMuscleGroup(group)}
        >
          <Text 
            style={[
              styles.filterButtonText,
              selectedMuscleGroup === group && styles.filterButtonTextActive,
              { color: selectedMuscleGroup === group ? theme.currentColors.primary : theme.currentColors.textSecondary }
            ]}
          >
            {group}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDifficultyFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {DIFFICULTIES.map((difficulty) => (
        <TouchableOpacity
          key={difficulty}
          style={[
            styles.filterButton,
            selectedDifficulty === difficulty && styles.filterButtonActive,
            { backgroundColor: theme.currentColors.surface }
          ]}
          onPress={() => setSelectedDifficulty(difficulty)}
        >
          <Text 
            style={[
              styles.filterButtonText,
              selectedDifficulty === difficulty && styles.filterButtonTextActive,
              { color: selectedDifficulty === difficulty ? theme.currentColors.primary : theme.currentColors.textSecondary }
            ]}
          >
            {difficulty}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderExerciseCard = ({ item }: { item: BaseExercise }) => (
    <TouchableOpacity
      style={[styles.exerciseCard, { backgroundColor: theme.currentColors.surface }]}
      onPress={() => {
        const exerciseDetail: ExerciseDetail = {
          _id: item._id,
          name: item.name,
          description: item.description || '',
          muscleGroups: item.targetMuscleGroups || [],
          equipment: item.equipment,
          difficulty: item.difficulty as "Beginner" | "Intermediate" | "Advanced" | undefined,
          instructions: item.instructions,
          imageUrl: item.imageUrl,
          videoUrl: item.videoUrl
        };
        navigation.navigate('ExerciseDetail', { exercise: exerciseDetail });
      }}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.exerciseImage} />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: theme.currentColors.border }]}>
          <Ionicons name="barbell-outline" size={40} color={theme.currentColors.textSecondary} />
        </View>
      )}
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, { color: theme.currentColors.textPrimary }]}>
          {item.name}
        </Text>
        <Text style={[styles.exerciseDetail, { color: theme.currentColors.textSecondary }]}>
          {item.targetMuscleGroups?.join(', ')}
        </Text>
        <View style={styles.exerciseMetadata}>
          <Text style={[styles.exerciseMetadataText, { color: theme.currentColors.textSecondary }]}>
            {item.difficulty}
          </Text>
          {item.equipment && (
            <Text style={[styles.exerciseMetadataText, { color: theme.currentColors.textSecondary }]}>
              • {item.equipment}
            </Text>
          )}
        </View>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={24} 
        color={theme.currentColors.textSecondary} 
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.currentColors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: theme.currentColors.error }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.currentColors.primary }]}
          onPress={loadExercises}
        >
          <Text style={[styles.retryButtonText, { color: theme.currentColors.surface }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.currentColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.currentColors.textPrimary }]}>
          Exercise Library
        </Text>
      </View>
      
      <View style={styles.filtersSection}>
        {renderMuscleGroupFilter()}
        {renderDifficultyFilter()}
      </View>

      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.exerciseList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons 
              name="fitness-outline" 
              size={48} 
              color={theme.currentColors.textSecondary} 
            />
            <Text style={[styles.emptyStateText, { color: theme.currentColors.textSecondary }]}>
              No exercises found for selected filters
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtersSection: {
    paddingVertical: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    fontWeight: '600',
  },
  exerciseList: {
    padding: 16,
  },
  exerciseCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMetadataText: {
    fontSize: 12,
    marginRight: 8,
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseLibraryScreen; 