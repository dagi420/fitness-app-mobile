import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { saveUserWorkoutPlan } from '../../api/planService';
import { useAppTheme } from '../../styles/useAppTheme';
import { AppText } from '../../components/AppText';
import { NeumorphicButton } from '../../components/NeumorphicButton';
import Ionicons from '@expo/vector-icons/Ionicons';

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
  const theme = useAppTheme();

  const [planName, setPlanName] = useState('');
  const [exercisesInPlan, setExercisesInPlan] = useState<PlannedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to handle pre-selected exercises if navigated with them
  React.useEffect(() => {
    if (route.params?.preSelectedExercises) {
      const newPlannedExercises: PlannedExercise[] = route.params.preSelectedExercises.map(ex => ({
         ...ex,
      }));
      setExercisesInPlan(prev => [...prev, ...newPlannedExercises]);
      navigation.setParams({ preSelectedExercises: undefined });
    }
  }, [route.params?.preSelectedExercises, navigation]);

  const handleAddExercise = () => {
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
        Alert.alert('Success!', `Successfully saved ${response.plan.planName}.`);
        navigation.goBack();
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
    <View style={[styles.exerciseItemContainer, { backgroundColor: theme.currentColors.surface }]}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseHeaderLeft}>
          <AppText variant="h3" style={{ color: theme.currentColors.textPrimary }}>
            {item.name}
          </AppText>
          <AppText variant="caption" style={{ color: theme.currentColors.textSecondary }}>
            {item.type} • {item.difficulty}
          </AppText>
        </View>
        <TouchableOpacity 
          onPress={() => setExercisesInPlan(prev => prev.filter((_, i) => i !== index))}
          style={styles.removeButton}
        >
          <Ionicons name="close-circle-outline" size={24} color={theme.currentColors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseInputsContainer}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <AppText variant="caption" style={{ color: theme.currentColors.textSecondary }}>
              Sets
            </AppText>
            <TextInput 
              placeholder="e.g., 3"
              value={item.sets}
              onChangeText={text => {
                const newExercises = [...exercisesInPlan];
                newExercises[index].sets = text;
                setExercisesInPlan(newExercises);
              }}
              style={[
                styles.exerciseInput,
                { 
                  backgroundColor: theme.currentColors.background,
                  color: theme.currentColors.textPrimary,
                }
              ]}
              placeholderTextColor={theme.currentColors.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputWrapper}>
            <AppText variant="caption" style={{ color: theme.currentColors.textSecondary }}>
              Reps
            </AppText>
            <TextInput 
              placeholder="e.g., 8-12"
              value={item.reps}
              onChangeText={text => {
                const newExercises = [...exercisesInPlan];
                newExercises[index].reps = text;
                setExercisesInPlan(newExercises);
              }}
              style={[
                styles.exerciseInput,
                { 
                  backgroundColor: theme.currentColors.background,
                  color: theme.currentColors.textPrimary,
                }
              ]}
              placeholderTextColor={theme.currentColors.textSecondary}
            />
          </View>
        </View>
      </View>

      {item.targetMuscleGroups && item.targetMuscleGroups.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.targetMuscleGroups.map((muscle, i) => (
            <View 
              key={i} 
              style={[
                styles.tag,
                { backgroundColor: theme.currentColors.primary + '20' }
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
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.currentColors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <AppText variant="h1" style={[styles.title, { color: theme.currentColors.textPrimary }]}>
          Create Workout Plan
        </AppText>
        
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.currentColors.surface,
              color: theme.currentColors.textPrimary,
            }
          ]}
          placeholder="Enter Plan Name (e.g., My Strength Routine)"
          placeholderTextColor={theme.currentColors.textSecondary}
          value={planName}
          onChangeText={setPlanName}
        />

        <View style={styles.addExerciseContainer}>
          <NeumorphicButton
            neumorphicType="raised"
            buttonType="primary"
            onPress={handleAddExercise}
            containerStyle={styles.addButton}
          >
            <Ionicons 
              name="add-circle-outline" 
              size={24} 
              color="white"
              style={{ marginRight: 8 }}
            />
            <AppText variant="button" style={{ color: "white" }}>
              Add Exercise
            </AppText>
          </NeumorphicButton>
        </View>

        {exercisesInPlan.length > 0 ? (
          <View style={styles.exercisesContainer}>
            <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
              Exercises ({exercisesInPlan.length})
            </AppText>
            <FlatList
              data={exercisesInPlan}
              renderItem={renderExerciseItem}
              keyExtractor={(item, index) => `${item._id}-${index}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            />
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons 
              name="barbell-outline" 
              size={48} 
              color={theme.currentColors.textSecondary} 
            />
            <AppText 
              variant="body1" 
              style={[styles.emptyStateText, { color: theme.currentColors.textSecondary }]}
            >
              No exercises added yet.{'\n'}Tap the button above to add exercises.
            </AppText>
          </View>
        )}
        
        <View style={styles.bottomButtonsContainer}>
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
            onPress={handleSavePlan}
            disabled={isLoading}
            containerStyle={[styles.bottomButton, { marginLeft: 8 }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <AppText variant="button" style={{ color: "white" }}>
                Save Plan
              </AppText>
            )}
          </NeumorphicButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  addExerciseContainer: {
    marginBottom: 24,
  },
  addButton: {
    paddingVertical: 12,
  },
  exercisesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  exerciseItemContainer: {
    borderRadius: 16,
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  removeButton: {
    padding: 4,
  },
  exerciseInputsContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  exerciseInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 16,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 12,
  },
});

export default ManualPlanCreatorScreen; 