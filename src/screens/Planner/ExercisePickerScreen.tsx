import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Button,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { BaseExercise } from './ManualPlanCreatorScreen'; // Re-use BaseExercise type
import { fetchAllIndividualExercises } from '../../api/exerciseService';
import { useAuth } from '../../store/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons'; // For checkbox icons

type ExercisePickerNavigationProp = StackNavigationProp<RootStackParamList, 'ExercisePicker'>;

interface ExerciseListItemProps {
  item: BaseExercise;
  isSelected: boolean;
  onToggleSelect: (exerciseId: string) => void;
}

// Section type for SectionList
interface ExerciseSection {
  title: string; // Category name
  data: BaseExercise[];
}

const ExerciseListItem: React.FC<ExerciseListItemProps> = React.memo(({ item, isSelected, onToggleSelect }) => {
  return (
    <TouchableOpacity onPress={() => onToggleSelect(item._id)} style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>Type: {item.type} | Difficulty: {item.difficulty} | Category: {item.category}</Text>
        {item.targetMuscleGroups && item.targetMuscleGroups.length > 0 && (
          <Text style={styles.itemDetails}>Muscles: {item.targetMuscleGroups.join(', ')}</Text>
        )}
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
      </View>
      <Ionicons 
        name={isSelected ? 'checkbox' : 'square-outline'} 
        size={24} 
        color={isSelected ? '#007AFF' : '#ccc'} 
      />
    </TouchableOpacity>
  );
});

const ExercisePickerScreen = () => {
  const navigation = useNavigation<ExercisePickerNavigationProp>();
  const { token } = useAuth();
  
  const [allExercises, setAllExercises] = useState<BaseExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Record<string, BaseExercise>>({}); // Store selected by ID for quick lookup
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

  // Memoize the grouped data for SectionList
  const exerciseSections = useMemo(() => {
    if (allExercises.length === 0) return [];
    
    const grouped: { [key: string]: BaseExercise[] } = {};
    allExercises.forEach(exercise => {
      const category = exercise.category || 'Uncategorized'; // Default if category is missing
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(exercise);
    });

    return Object.keys(grouped).map(category => ({
      title: category,
      data: grouped[category],
    })).sort((a, b) => a.title.localeCompare(b.title)); // Sort sections by title

  }, [allExercises]);

  const handleToggleSelect = (exerciseId: string) => {
    setSelectedExercises(prevSelected => {
      const newSelected = { ...prevSelected };
      if (newSelected[exerciseId]) {
        delete newSelected[exerciseId];
      } else {
        const exerciseToAdd = allExercises.find(ex => ex._id === exerciseId);
        if (exerciseToAdd) {
          newSelected[exerciseId] = exerciseToAdd;
        }
      }
      return newSelected;
    });
  };

  const handleDoneSelection = () => {
    const exercisesToReturn = Object.values(selectedExercises);
    if (exercisesToReturn.length === 0) {
      Alert.alert("No Exercises Selected", "Please select at least one exercise.");
      return;
    }
    // Navigate back to ManualPlanCreatorScreen with the selected exercises
    navigation.navigate('ManualPlanCreator', { preSelectedExercises: exercisesToReturn });
  };

  if (isLoading) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" /></SafeAreaView>;
  }

  if (error) {
    return <SafeAreaView style={styles.centered}><Text style={styles.errorText}>{error}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={exerciseSections}
        renderItem={({ item }) => (
          <ExerciseListItem 
            item={item} 
            isSelected={!!selectedExercises[item._id]}
            onToggleSelect={handleToggleSelect}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={(item, index) => item._id + index} // Ensure key is unique if same exercise appears in different hypothetical sections
        ListEmptyComponent={<View style={styles.centered}><Text>No exercises available.</Text></View>}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false} // Or true, depending on preference
      />
      {Object.keys(selectedExercises).length > 0 && (
        <View style={styles.doneButtonContainer}>
          <Button 
            title={`Add ${Object.keys(selectedExercises).length} Exercise(s)`} 
            onPress={handleDoneSelection} 
            color="#007AFF"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
  listContainer: {
    paddingBottom: 70, // Ensure space for the done button if it overlays or is fixed
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderTopWidth: 1,     // Optional: add top border to section headers
    borderTopColor: '#ddd', // Optional
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  itemDescription: {
    fontSize: 12,
    color: '#444',
    marginTop: 5,
    fontStyle: 'italic',
  },
  doneButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#f9f9f9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default ExercisePickerScreen; 