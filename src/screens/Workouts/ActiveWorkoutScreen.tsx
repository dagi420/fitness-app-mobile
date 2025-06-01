import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { DisplayableWorkoutPlan } from '../Workouts/WorkoutListScreen';
import { PlannedExercise } from '../Planner/ManualPlanCreatorScreen';

type ActiveWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'ActiveWorkout'>;
type ActiveWorkoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

/**
 * Formats seconds into a MM:SS string.
 * @param seconds - The total seconds to format.
 * @returns A string in MM:SS format.
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const DEFAULT_REST_TIME = 60; // Default 60 seconds rest between sets/exercises if not specified

const ActiveWorkoutScreen = () => {
  const route = useRoute<ActiveWorkoutScreenRouteProp>();
  const navigation = useNavigation<ActiveWorkoutScreenNavigationProp>();
  const { plan } = route.params;

  // --- State Management ---
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1); // Tracks the current set for the exercise
  
  // Timer State
  const [timerValue, setTimerValue] = useState(0); // Current value of the timer in seconds
  const [isTimerActive, setIsTimerActive] = useState(false); // True if the timer is running
  const [isResting, setIsResting] = useState(false); // True if currently in a rest period
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null); // Holds the interval ID for the timer

  // Memoize currentExercise to avoid recalculating on every render unless dependencies change.
  const currentExercise = useMemo(() => {
    if (!plan || !plan.exercises || plan.exercises.length === 0 || currentExerciseIndex >= plan.exercises.length) return null;
    return plan.exercises[currentExerciseIndex];
  }, [plan, currentExerciseIndex]);

  // --- Timer Logic --- 

  /**
   * useEffect hook to manage the countdown timer interval.
   * Runs when `isTimerActive` or `timerValue` changes.
   * Clears interval when timer stops or component unmounts.
   */
  useEffect(() => {
    if (isTimerActive && timerValue > 0) {
      const id = setInterval(() => {
        setTimerValue(prev => prev - 1);
      }, 1000);
      setTimerId(id);
      return () => clearInterval(id); // Cleanup: clear interval when effect reruns or component unmounts
    } else if (isTimerActive && timerValue === 0) {
      // Timer reached zero
      setIsTimerActive(false);
      // Ideally, play a sound notification here
      Alert.alert(isResting ? "Rest Over!" : "Time's Up!", isResting ? "Let's get to the next set/exercise." : "Move to the next step.");
      if (isResting) {
        setIsResting(false); // Automatically end rest period indication
      }
      // Optionally, automatically proceed to next action after timer ends (e.g. if isResting, auto start next set info)
    }
    // Ensure cleanup if timer is stopped prematurely or component unmounts
    return () => {
        if (timerId) clearInterval(timerId);
    };
  }, [isTimerActive, timerValue, isResting]); // isResting added to ensure alert message is correct

  /**
   * Starts the timer with a given duration.
   * @param duration - The duration in seconds for the timer.
   * @param resting - Optional. True if this timer is for a rest period.
   */
  const startTimer = useCallback((duration: number, resting: boolean = false) => {
    if (timerId) clearInterval(timerId); // Clear any existing timer before starting a new one
    setTimerValue(duration);
    setIsResting(resting); // Set resting state based on param
    setIsTimerActive(true);
     // Ideally, play a sound notification for timer start
  }, [timerId]);

  /**
   * Pauses the currently active timer.
   */
  const pauseTimer = useCallback(() => {
    setIsTimerActive(false);
    if (timerId) clearInterval(timerId);
    setTimerId(null);
  }, [timerId]);

  /**
   * Resets the timer. If the current exercise has a duration, resets to that.
   * If currently resting, resets to default rest time.
   * Otherwise, resets to 0.
   */
  const resetTimer = useCallback(() => {
    pauseTimer(); // Ensure timer is stopped and interval cleared
    let newDuration = 0;
    if (isResting) {
      newDuration = DEFAULT_REST_TIME;
    } else if (currentExercise?.planDurationSeconds) {
      newDuration = currentExercise.planDurationSeconds;
    }
    setTimerValue(newDuration);
  }, [pauseTimer, currentExercise, isResting]);
  
  /**
   * useEffect hook to initialize or update the timer when the current exercise changes.
   * Also resets the current set count to 1 for the new exercise.
   * Auto-starts the timer if the new exercise has a defined duration and not in a rest period.
   */
  useEffect(() => {
    if (currentExercise) {
      pauseTimer(); // Stop any previous timer
      setIsResting(false); // Ensure not in rest mode when a new exercise starts
      const exerciseDuration = currentExercise.planDurationSeconds;
      if (exerciseDuration && exerciseDuration > 0) {
        // Exercise has a specific duration, set timer and auto-start
        setTimerValue(exerciseDuration);
        setIsTimerActive(true); // Auto-start for timed exercises
      } else {
        // Rep-based exercise or no duration, timer starts at 0, can be used for manual rest.
        setTimerValue(0);
        setIsTimerActive(false);
      }
      setCurrentSet(1); // Reset current set for the new exercise
    }
  }, [currentExercise, pauseTimer]); // Only depends on currentExercise and pauseTimer callback

  // --- UI Logic & Event Handlers ---

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>Workout plan is invalid or exercise data is missing.</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }
  
  // Calculate total sets for the current exercise, defaulting to 1 if not specified.
  const totalSets = parseInt(currentExercise.planSets || "1", 10);

  /**
   * Handles the main action button press:
   * - If current set < total sets: completes the set, starts rest timer.
   * - If all sets done & more exercises: moves to next exercise.
   * - If all sets done & last exercise: completes workout.
   */
  const handleNextAction = () => {
    pauseTimer(); // Ensure any active timer is stopped before proceeding

    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
      // Start rest timer. This will set isResting to true via startTimer.
      startTimer(DEFAULT_REST_TIME, true); 
      // Ideally, play sound for rest start
      Alert.alert("Set Complete!", `Starting ${DEFAULT_REST_TIME}s rest.`);
    } else {
      // Current exercise fully completed
      setIsResting(false); // Ensure not in rest mode before moving to next exercise
      if (currentExerciseIndex < plan.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        // Timer and set state for the new exercise will be handled by the useEffect hook watching [currentExercise]
        // Ideally, play sound for exercise complete
        Alert.alert("Exercise Complete!", "Moving to the next exercise.");
      } else {
        // All exercises and sets completed - Workout Finished!
        // Ideally, play sound for workout complete
        Alert.alert("Workout Complete!", "Congratulations! You've finished the workout.");
        // TODO: Navigate to a workout summary/results screen or save progress
        navigation.popToTop(); 
      }
    }
  };

  /**
   * Handles navigation to the previous exercise.
   * Pauses any active timer and resets resting state.
   */
  const handlePreviousExercise = () => {
    pauseTimer();
    setIsResting(false); // Not resting when navigating to a previous exercise
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      // Timer and set state for the new (previous) exercise handled by useEffect [currentExercise]
    }
  };

  // --- Render --- 
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.planTitle}>{plan.planName}</Text>
      
      {/* Timer Display and Controls */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timerValue)}</Text>
        <View style={styles.timerControls}>
          {!isTimerActive ? (
            <Button 
              title={timerValue > 0 ? "Resume" : "Start Timer"} 
              onPress={() => startTimer(timerValue > 0 ? timerValue : (currentExercise.planDurationSeconds || DEFAULT_REST_TIME), isResting)} 
              disabled={timerValue === 0 && !currentExercise.planDurationSeconds && !isResting} // Disable if 0 and not timed and not resting
            />
          ) : (
            <Button title="Pause Timer" onPress={pauseTimer} />
          )}
          <Button title="Reset Timer" onPress={resetTimer} />
        </View>
        {isResting && <Text style={styles.restingText}>RESTING...</Text>}
      </View>

      {/* Current Exercise Information */}
      <View style={styles.exerciseInfoContainer}>
        <Text style={styles.exerciseCount}>
          Exercise {currentExerciseIndex + 1} of {plan.exercises.length} (Set {currentSet} of {totalSets})
        </Text>
        <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>
        {currentExercise.planDurationSeconds && <Text style={styles.detailText}>Duration: {formatTime(currentExercise.planDurationSeconds)}</Text>}
        {!currentExercise.planDurationSeconds && currentExercise.planReps && <Text style={styles.detailText}>Reps: {currentExercise.planReps}</Text>}
        {currentExercise.description && <Text style={styles.detailText}>Notes: {currentExercise.description}</Text>}
      </View>

      {/* Placeholder for Exercise Image/Video */}
      <View style={styles.mediaPlaceholder}>
        <Text style={styles.todoText}>[Video/Image Placeholder for {currentExercise.exerciseName}]</Text>
      </View>

      {/* Main Navigation Controls (Previous Exercise, Next Action) */}
      <View style={styles.mainControlsContainer}>
        <Button 
            title="Previous Exercise" 
            onPress={handlePreviousExercise} 
            disabled={currentExerciseIndex === 0 && currentSet === 1} // Disable if first set of first exercise
        />
        <TouchableOpacity style={styles.nextButton} onPress={handleNextAction}>
            <Text style={styles.nextButtonText}>
                {currentSet < totalSets ? `Finish Set ${currentSet}` : (currentExerciseIndex === plan.exercises.length - 1 ? "Finish Workout" : "Finish Exercise")}
            </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10, 
    paddingBottom: 10,
    backgroundColor: '#f4f4f8',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timerText: {
    fontSize: 48, 
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%', // Increased width for better spacing
    marginTop: 5,
  },
  restingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745', // Green color for resting text
    marginTop: 8, // More space
  },
  exerciseInfoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  exerciseCount: {
    fontSize: 13, 
    color: '#666',
    textAlign: 'right',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 20, // Increased size for better readability
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
    textAlign: 'center',
  },
  detailText: {
    fontSize: 16, // Increased size
    marginBottom: 5, // Increased spacing
    color: '#444',
    textAlign: 'center', 
  },
  mediaPlaceholder: {
    flex: 1, // Allow placeholder to take available space
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef', // Light background for placeholder
    borderRadius: 8,
    minHeight: 150, // Minimum height for the placeholder
    marginVertical: 15,
  },
  todoText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888', // Lighter color for placeholder text
  },
  mainControlsContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginTop: 'auto', // Removed to allow media placeholder to push it down
    paddingVertical: 10,
    paddingHorizontal: 5, // Added horizontal padding
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa' 
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15, // Adjusted padding
    borderRadius: 5,
    flex: 0.6, // Adjusted flex to give more space than Previous button
    marginLeft: 10, 
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
});

export default ActiveWorkoutScreen; 