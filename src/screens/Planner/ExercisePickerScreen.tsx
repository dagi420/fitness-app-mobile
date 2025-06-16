import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { Exercise, fetchAllExercises } from '../../api/exerciseService';
import { useAuth } from '../../store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { FilterModal } from '../../components/FilterModal'; // Assuming we extract FilterModal to a reusable component
import { BaseExercise } from './ManualPlanCreatorScreen';

type ExercisePickerNavigationProp = StackNavigationProp<RootStackParamList, 'ExercisePicker'>;
type ExercisePickerRouteProp = RouteProp<RootStackParamList, 'ExercisePicker'>;

const MUSCLE_GROUPS = ['All', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const ExercisePickerCard = ({ item, isSelected, onSelect }: { item: Exercise; isSelected: boolean; onSelect: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onSelect}>
    <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>{item.category || 'N/A'}</Text>
    </View>
    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Ionicons name="checkmark" size={18} color="#191E29" />}
    </View>
  </TouchableOpacity>
);

const ExercisePickerScreen = () => {
  const navigation = useNavigation<ExercisePickerNavigationProp>();
  const route = useRoute<ExercisePickerRouteProp>();
  const { fromScreen } = route.params;
  const { token } = useAuth();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] =useState<Record<string, Exercise>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [filters, setFilters] = useState({
    muscleGroup: 'All',
    difficulty: 'All',
    equipment: 'All',
  });
  
  const equipmentList = useMemo(() => {
      const allEquipment = new Set<string>();
      exercises.forEach(ex => {
          if(ex.equipmentNeeded) {
            ex.equipmentNeeded.forEach(eq => allEquipment.add(eq));
          }
      });
      return Array.from(allEquipment).sort();
  }, [exercises]);
  
  const loadExercises = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAllExercises(token);
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

  useEffect(() => {
    loadExercises();
  }, [token]);

  const handleToggleSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const newSelected = { ...prev };
      if (newSelected[exercise._id]) {
        delete newSelected[exercise._id];
      } else {
        newSelected[exercise._id] = exercise;
      }
      return newSelected;
    });
  };
  
  const handleDone = () => {
      const exercisesToAdd = Object.values(selectedExercises);
      if(exercisesToAdd.length === 0){
          return;
      }
      if(fromScreen === 'ManualPlanCreator'){
          const baseExercises: BaseExercise[] = exercisesToAdd.map(ex => ({
              ...ex,
              description: typeof ex.description === 'string' ? ex.description : ex.description?.short || '',
          }));
          navigation.navigate('ManualPlanCreator', { preSelectedExercises: baseExercises });
      }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesMuscleGroup = filters.muscleGroup === 'All' || exercise.category === filters.muscleGroup;
      const matchesDifficulty = filters.difficulty === 'All' || exercise.difficulty === filters.difficulty;
      const matchesEquipment = filters.equipment === 'All' || (exercise.equipmentNeeded && exercise.equipmentNeeded.includes(filters.equipment));
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMuscleGroup && matchesDifficulty && matchesEquipment && matchesSearch;
    });
  }, [exercises, filters, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.muscleGroup !== 'All') count++;
    if (filters.difficulty !== 'All') count++;
    if (filters.equipment !== 'All') count++;
    return count;
  }, [filters]);
  
  const selectedCount = Object.keys(selectedExercises).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#01D38D" style={{flex: 1}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Exercises</Text>
      </View>

      <View style={styles.searchAndFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0A5B1" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#A0A5B1"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#FFFFFF" />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
       
      {/* Reusing the FilterModal component. We would need to define it in a shared components folder */}
      {/* For this example, let's assume FilterModal exists */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        applyFilters={setFilters}
        initialFilters={filters}
        equipmentList={equipmentList}
        muscleGroups={MUSCLE_GROUPS}
        difficulties={DIFFICULTIES}
      />

      <FlatList
        data={filteredExercises}
        renderItem={({ item }) => (
          <ExercisePickerCard
            item={item}
            isSelected={!!selectedExercises[item._id]}
            onSelect={() => handleToggleSelect(item)}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {selectedCount > 0 && (
        <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Add {selectedCount} Exercise{selectedCount > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 15,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#01D38D',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#191E29',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#A0A5B1',
    fontSize: 14,
    marginTop: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#696E79',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#01D38D',
    borderColor: '#01D38D',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#191E29',
    borderTopWidth: 1,
    borderTopColor: '#2A2D32'
  },
  doneButton: {
    backgroundColor: '#01D38D',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#191E29',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ExercisePickerScreen; 