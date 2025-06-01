import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { saveUserWorkoutPlan } from '../../api/planService';

// Define Prop types for this screen
type ManualPlanCreatorNavigationProp = StackNavigationProp<RootStackParamList, 'ManualPlanCreator'>;
type ManualPlanCreatorRouteProp = RouteProp<RootStackParamList, 'ManualPlanCreator'>;

// Interface for a general exercise object (as fetched from a future exercises API)
export interface BaseExercise {
  _id: string;
  name: string;
  type: string; // e.g., Strength, Cardio, Flexibility
  category: string; // e.g., Upper Body, Lower Body, Core, Cardio
  difficulty: string; // e.g., Beginner, Intermediate, Advanced
  targetMuscleGroups?: string[];
  equipmentNeeded?: string[];
  equipment?: string;
  description?: string;
  videoUrl?: string;
  imageUrl?: string;
  instructions?: string[];
}

// Interface for an exercise within the plan (extends BaseExercise)
export interface PlannedExercise extends BaseExercise {
  sets?: string;
  reps?: string;
  durationSeconds?: number;
  order?: number;
  // notes?: string;
}

const ManualPlanCreatorScreen = () => {
  const navigation = useNavigation<ManualPlanCreatorNavigationProp>();
  const route = useRoute<ManualPlanCreatorRouteProp>();
  const { user, token } = useAuth();

  const [planName, setPlanName] = useState('');
  const [exercisesInPlan, setExercisesInPlan] = useState<PlannedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to handle pre-selected exercises if navigated with them (e.g., from an exercise picker)
  React.useEffect(() => {
    if (route.params?.preSelectedExercises) {
      // Assuming preSelectedExercises are of type BaseExercise or compatible
      const newPlannedExercises: PlannedExercise[] = route.params.preSelectedExercises.map(ex => ({
         ...ex, // Spread all properties from the selected exercise
         // sets, reps, etc., will be undefined initially or can be defaulted
        }));
      setExercisesInPlan(prev => [...prev, ...newPlannedExercises]);
      navigation.setParams({ preSelectedExercises: undefined });
    }
  }, [route.params?.preSelectedExercises, navigation]);

  const handleAddExercise = () => {
    // Navigate to an Exercise Picker screen
    // Pass the current screen name so ExercisePicker knows where to return results
    navigation.navigate('ExercisePicker', { fromScreen: 'ManualPlanCreator' }); 
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      Alert.alert('Missing Name', 'Please give your workout plan a name.');
      return;
    }
    if (exercisesInPlan.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise to your plan.');
      return;
    }
    if (!user || !token) {
      Alert.alert('Error', 'User not authenticated. Please login again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await saveUserWorkoutPlan(token, { 
        userId: user._id, 
        planName: planName.trim(), 
        exercises: exercisesInPlan 
      });
      
      if (response.success && response.plan) {
        Alert.alert('Plan Saved!', `Successfully saved ${response.plan.planName}.`);
        navigation.goBack(); // Or navigate to a screen showing the plan
      } else {
        Alert.alert('Save Failed', response.message || 'Could not save the plan.');
      }
    } catch (error) {
      console.error('handleSavePlan error:', error); 
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderExerciseItem = ({ item, index }: { item: PlannedExercise, index: number }) => (
    <View style={styles.exerciseItemContainer}>
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text>Type: {item.type} | Difficulty: {item.difficulty}</Text>
      <TextInput 
        placeholder="Sets (e.g., 3)"
        value={item.sets}
        onChangeText={text => {
          const newExercises = [...exercisesInPlan];
          newExercises[index].sets = text;
          setExercisesInPlan(newExercises);
        }}
        style={styles.exerciseInput}
      />
      <TextInput 
        placeholder="Reps (e.g., 8-12)"
        value={item.reps}
        onChangeText={text => {
          const newExercises = [...exercisesInPlan];
          newExercises[index].reps = text;
          setExercisesInPlan(newExercises);
        }}
        style={styles.exerciseInput}
      />
       <Button title="Remove" onPress={() => {
            setExercisesInPlan(prev => prev.filter((_, i) => i !== index));
       }} color="#ff3b30"/>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create New Workout Plan</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter Plan Name (e.g., My Strength Routine)"
          value={planName}
          onChangeText={setPlanName}
        />

        <View style={styles.buttonGroup}>
          <Button title="Add Exercise to Plan" onPress={handleAddExercise} />
        </View>

        <Text style={styles.listHeader}>Exercises in this Plan:</Text>
        {exercisesInPlan.length === 0 ? (
          <Text style={styles.emptyListText}>No exercises added yet.</Text>
        ) : (
          <FlatList
            data={exercisesInPlan}
            renderItem={renderExerciseItem}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            scrollEnabled={false} // If ScrollView is the parent, disable FlatList scroll
          />
        )}
        
        <View style={styles.saveButtonContainer}>
          <Button title={isLoading ? "Saving..." : "Save Plan"} onPress={handleSavePlan} disabled={isLoading} color="#007AFF" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonGroup: {
    marginBottom: 20,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 10,
    marginBottom: 20,
  },
  exerciseItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  exerciseInput: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    fontSize: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButtonContainer: {
    marginTop: 30,
    marginBottom: 20, // Ensure it's visible if content is long
  },
});

export default ManualPlanCreatorScreen; 