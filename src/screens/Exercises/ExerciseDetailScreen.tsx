import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WorkoutsStackParamList } from '../../navigation/types';
import { BaseExercise } from '../Planner/ManualPlanCreatorScreen'; // Re-use BaseExercise type

// Route prop for this screen
type ExerciseDetailRouteProp = RouteProp<WorkoutsStackParamList, 'ExerciseDetail'>;

const ExerciseDetailScreen = () => {
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exercise } = route.params; // The exercise object passed via navigation

  // Placeholder for video/image demonstration
  const renderDemonstration = () => {
    if (exercise.videoUrl) {
      // In a real app, you might use a WebView or a video player component
      return <Text style={styles.detailText}>Video Demo: {exercise.videoUrl} (Placeholder)</Text>;
    }
    if (exercise.imageUrl) {
      return <Image source={{ uri: exercise.imageUrl }} style={styles.image} resizeMode="contain" />;
    }
    return <Text style={styles.detailText}>No demonstration available.</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{exercise.name}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demonstration</Text>
          {renderDemonstration()}
        </View>

        {exercise.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.detailText}>{exercise.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.detailText}>Type: {exercise.type}</Text>
          <Text style={styles.detailText}>Category: {exercise.category}</Text>
          <Text style={styles.detailText}>Difficulty: {exercise.difficulty}</Text>
        </View>

        {exercise.targetMuscleGroups && exercise.targetMuscleGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Muscle Groups</Text>
            <Text style={styles.detailText}>{exercise.targetMuscleGroups.join(', ')}</Text>
          </View>
        )}

        {(exercise.equipmentNeeded && exercise.equipmentNeeded.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Needed</Text>
            <Text style={styles.detailText}>{exercise.equipmentNeeded.join(', ')}</Text>
          </View>
        ) : exercise.equipment ? ( // Fallback for older data structure if equipmentNeeded is empty but equipment exists
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <Text style={styles.detailText}>{exercise.equipment}</Text>
          </View>
        ) : null}

        {exercise.instructions && exercise.instructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {exercise.instructions.map((instruction: string, index: number) => (
              <Text key={index} style={styles.instructionText}>{`${index + 1}. ${instruction}`}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22, // Improved readability
  },
  instructionText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 5,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#eee', // Placeholder background for image
  },
});

export default ExerciseDetailScreen; 