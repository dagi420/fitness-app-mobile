import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { Exercise, fetchAllExercises, getExerciseThumbnailUrl } from '../../api/exerciseService';
import { useAuth } from '../../store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ExerciseLibraryNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'ExerciseLibrary'>;

const MUSCLE_GROUPS = [
  'All', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio'
];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  applyFilters: (filters: { muscleGroup: string; difficulty: string; equipment: string }) => void;
  initialFilters: { muscleGroup: string; difficulty: string; equipment: string };
  equipmentList: string[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  applyFilters,
  initialFilters,
  equipmentList,
}) => {
  const [muscleGroup, setMuscleGroup] = useState(initialFilters.muscleGroup);
  const [difficulty, setDifficulty] = useState(initialFilters.difficulty);
  const [equipment, setEquipment] = useState(initialFilters.equipment);

  useEffect(() => {
    setMuscleGroup(initialFilters.muscleGroup);
    setDifficulty(initialFilters.difficulty);
    setEquipment(initialFilters.equipment);
  }, [initialFilters]);

  const handleApply = () => {
    applyFilters({ muscleGroup, difficulty, equipment });
    onClose();
  };
  
  const handleReset = () => {
    setMuscleGroup('All');
    setDifficulty('All');
    setEquipment('All');
    applyFilters({ muscleGroup: 'All', difficulty: 'All', equipment: 'All' });
    onClose();
  };

  const renderFilterSection = (title: string, items: string[], selected: string, setSelected: (value: string) => void) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterOptionsContainer}>
        {items.map((item: string) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, selected === item && styles.filterChipActive]}
            onPress={() => setSelected(item)}
          >
            <Text style={[styles.filterChipText, selected === item && styles.filterChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderFilterSection("Muscle Group", MUSCLE_GROUPS, muscleGroup, setMuscleGroup)}
              {renderFilterSection("Difficulty", DIFFICULTIES, difficulty, setDifficulty)}
              {renderFilterSection("Equipment", ['All', ...equipmentList], equipment, setEquipment)}
            </ScrollView>
             <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
            </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const ExerciseCard = ({ item, onPress }: { item: Exercise; onPress: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Image 
      source={{ uri: getExerciseThumbnailUrl(item) }} 
      style={styles.cardImage} 
      resizeMode="cover"
    />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>{item.category || 'N/A'}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.difficultyBadge}>
          <Ionicons name="pulse-outline" size={12} color="#01D38D" />
          <Text style={styles.difficultyText}>{item.difficulty || 'N/A'}</Text>
        </View>
        {item.mediaUrls?.gif && (
          <View style={styles.gifBadge}>
            <Ionicons name="play-circle-outline" size={12} color="#FF6B6B" />
            <Text style={styles.gifText}>GIF</Text>
          </View>
        )}
      </View>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#696E79" />
  </TouchableOpacity>
);

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
    <View style={styles.emptyContainer}>
        <Ionicons name="sad-outline" size={80} color="#696E79" />
        <Text style={styles.emptyTitle}>No Exercises Found</Text>
        <Text style={styles.emptySubtitle}>
            Try adjusting your search or filter.
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#01D38D" />
            <Text style={styles.refreshButtonText}>Tap to Refresh</Text>
        </TouchableOpacity>
    </View>
);

const ExerciseLibraryScreen = () => {
  const navigation = useNavigation<ExerciseLibraryNavigationProp>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [exercises, setExercises] = useState<Exercise[]>([]);
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
      exercises.forEach((ex: Exercise) => {
          if(ex.equipmentNeeded) {
            ex.equipmentNeeded.forEach((eq: string) => allEquipment.add(eq));
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

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise: Exercise) => {
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

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#01D38D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Library</Text>
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

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        applyFilters={setFilters}
        initialFilters={filters}
        equipmentList={equipmentList}
      />

      {error && (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadExercises}>
                <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredExercises}
        renderItem={({ item }: { item: Exercise }) => (
          <ExerciseCard
            item={item}
            onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
          />
        )}
        keyExtractor={(item: Exercise) => item._id}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState onRefresh={loadExercises} />}
      />
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
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterChip: {
    backgroundColor: '#1E2328',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#01D38D',
  },
  filterChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#191E29',
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01D38D20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 10,
  },
  difficultyText: {
    color: '#01D38D',
    fontSize: 12,
    fontWeight: '600',
  },
  gifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 10,
  },
  gifText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
  retryText: {
    color: '#01D38D',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
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
  modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.7)'
  },
  modalContent: {
      backgroundColor: '#1E2328',
      height: '75%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 25,
  },
  filterTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#2A2D32',
  },
  resetButton: {
      backgroundColor: '#2A2D32',
      paddingVertical: 15,
      borderRadius: 15,
      flex: 1,
      marginRight: 10,
      alignItems: 'center',
  },
  resetButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
  applyButton: {
      backgroundColor: '#01D38D',
      paddingVertical: 15,
      borderRadius: 15,
      flex: 2,
      alignItems: 'center',
  },
  applyButtonText: {
      color: '#191E29',
      fontSize: 16,
      fontWeight: 'bold',
  },
});

export default ExerciseLibraryScreen; 