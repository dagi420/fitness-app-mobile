import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Image,
  StatusBar
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { saveUserWorkoutPlan } from '../../api/planService';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import CustomAlert from '../../components/CustomAlert';

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
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title: string, message: string, buttons: any[], iconName?: keyof typeof Ionicons.glyphMap, iconColor?: string) => {
    setAlertInfo({ visible: true, title, message, buttons, iconName, iconColor });
  };

  useFocusEffect(
    useCallback(() => {
      if (route.params?.preSelectedExercises) {
        const newPlannedExercises: PlannedExercise[] = route.params.preSelectedExercises.map(ex => ({
          ...ex,
          sets: '3',
          reps: '10',
        }));
        setExercisesInPlan(prev => [...prev, ...newPlannedExercises]);
        navigation.setParams({ preSelectedExercises: undefined });
      }
    }, [route.params?.preSelectedExercises])
  );

  const handleAddExercise = () => {
    navigation.navigate('ExercisePicker', { fromScreen: 'ManualPlanCreator' });
  };
  
  const handleRemoveExercise = (index: number) => {
    setExercisesInPlan(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpdateExercise = (index: number, field: 'sets' | 'reps', value: string) => {
    const newExercises = [...exercisesInPlan];
    newExercises[index][field] = value;
    setExercisesInPlan(newExercises);
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      showAlert('Missing Name', 'Please give your workout plan a name.', [{ text: 'OK' }], 'alert-circle-outline', '#FF9F0A');
      return;
    }
    if (exercisesInPlan.length === 0) {
      showAlert('No Exercises', 'Please add at least one exercise to your plan.', [{ text: 'OK' }], 'alert-circle-outline', '#FF9F0A');
      return;
    }
    if (!user || !token) {
      showAlert('Error', 'User not authenticated. Please login again.', [{ text: 'OK' }], 'alert-circle-outline', '#FF6B6B');
      return;
    }

    setIsLoading(true);
    try {
      const response = await saveUserWorkoutPlan(token, {
        userId: user._id,
        planName: planName.trim(),
        exercises: exercisesInPlan,
      });

      if (response.success && response.plan) {
        showAlert('Success!', `Successfully saved ${response.plan.planName}.`, [{ text: 'Great!', onPress: () => navigation.goBack() }], 'checkmark-circle-outline', '#01D38D');
      } else {
        showAlert('Save Failed', response.message || 'Could not save the plan.', [{ text: 'OK' }], 'close-circle-outline', '#FF6B6B');
      }
    } catch (error) {
      console.error('handleSavePlan error:', error);
      showAlert('Error', 'An unexpected error occurred while saving.', [{ text: 'OK' }], 'alert-circle-outline', '#FF6B6B');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<PlannedExercise>) => {
      const index = getIndex();
      return (
        <TouchableOpacity
          style={[styles.exerciseCard, { backgroundColor: isActive ? '#2A2D32' : '#1E2328' }]}
          onLongPress={drag}
          disabled={isActive}
        >
            <View style={styles.cardHeader}>
                <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.exerciseImage} />
                <View style={styles.cardHeaderText}>
                    <Text style={styles.exerciseName} numberOfLines={2}>{item.name}</Text>
                     <Text style={styles.exerciseCategory}>{item.category}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveExercise(index)} style={styles.removeButton}>
                    <Ionicons name="close-circle" size={24} color="#696E79" />
                </TouchableOpacity>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Sets</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="3"
                        placeholderTextColor="#696E79"
                        value={item.sets}
                        onChangeText={text => handleUpdateExercise(index, 'sets', text)}
                        keyboardType="number-pad"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps</Text>
                     <TextInput
                        style={styles.input}
                        placeholder="10"
                        placeholderTextColor="#696E79"
                        value={item.reps}
                        onChangeText={text => handleUpdateExercise(index, 'reps', text)}
                        keyboardType="default"
                    />
                </View>
            </View>
        </TouchableOpacity>
      );
    },
    [exercisesInPlan]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Manual Plan</Text>
      </View>
      
      <DraggableFlatList
        containerStyle={{ flex: 1 }}
        data={exercisesInPlan}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        onDragEnd={({ data }) => setExercisesInPlan(data)}
        ListHeaderComponent={
          <>
            <View style={styles.planNameContainer}>
              <TextInput
                style={styles.planNameInput}
                placeholder="Workout Plan Name"
                placeholderTextColor="#696E79"
                value={planName}
                onChangeText={setPlanName}
              />
            </View>
            <Text style={styles.listHeader}>Exercises</Text>
          </>
        }
        ListFooterComponent={
            <TouchableOpacity style={styles.addExerciseButton} onPress={handleAddExercise}>
                <Ionicons name="add" size={24} color="#01D38D" />
                <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
            </TouchableOpacity>
        }
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="barbell-outline" size={60} color="#2A2D32" />
                <Text style={styles.emptyText}>Your plan is empty</Text>
                <Text style={styles.emptySubText}>Tap 'Add Exercise' to begin building your workout.</Text>
            </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSavePlan} disabled={isLoading}>
            {isLoading ? (
                <ActivityIndicator color="#191E29" />
            ) : (
                <Text style={styles.saveButtonText}>Save Plan</Text>
            )}
        </TouchableOpacity>
      </View>
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        iconName={alertInfo.iconName}
        iconColor={alertInfo.iconColor}
        onClose={() => setAlertInfo(prev => ({ ...prev, visible: false }))}
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
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    planNameContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    planNameInput: {
        backgroundColor: '#1E2328',
        color: '#FFFFFF',
        padding: 18,
        borderRadius: 15,
        fontSize: 18,
        fontWeight: '500'
    },
    listHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    exerciseCard: {
        backgroundColor: '#1E2328',
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    exerciseImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        marginRight: 15,
    },
    cardHeaderText: {
        flex: 1,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    exerciseCategory: {
        color: '#A0A5B1',
        fontSize: 14,
        marginTop: 4,
    },
    removeButton: {
        padding: 5,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    inputGroup: {
        flex: 1,
        marginHorizontal: 5,
    },
    inputLabel: {
        color: '#A0A5B1',
        fontSize: 14,
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#2A2D32',
        color: '#FFFFFF',
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        textAlign: 'center',
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#01D38D20',
        padding: 15,
        borderRadius: 15,
        marginHorizontal: 20,
        marginTop: 10,
    },
    addExerciseButtonText: {
        color: '#01D38D',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 50,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 15,
    },
    emptySubText: {
        color: '#A0A5B1',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#191E29',
        borderTopWidth: 1,
        borderTopColor: '#2A2D32'
    },
    saveButton: {
        backgroundColor: '#01D38D',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#191E29',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ManualPlanCreatorScreen; 