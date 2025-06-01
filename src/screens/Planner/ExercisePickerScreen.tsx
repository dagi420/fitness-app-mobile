import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

const ExerciseListItem: React.FC<ExerciseListItemProps> = React.memo(({ item, isSelected, onToggleSelect }) => {
  return (
    <TouchableOpacity onPress={() => onToggleSelect(item._id)} style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.exerciseName}</Text>
        <Text style={styles.itemDetails}>Type: {item.type} | Difficulty: {item.difficulty}</Text>
        {item.targetMuscleGroups && item.targetMuscleGroups.length > 0 && (
          <Text style={styles.itemDetails}>Muscles: {item.targetMuscleGroups.join(', ')}</Text>
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
      <FlatList
        data={allExercises}
        renderItem={({ item }) => (
          <ExerciseListItem 
            item={item} 
            isSelected={!!selectedExercises[item._id]}
            onToggleSelect={handleToggleSelect}
          />
        )}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<View style={styles.centered}><Text>No exercises available.</Text></View>}
        contentContainerStyle={styles.listContainer}
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
    paddingVertical: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
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
    marginTop: 2,
  },
  doneButtonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
});

export default ExercisePickerScreen; 