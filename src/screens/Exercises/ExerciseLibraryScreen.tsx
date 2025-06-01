import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types'; // Assuming it will be part of WorkoutsStack
import { BaseExercise } from '../Planner/ManualPlanCreatorScreen'; // Re-use BaseExercise type
import { fetchAllIndividualExercises } from '../../api/exerciseService';
import { useAuth } from '../../store/AuthContext';

// Navigation prop for this screen
type ExerciseLibraryNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'ExerciseLibrary'>;

// Section type for SectionList (grouped by exercise.type)
interface ExerciseTypeSection {
  title: string; // Exercise Type (e.g., Strength, Cardio)
  data: BaseExercise[];
}

const ExerciseLibraryScreen = () => {
  const navigation = useNavigation<ExerciseLibraryNavigationProp>();
  const { token } = useAuth();

  const [allExercises, setAllExercises] = useState<BaseExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercises = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchAllIndividualExercises(token);
        if (response.success && response.exercises) {
          setAllExercises(response.exercises);
        } else {
          setError(response.message || 'Failed to load exercises.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    loadExercises();
  }, [token]);

  const exerciseSections = useMemo(() => {
    if (allExercises.length === 0) return [];

    const grouped: { [key: string]: BaseExercise[] } = {};
    allExercises.forEach(exercise => {
      const type = exercise.type || 'Uncategorized'; // Default if type is missing
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(exercise);
    });

    return Object.keys(grouped)
      .map(type => ({
        title: type,
        // Safeguard sorting for exercises: default to empty string if name is missing
        data: grouped[type].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      }))
      // Safeguard sorting for sections: default to empty string if title is missing (though less likely here)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [allExercises]);

  const handleExercisePress = (exercise: BaseExercise) => {
    // Navigate to ExerciseDetailScreen (to be created)
    navigation.navigate('ExerciseDetail', { exercise });
  };

  const renderExerciseItem = ({ item }: { item: BaseExercise }) => (
    <TouchableOpacity onPress={() => handleExercisePress(item)} style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSubDetail}>Category: {item.category} | Difficulty: {item.difficulty}</Text>
        {item.targetMuscleGroups && item.targetMuscleGroups.length > 0 && (
          <Text style={styles.itemSubDetail}>Muscles: {item.targetMuscleGroups.join(', ')}</Text>
        )}
      </View>
      {/* Add an icon or chevron for navigation indication if desired */}
    </TouchableOpacity>
  );

  if (isLoading) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" /></SafeAreaView>;
  }

  if (error) {
    return <SafeAreaView style={styles.centered}><Text style={styles.errorText}>{error}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.screenTitle}>Exercise Library</Text>
      <SectionList
        sections={exerciseSections}
        renderItem={renderExerciseItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={(item, index) => item._id + index.toString()}
        ListEmptyComponent={<View style={styles.centered}><Text>No exercises found.</Text></View>}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Light background for the library
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
    textAlign: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 15,
    color: '#333',
    backgroundColor: '#fff', // White background for title bar
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  listContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600', // Semi-bold for section titles
    color: '#fff', // White text
    backgroundColor: '#007AFF', // Primary app color for section headers
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10, // Space between sections
  },
  itemContainer: {
    backgroundColor: '#fff', // White background for items
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Lighter border for items
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '500', // Medium weight for item names
    color: '#333',
    marginBottom: 5,
  },
  itemSubDetail: {
    fontSize: 14,
    color: '#555', // Slightly darker grey for sub-details
    marginTop: 2,
  },
});

export default ExerciseLibraryScreen; 