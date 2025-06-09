import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../styles/useAppTheme';
import { AppText } from '../../components/AppText';
import { NeumorphicButton } from '../../components/NeumorphicButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BaseExercise } from '../Planner/ManualPlanCreatorScreen';
import { fetchAllExercises } from '../../api/exerciseService';
import { useAuth } from '../../store/AuthContext';

type ExercisePickerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ExercisePicker'>;
type ExercisePickerScreenRouteProp = RouteProp<RootStackParamList, 'ExercisePicker'>;

const ExercisePickerScreen = () => {
  const navigation = useNavigation<ExercisePickerScreenNavigationProp>();
  const route = useRoute<ExercisePickerScreenRouteProp>();
  const theme = useAppTheme();
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<BaseExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<BaseExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<BaseExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{
    type: string[];
    difficulty: string[];
    equipment: string[];
  }>({
    type: [],
    difficulty: [],
    equipment: [],
  });

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [searchQuery, activeFilters, exercises]);

  const loadExercises = async () => {
    if (!token) {
      console.error('No auth token available');
      return;
    }

    try {
      const response = await fetchAllExercises(token);
      if (response.success && response.exercises) {
        const mappedExercises: BaseExercise[] = response.exercises.map(exercise => ({
          _id: exercise._id,
          name: exercise.name,
          type: exercise.type,
          category: exercise.category,
          difficulty: exercise.difficulty,
          targetMuscleGroups: exercise.targetMuscleGroups,
          equipmentNeeded: exercise.equipmentNeeded,
          equipment: exercise.equipmentNeeded?.[0] || 'None',
          description: exercise.description.short,
          videoUrl: exercise.mediaUrls?.video,
          imageUrl: exercise.mediaUrls?.image,
          instructions: exercise.instructions,
        }));
        setExercises(mappedExercises);
        setFilteredExercises(mappedExercises);
      } else {
        console.error('Failed to load exercises:', response.message);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(query) ||
        exercise.type.toLowerCase().includes(query) ||
        exercise.category.toLowerCase().includes(query) ||
        exercise.targetMuscleGroups?.some(muscle => muscle.toLowerCase().includes(query))
      );
    }

    // Apply type filters
    if (activeFilters.type.length > 0) {
      filtered = filtered.filter(exercise => 
        activeFilters.type.includes(exercise.type)
      );
    }

    // Apply difficulty filters
    if (activeFilters.difficulty.length > 0) {
      filtered = filtered.filter(exercise => 
        activeFilters.difficulty.includes(exercise.difficulty)
      );
    }

    // Apply equipment filters
    if (activeFilters.equipment.length > 0) {
      filtered = filtered.filter(exercise => 
        exercise.equipment && activeFilters.equipment.includes(exercise.equipment)
      );
    }

    setFilteredExercises(filtered);
  };

  const toggleFilter = (type: 'type' | 'difficulty' | 'equipment', value: string) => {
    setActiveFilters(prev => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const toggleExerciseSelection = (exercise: BaseExercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(e => e._id === exercise._id);
      if (isSelected) {
        return prev.filter(e => e._id !== exercise._id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleDone = () => {
    if (route.params.fromScreen === 'ManualPlanCreator') {
      navigation.navigate('ManualPlanCreator', {
        preSelectedExercises: selectedExercises,
      });
    }
  };

  const renderExerciseItem = ({ item }: { item: BaseExercise }) => {
    const isSelected = selectedExercises.some(e => e._id === item._id);

    return (
      <TouchableOpacity
        onPress={() => toggleExerciseSelection(item)}
        style={[
          styles.exerciseCard,
          {
            backgroundColor: theme.currentColors.surface,
            borderColor: isSelected ? theme.currentColors.primary : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          },
        ]}
      >
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <AppText variant="h3" style={{ color: theme.currentColors.textPrimary }}>
              {item.name}
            </AppText>
            <AppText variant="caption" style={{ color: theme.currentColors.textSecondary }}>
              {item.type} • {item.difficulty}
            </AppText>
          </View>
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? theme.currentColors.primary : 'transparent',
                  borderColor: isSelected ? theme.currentColors.primary : theme.currentColors.textSecondary,
                },
              ]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
        </View>

        {item.targetMuscleGroups && item.targetMuscleGroups.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.targetMuscleGroups.map((muscle, index) => (
              <View
                key={index}
                style={[
                  styles.tag,
                  { backgroundColor: theme.currentColors.primary + '20' },
                ]}
              >
                <AppText
                  variant="caption"
                  style={{ color: theme.currentColors.primary }}
                >
                  {muscle}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterChip = (
    label: string,
    isActive: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: isActive ? theme.currentColors.primary : theme.currentColors.surface,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: isActive ? 'white' : theme.currentColors.textPrimary,
        }}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.currentColors.background }]}>
        <ActivityIndicator size="large" color={theme.currentColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.currentColors.background }]}>
      <View style={styles.header}>
        <AppText variant="h1" style={[styles.title, { color: theme.currentColors.textPrimary }]}>
          Select Exercises
        </AppText>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.currentColors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search exercises..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.currentColors.surface,
                color: theme.currentColors.textPrimary,
              },
            ]}
            placeholderTextColor={theme.currentColors.textSecondary}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {renderFilterChip(
          'Strength',
          activeFilters.type.includes('Strength'),
          () => toggleFilter('type', 'Strength')
        )}
        {renderFilterChip(
          'Cardio',
          activeFilters.type.includes('Cardio'),
          () => toggleFilter('type', 'Cardio')
        )}
        {renderFilterChip(
          'Flexibility',
          activeFilters.type.includes('Flexibility'),
          () => toggleFilter('type', 'Flexibility')
        )}
        {renderFilterChip(
          'Beginner',
          activeFilters.difficulty.includes('Beginner'),
          () => toggleFilter('difficulty', 'Beginner')
        )}
        {renderFilterChip(
          'Intermediate',
          activeFilters.difficulty.includes('Intermediate'),
          () => toggleFilter('difficulty', 'Intermediate')
        )}
        {renderFilterChip(
          'Advanced',
          activeFilters.difficulty.includes('Advanced'),
          () => toggleFilter('difficulty', 'Advanced')
        )}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.exerciseList}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />

      <View style={styles.bottomBar}>
        <NeumorphicButton
          neumorphicType="pressedIn"
          buttonType="secondary"
          onPress={() => navigation.goBack()}
          containerStyle={[styles.bottomButton, { marginRight: 8 }]}
        >
          <AppText variant="button" style={{ color: theme.currentColors.textSecondary }}>
            Cancel
          </AppText>
        </NeumorphicButton>

        <NeumorphicButton
          neumorphicType="raised"
          buttonType="primary"
          onPress={handleDone}
          containerStyle={[styles.bottomButton, { marginLeft: 8 }]}
        >
          <AppText variant="button" style={{ color: "white", marginRight: 8 }}>
            Add Selected ({selectedExercises.length})
          </AppText>
          <Ionicons name="checkmark" size={20} color="white" />
        </NeumorphicButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 40,
    fontSize: 16,
  },
  filtersContainer: {
    maxHeight: 48,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  exerciseList: {
    padding: 16,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 16,
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 12,
  },
});

export default ExercisePickerScreen; 