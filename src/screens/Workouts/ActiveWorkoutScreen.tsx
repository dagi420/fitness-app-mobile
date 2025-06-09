import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, Alert, TouchableOpacity, ScrollView, Image, BackHandler, Platform, Modal, TextInput } from 'react-native';
import { RouteProp, useRoute, useNavigation, NavigationAction } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { DisplayableWorkoutPlan } from '../Workouts/WorkoutListScreen';
import { PlannedExercise as ImportedPlannedExercise } from '../Planner/ManualPlanCreatorScreen';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

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
const DEFAULT_EXERCISE_READY_TIME = 3; // 3 seconds countdown before starting a timed exercise

export const WorkoutPhase = {
  NOT_STARTED: 'NOT_STARTED',
  PREPARING: 'PREPARING', // Countdown before a timed exercise or first exercise
  EXERCISING_TIMED: 'EXERCISING_TIMED',
  EXERCISING_REPS: 'EXERCISING_REPS',
  PAUSED: 'PAUSED',
  RESTING_BETWEEN_SETS: 'RESTING_BETWEEN_SETS',
  RESTING_BETWEEN_EXERCISES: 'RESTING_BETWEEN_EXERCISES', // Or after a timed exercise if it's the last set
  COMPLETED_EXERCISE_PENDING_NEXT: 'COMPLETED_EXERCISE_PENDING_NEXT', // After reps, or after timed exercise last set, before moving to next rest/exercise
  WORKOUT_COMPLETE: 'WORKOUT_COMPLETE',
};

const ActiveWorkoutScreen = () => {
  const route = useRoute<ActiveWorkoutScreenRouteProp>();
  const navigation = useNavigation<ActiveWorkoutScreenNavigationProp>();
  const { plan } = route.params;
  const videoRef = useRef<Video>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const previousPhaseRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>(WorkoutPhase.NOT_STARTED);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timerValue, setTimerValue] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [selectedFeedbackReason, setSelectedFeedbackReason] = useState<string | null>(null);
  const [customFeedbackText, setCustomFeedbackText] = useState("");
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);

  const FEEDBACK_REASONS = [
    "Too Hard",
    "Tired",
    "Not Enough Time",
    "Equipment Issue",
    "Other"
  ];

  const currentExercise = useMemo(() => {
    if (!plan || !plan.exercises || plan.exercises.length === 0 || currentExerciseIndex >= plan.exercises.length) return null;
    if (workoutStarted) {
        videoRef.current?.unloadAsync(); 
    }
    return plan.exercises[currentExerciseIndex] as ImportedPlannedExercise; 
  }, [plan, currentExerciseIndex, workoutStarted]);

  useEffect(() => {
    if (workoutStarted && currentExercise?.videoUrl) {
      videoRef.current?.loadAsync({ uri: currentExercise.videoUrl }, {}, false);
    } else if (workoutStarted) {
      videoRef.current?.unloadAsync();
    }
    return () => {
      videoRef.current?.unloadAsync();
    };
  }, [currentExercise, workoutStarted]);

  const startTimer = useCallback((duration: number) => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setTimerValue(duration);
    setIsTimerActive(true);
  }, [setTimerValue, setIsTimerActive]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (isTimerActive && timerValue > 0) {
      timerIdRef.current = setInterval(() => {
        if (isMountedRef.current) setTimerValue(prev => prev - 1);
      }, 1000);
    } else if (isTimerActive && timerValue === 0) {
      if (!isMountedRef.current) return;
      setIsTimerActive(false);

      if (currentPhase === WorkoutPhase.PREPARING) {
        if (currentExercise?.durationSeconds && currentExercise.durationSeconds > 0) {
          setCurrentPhase(WorkoutPhase.EXERCISING_TIMED);
          startTimer(currentExercise.durationSeconds);
        } else {
          setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
          Alert.alert("Start Exercise!", `Perform ${currentExercise?.reps || 'prescribed reps'} of ${currentExercise?.name}.`);
        }
      } else if (currentPhase === WorkoutPhase.RESTING_BETWEEN_SETS) {
        if (!currentExercise) return;
        Alert.alert("Rest Over!", `Prepare for Set ${currentSet} of ${currentExercise.name}.`);
        if (currentExercise.durationSeconds && currentExercise.durationSeconds > 0) {
          setCurrentPhase(WorkoutPhase.PREPARING);
          startTimer(DEFAULT_EXERCISE_READY_TIME);
        } else {
          setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
        }
      } else if (currentPhase === WorkoutPhase.RESTING_BETWEEN_EXERCISES) {
        const nextExerciseIndex = currentExerciseIndex + 1;
        if (nextExerciseIndex >= plan.exercises.length) {
          setCurrentPhase(WorkoutPhase.WORKOUT_COMPLETE);
          Alert.alert("Workout Complete!", "Congratulations! You've finished the workout.");
          if(isMountedRef.current) navigation.popToTop();
        } else {
          setCurrentExerciseIndex(nextExerciseIndex);
          setCurrentSet(1);
          const nextExercise = plan.exercises[nextExerciseIndex] as ImportedPlannedExercise;
          Alert.alert("Rest Over!", `Prepare for ${nextExercise.name}.`);
          if (nextExercise.durationSeconds && nextExercise.durationSeconds > 0) {
            setCurrentPhase(WorkoutPhase.PREPARING);
            startTimer(DEFAULT_EXERCISE_READY_TIME);
          } else {
            setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
          }
        }
      } else if (currentPhase === WorkoutPhase.EXERCISING_TIMED) {
        setCurrentPhase(WorkoutPhase.COMPLETED_EXERCISE_PENDING_NEXT);
        Alert.alert("Time's Up!", `Finished ${currentExercise?.name}. Press 'Next' to continue.`);
      }
    }
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [isTimerActive, timerValue, currentPhase, currentExercise, startTimer, setCurrentPhase, currentExerciseIndex, plan.exercises.length, navigation, currentSet]);

  const pauseTimer = useCallback(() => {
    setIsTimerActive(false);
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, [setIsTimerActive]);

  const resetTimer = useCallback(() => {
    pauseTimer();
    let newDuration = 0;
    if (currentPhase === WorkoutPhase.PREPARING) {
        newDuration = DEFAULT_EXERCISE_READY_TIME;
    } else if (currentPhase === WorkoutPhase.RESTING_BETWEEN_SETS || currentPhase === WorkoutPhase.RESTING_BETWEEN_EXERCISES) {
      newDuration = DEFAULT_REST_TIME;
    } else if (currentPhase === WorkoutPhase.EXERCISING_TIMED && currentExercise?.durationSeconds) {
      newDuration = currentExercise.durationSeconds;
    } else if (currentExercise?.durationSeconds) {
      newDuration = currentExercise.durationSeconds;
    }
    setTimerValue(newDuration);
  }, [pauseTimer, currentExercise, currentPhase, setTimerValue]);

  const initializeFirstExercise = () => {
    if (!isMountedRef.current || !currentExercise) return;
    setCurrentSet(1);
    pauseTimer();
    // Reset feedback states if a new workout is initialized (though unlikely path here)
    setSelectedFeedbackReason(null);
    setCustomFeedbackText("");

    if (currentExercise.durationSeconds && currentExercise.durationSeconds > 0) {
      setCurrentPhase(WorkoutPhase.PREPARING);
      startTimer(DEFAULT_EXERCISE_READY_TIME);
    } else {
      setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
      setTimerValue(0);
      setIsTimerActive(false);
      Alert.alert("Get Ready!", `First exercise: ${currentExercise.name} for ${currentExercise.reps || 'prescribed reps'}.`);
    }
  };

  const handleExitWorkout = () => {
    pauseTimer(); // Pause everything
    Alert.alert(
      "Exit Workout",
      "Are you sure you want to end this workout session?",
      [
        { text: "Cancel", style: "cancel", onPress: () => {
            if (isMountedRef.current && previousPhaseRef.current && previousPhaseRef.current !== WorkoutPhase.PAUSED) {
                 if (timerValue > 0) setIsTimerActive(true); 
            }
        }},
        { text: "Exit & Give Feedback", style: "default", onPress: () => {
            if(isMountedRef.current) setIsFeedbackModalVisible(true);
        }}
      ],
      { cancelable: true }
    );
  };
  
  useEffect(() => {
    const backAction = () => {
      if (currentPhase !== WorkoutPhase.NOT_STARTED && currentPhase !== WorkoutPhase.WORKOUT_COMPLETE) {
        handleExitWorkout();
        return true; // Prevent default behavior
      }
      return false; // Default behavior (exit app or go back)
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [currentPhase, navigation]);

  useEffect(() => {
    if (workoutStarted && currentExercise) {
      // Logic for video loading/unloading moved to currentExercise useMemo/useEffect
    } else if (currentPhase === WorkoutPhase.NOT_STARTED) {
        pauseTimer();
    }
  }, [currentExercise, workoutStarted, pauseTimer, currentPhase]); // currentExerciseIndex, currentSet removed as currentExercise handles it

  const handleStartWorkout = () => {
    if (!isMountedRef.current) return;
    setWorkoutStarted(true); 
    setWorkoutStartTime(Date.now()); // Record start time
    setSelectedFeedbackReason(null);
    setCustomFeedbackText("");
    initializeFirstExercise();
  };

  const handleSelectFeedbackReason = (reason: string) => {
    setSelectedFeedbackReason(reason);
    if (reason !== "Other") {
      setCustomFeedbackText("");
    }
  };

  const handleSubmitFeedback = () => {
    if (!isMountedRef.current) return;
    
    let timeIntoWorkoutSeconds = 0;
    if (workoutStartTime) {
      timeIntoWorkoutSeconds = Math.floor((Date.now() - workoutStartTime) / 1000);
    }

    console.log("Workout Exited. Feedback:", {
      reason: selectedFeedbackReason,
      customText: selectedFeedbackReason === "Other" ? customFeedbackText : undefined,
      exercise: currentExercise?.name,
      set: currentSet,
      plan: plan.planName,
      timeIntoWorkout: `${Math.floor(timeIntoWorkoutSeconds / 60)}m ${timeIntoWorkoutSeconds % 60}s`
    });

    setIsFeedbackModalVisible(false);
    navigation.popToTop();
  };

  const handleSkipFeedback = () => {
    if (!isMountedRef.current) return;
    setIsFeedbackModalVisible(false);
    navigation.popToTop();
  };

  if (!plan || !plan.exercises || plan.exercises.length === 0) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>Workout plan is invalid or has no exercises.</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (currentPhase === WorkoutPhase.NOT_STARTED) {
    const firstExerciseName = plan.exercises[0]?.name || 'Unknown Exercise';
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.planTitleLarge}>{plan.planName}</Text>
        <Ionicons name="barbell-outline" size={80} color="#007AFF" style={{ marginVertical: 30 }} />
        <Text style={styles.readyText}>Get ready for your workout!</Text>
        <Text style={styles.firstExerciseText}>First up: {firstExerciseName}</Text>
        <TouchableOpacity style={styles.startWorkoutButton} onPress={handleStartWorkout}>
          <Text style={styles.startWorkoutButtonText}>Begin Workout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error loading current exercise.</Text>
         <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const totalSets = parseInt(String(currentExercise.sets || "1"), 10);

  const handleNextAction = () => {
    if (!isMountedRef.current) return;
    pauseTimer(); // Pause any active timers before transitioning
    videoRef.current?.pauseAsync();

    const isLastSet = currentSet >= totalSets;
    const isLastExercise = currentExerciseIndex >= plan.exercises.length - 1;

    // Resume from PAUSED state
    if (currentPhase === WorkoutPhase.PAUSED) {
      if (previousPhaseRef.current) {
        setCurrentPhase(previousPhaseRef.current);
        if (timerValue > 0) { // Only resume timer if there's time left
          setIsTimerActive(true);
        }
        previousPhaseRef.current = null; // Clear previous phase
      } else {
        // Fallback if previousPhase is somehow null, go to a sensible default (e.g., first exercise)
        initializeFirstExercise();
      }
      return;
    }

    // Skip PREPARING phase
    if (currentPhase === WorkoutPhase.PREPARING) {
      if (currentExercise?.durationSeconds && currentExercise.durationSeconds > 0) {
        setCurrentPhase(WorkoutPhase.EXERCISING_TIMED);
        startTimer(currentExercise.durationSeconds);
      } else {
        setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
        Alert.alert("Start Exercise!", `Perform ${currentExercise?.reps || 'prescribed reps'} of ${currentExercise?.name}.`);
      }
      return;
    }
    
    // Skip RESTING_BETWEEN_SETS
    if (currentPhase === WorkoutPhase.RESTING_BETWEEN_SETS) {
        if (!currentExercise) return;
        Alert.alert("Skipping Rest!", `Prepare for Set ${currentSet} of ${currentExercise.name}.`); // currentSet is already advanced for next set
        if (currentExercise.durationSeconds && currentExercise.durationSeconds > 0) {
          setCurrentPhase(WorkoutPhase.PREPARING);
          startTimer(DEFAULT_EXERCISE_READY_TIME);
        } else {
          setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
        }
        return;
    }

    // Skip RESTING_BETWEEN_EXERCISES
    if (currentPhase === WorkoutPhase.RESTING_BETWEEN_EXERCISES) {
        const nextExerciseIndex = currentExerciseIndex + 1; // This index should have been set when RESTING_BETWEEN_EXERCISES was entered
        if (nextExerciseIndex < plan.exercises.length) {
            setCurrentExerciseIndex(nextExerciseIndex); // Ensure it's set if not already
            setCurrentSet(1);
            const nextExercise = plan.exercises[nextExerciseIndex] as ImportedPlannedExercise;
            Alert.alert("Skipping Rest!", `Prepare for ${nextExercise.name}.`);
            if (nextExercise.durationSeconds && nextExercise.durationSeconds > 0) {
                setCurrentPhase(WorkoutPhase.PREPARING);
                startTimer(DEFAULT_EXERCISE_READY_TIME);
            } else {
                setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
            }
        } else { // Should not happen if logic is correct, but as a fallback
            setCurrentPhase(WorkoutPhase.WORKOUT_COMPLETE);
            Alert.alert("Workout Complete!", "Congratulations!");
            navigation.popToTop();
        }
        return;
    }

    // Standard advancement logic (after EXERCISING_TIMED, EXERCISING_REPS, or COMPLETED_EXERCISE_PENDING_NEXT)
    if (currentPhase === WorkoutPhase.EXERCISING_TIMED || currentPhase === WorkoutPhase.EXERCISING_REPS) {
      // User explicitly finished a set/exercise (rep based, or timed before timer ran out)
      if (!isLastSet) { 
        setCurrentSet(prev => prev + 1);
        setCurrentPhase(WorkoutPhase.RESTING_BETWEEN_SETS);
        startTimer(DEFAULT_REST_TIME);
        // Alert.alert("Set Complete!", `Starting ${formatTime(DEFAULT_REST_TIME)} rest before Set ${currentSet + 1}.`); // currentSet is not updated yet here
      } else { // Last set of the current exercise is completed
        if (!isLastExercise) { 
          setCurrentPhase(WorkoutPhase.RESTING_BETWEEN_EXERCISES);
          startTimer(DEFAULT_REST_TIME);
          // const nextExercisePreview = plan.exercises[currentExerciseIndex + 1] as ImportedPlannedExercise;
          // Alert.alert("Exercise Complete!", `Rest for ${formatTime(DEFAULT_REST_TIME)} before ${nextExercisePreview?.name || 'the next exercise'}.`);
        } else { // Last set of the last exercise
          setCurrentPhase(WorkoutPhase.WORKOUT_COMPLETE);
          Alert.alert("Workout Complete!", "Congratulations! You've finished the workout.");
          if (isMountedRef.current) navigation.popToTop(); 
          return; // Workout is done, no further action.
        }
      }
      return; // Action handled for EXERCISING_TIMED or EXERCISING_REPS
    } 

    if (currentPhase === WorkoutPhase.COMPLETED_EXERCISE_PENDING_NEXT) {
      // This phase is typically reached after a TIMED exercise's timer runs out.
      // User is now explicitly pressing "Continue Workout" or "Finish Workout".
      if (!isLastExercise || (isLastExercise && !isLastSet)) {
          if(!isLastSet) { 
            setCurrentSet(prev => prev + 1);
            setCurrentPhase(WorkoutPhase.RESTING_BETWEEN_SETS);
            startTimer(DEFAULT_REST_TIME);
            // Alert.alert("Set Ended (Timed)", `Starting ${formatTime(DEFAULT_REST_TIME)} rest before Set ${currentSet + 1}.`);
          } else { 
            // This means the last set of a timed exercise (which is not the overall last exercise) has finished.
            setCurrentPhase(WorkoutPhase.RESTING_BETWEEN_EXERCISES);
            startTimer(DEFAULT_REST_TIME);
            // const nextExercisePreview = plan.exercises[currentExerciseIndex + 1] as ImportedPlannedExercise;
            // Alert.alert("Exercise Ended (Timed)", `Rest for ${formatTime(DEFAULT_REST_TIME)} before ${nextExercisePreview?.name || 'the next exercise'}.`);
          }
      } else { // This means it IS the last set of the last exercise, and its timer ran out.
          setCurrentPhase(WorkoutPhase.WORKOUT_COMPLETE);
          Alert.alert("Workout Complete!", "Congratulations! You've finished the workout.");
          if (isMountedRef.current) navigation.popToTop();
      }
      return;
    }

    // Fallback or other unhandled phases - should ideally not be reached if UI buttons/phases are synced.
    // console.warn("Unhandled phase in handleNextAction:", currentPhase);
  };

  const getNextButtonText = () => {
    if (!currentExercise) return "Next";
    const isLastSet = currentSet >= totalSets;
    const isLastExercise = currentExerciseIndex >= plan.exercises.length - 1;

    switch (currentPhase) {
      case WorkoutPhase.PREPARING:
        return "Skip Prepare";
      case WorkoutPhase.EXERCISING_TIMED:
      case WorkoutPhase.EXERCISING_REPS:
        return isLastSet ? "Finish Exercise" : `Finish Set ${currentSet}`;
      case WorkoutPhase.RESTING_BETWEEN_SETS:
      case WorkoutPhase.RESTING_BETWEEN_EXERCISES:
        return "Skip Rest";
      case WorkoutPhase.PAUSED:
        return "Resume Workout";
      case WorkoutPhase.COMPLETED_EXERCISE_PENDING_NEXT:
        if (isLastSet && isLastExercise) return "Finish Workout";
        // If an exercise (timed) just finished, next action is to start rest or next exercise
        // This could be more specific like "Start Rest" or "Start Next Exercise Prep"
        return "Continue Workout"; 
      case WorkoutPhase.WORKOUT_COMPLETE:
        return "Done"; // Or null/disabled
      default:
        return "Next Action";
    }
  };

  const handlePreviousExercise = () => {
    pauseTimer();
    videoRef.current?.pauseAsync();
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSet(1);
      const prevExercise = plan.exercises[currentExerciseIndex -1] as ImportedPlannedExercise;
       if (prevExercise.durationSeconds && prevExercise.durationSeconds > 0) {
            setCurrentPhase(WorkoutPhase.PREPARING);
            startTimer(DEFAULT_EXERCISE_READY_TIME);
        } else {
            setCurrentPhase(WorkoutPhase.EXERCISING_REPS);
            setTimerValue(0);
            setIsTimerActive(false);
        }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        transparent={true}
        animationType="slide"
        visible={isFeedbackModalVisible}
        onRequestClose={() => {
          // Allow closing with hardware back button on Android, acts like skip
          if(isMountedRef.current) handleSkipFeedback();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why are you stopping?</Text>
            {FEEDBACK_REASONS.map(reason => (
              <TouchableOpacity 
                key={reason} 
                style={[
                  styles.feedbackReasonButton,
                  selectedFeedbackReason === reason && styles.feedbackReasonSelected
                ]} 
                onPress={() => handleSelectFeedbackReason(reason)}
              >
                <Text 
                    style={[
                        styles.feedbackReasonText,
                        selectedFeedbackReason === reason && styles.feedbackReasonTextSelected
                    ]}
                >
                    {reason}
                </Text>
              </TouchableOpacity>
            ))}
            {selectedFeedbackReason === "Other" && (
              <TextInput
                style={styles.feedbackTextInput}
                placeholder="Please specify..."
                value={customFeedbackText}
                onChangeText={setCustomFeedbackText}
                multiline
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.skipButton]} onPress={handleSkipFeedback}>
                <Text style={styles.modalButtonText}>Skip & Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                    styles.modalButton, 
                    styles.submitButton,
                    (!selectedFeedbackReason || (selectedFeedbackReason === "Other" && !customFeedbackText.trim())) && styles.modalButtonDisabled
                ]} 
                onPress={handleSubmitFeedback}
                disabled={!selectedFeedbackReason || (selectedFeedbackReason === "Other" && !customFeedbackText.trim())}
              >
                <Text style={styles.modalButtonText}>Submit & Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.headerControls}> 
            <Text style={styles.planTitle}>{plan.planName}</Text>
            <TouchableOpacity onPress={handleExitWorkout} style={styles.exitButton}>
                <Ionicons name="close-circle-outline" size={30} color="#D32F2F" />
            </TouchableOpacity>
        </View>

        {/* Status Display */}
        <View style={styles.statusDisplayContainer}>
            <Text style={styles.statusText}>
                {currentPhase === WorkoutPhase.PREPARING && `PREPARING: ${currentExercise?.name}`}
                {currentPhase === WorkoutPhase.EXERCISING_TIMED && `EXERCISING: ${currentExercise?.name}`}
                {currentPhase === WorkoutPhase.EXERCISING_REPS && `EXERCISING: ${currentExercise?.name} (Reps)`}
                {currentPhase === WorkoutPhase.RESTING_BETWEEN_SETS && "RESTING (Set)"}
                {currentPhase === WorkoutPhase.RESTING_BETWEEN_EXERCISES && "RESTING (Exercise)"}
                {currentPhase === WorkoutPhase.PAUSED && "WORKOUT PAUSED"}
                {currentPhase === WorkoutPhase.COMPLETED_EXERCISE_PENDING_NEXT && "PENDING NEXT ACTION"}
                {currentPhase === WorkoutPhase.WORKOUT_COMPLETE && "WORKOUT COMPLETE!"}
            </Text>
        </View>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timerValue)}</Text>
          <View style={styles.timerControls}>
            <Button 
              title={
                isTimerActive ? "Pause" :
                currentPhase === WorkoutPhase.PAUSED ? "Resume" :
                currentPhase === WorkoutPhase.EXERCISING_REPS ? "Log Reps (Info)" :
                timerValue > 0 ? "Resume" : // For resuming a non-zero timer that was paused without explicit PAUSED phase
                "Start"
              }
              onPress={() => {
                if (isTimerActive) { // Pausing
                  pauseTimer();
                  if (currentPhase !== WorkoutPhase.PAUSED) { // Avoid double storing if already paused
                    previousPhaseRef.current = currentPhase;
                    setCurrentPhase(WorkoutPhase.PAUSED);
                  }
                } else { // Starting or Resuming
                  if (currentPhase === WorkoutPhase.PAUSED) { // Resuming from explicit PAUSE
                    if (previousPhaseRef.current) {
                      setCurrentPhase(previousPhaseRef.current);
                      if(timerValue > 0) setIsTimerActive(true); // Resume timer only if it has time
                      previousPhaseRef.current = null; 
                    } else { // Fallback if no previous phase, re-initialize (should be rare)
                       initializeFirstExercise(); 
                    }
                  } else if (currentPhase === WorkoutPhase.EXERCISING_REPS) {
                    Alert.alert("Rep-Based Exercise", `Perform ${currentExercise?.reps || 'prescribed reps'} of ${currentExercise?.name}. Press "Finish Set" when done.`);
                  } else { // Starting a new timer (Prepare, Exercise_Timed, Rest)
                    let durationToStart = timerValue;
                    if (durationToStart <= 0) { // If timer was 0, figure out what to start based on current phase
                        if (currentPhase === WorkoutPhase.PREPARING) durationToStart = DEFAULT_EXERCISE_READY_TIME;
                        else if (currentPhase === WorkoutPhase.EXERCISING_TIMED && currentExercise?.durationSeconds) durationToStart = currentExercise.durationSeconds;
                        else if (currentPhase === WorkoutPhase.RESTING_BETWEEN_SETS || currentPhase === WorkoutPhase.RESTING_BETWEEN_EXERCISES) durationToStart = DEFAULT_REST_TIME;
                        // Fallback if somehow timer is 0 in a timed phase without it being PAUSED
                        else if (currentExercise?.durationSeconds && (currentPhase === WorkoutPhase.EXERCISING_TIMED || currentPhase === WorkoutPhase.PREPARING)) durationToStart = currentExercise.durationSeconds; 
                        else durationToStart = DEFAULT_REST_TIME; // Ultimate fallback, should ideally not be hit often
                    }
                    startTimer(durationToStart);
                    // Ensure phase is correctly set if starting a timer from a non-active state (e.g. after reps)
                     if (currentPhase !== WorkoutPhase.PREPARING && currentPhase !== WorkoutPhase.EXERCISING_TIMED && currentPhase !== WorkoutPhase.RESTING_BETWEEN_SETS && currentPhase !== WorkoutPhase.RESTING_BETWEEN_EXERCISES) {
                        // This logic might need refinement based on exact scenario
                        // For example, if COMPLETED_EXERCISE_PENDING_NEXT and user hits start, what should happen?
                        // Defaulting to prepare for current exercise if it's timed
                        if(currentExercise?.durationSeconds && currentPhase !== WorkoutPhase.EXERCISING_TIMED) {
                            setCurrentPhase(WorkoutPhase.PREPARING);
                            startTimer(DEFAULT_EXERCISE_READY_TIME);
                        }
                    }
                  }
                }
              }}
              disabled={
                currentPhase === WorkoutPhase.WORKOUT_COMPLETE || 
                (currentPhase === WorkoutPhase.EXERCISING_REPS && isTimerActive) // Disable if reps and timer somehow active
              } 
            />
            <Button 
                title="Reset Timer" 
                onPress={resetTimer} 
                disabled={currentPhase === WorkoutPhase.WORKOUT_COMPLETE || currentPhase === WorkoutPhase.NOT_STARTED || currentPhase === WorkoutPhase.EXERCISING_REPS }
            />
          </View>
        </View>

        <View style={styles.exerciseInfoContainer}>
          <Text style={styles.exerciseCount}>
            Exercise {currentExerciseIndex + 1} of {plan.exercises.length} (Set {currentSet} of {totalSets})
          </Text>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text> 
          {currentExercise.durationSeconds && <Text style={styles.detailText}>Duration: {formatTime(currentExercise.durationSeconds)}</Text>}
          {!currentExercise.durationSeconds && currentExercise.reps && <Text style={styles.detailText}>Reps: {currentExercise.reps}</Text>}
          {currentExercise.description && <Text style={styles.detailText}>Notes: {currentExercise.description}</Text>}
        </View>

        <View style={styles.mediaContainer}>
          {currentExercise.videoUrl ? (
            <View style={styles.videoPlayerContainer}>
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: currentExercise.videoUrl }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={status => setVideoStatus(() => status)}
                onError={(error) => console.warn("Video Error:", error)}
              />
              <View style={styles.videoControls}>
                <Button 
                  title={videoStatus?.isLoaded && videoStatus.isPlaying ? "Pause Video" : "Play Video"} 
                  onPress={() => 
                    videoStatus?.isLoaded && videoStatus.isPlaying ? videoRef.current?.pauseAsync() : videoRef.current?.playAsync()
                  }
                  disabled={!videoStatus?.isLoaded}
                />
              </View>
            </View>
          ) : currentExercise.imageUrl ? (
            <Image source={{ uri: currentExercise.imageUrl }} style={styles.imageStyle} resizeMode="contain" />
          ) : (
            <View style={styles.mediaPlaceholder}>
              <Text style={styles.todoText}>No video or image available for {currentExercise.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.mainControlsContainer}>
          <Button 
              title="Previous Exercise" 
              onPress={handlePreviousExercise} 
              disabled={currentExerciseIndex === 0 && currentSet === 1 && currentPhase !== WorkoutPhase.PAUSED}
          />
          <TouchableOpacity style={styles.nextButton} onPress={handleNextAction} disabled={currentPhase === WorkoutPhase.WORKOUT_COMPLETE}>
              <Text style={styles.nextButtonText}>
                  {getNextButtonText()}
              </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  scrollContentContainer: {
    paddingBottom: 30,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F7F9',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
  },
  planTitleLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1C1C1E',
  },
  readyText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  firstExerciseText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
  },
  startWorkoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startWorkoutButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  goBackButton: {
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: '#6c757d',
      borderRadius: 5,
  },
  goBackButtonText: {
      color: 'white',
      fontSize: 16,
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
    width: '90%',
    marginTop: 5,
  },
  restingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
    textAlign: 'center',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#444',
    textAlign: 'center', 
  },
  mediaContainer: { 
    minHeight: 220, 
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  videoPlayerContainer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: 'black',
    borderRadius: 8, 
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  imageStyle: {
    width: '95%',
    aspectRatio: 16/9,
    borderRadius: 8,
  },
  mediaPlaceholder: {
    flex: 1, 
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    minHeight: 150, 
  },
  todoText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
  },
  mainControlsContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa' 
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 5,
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
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: 5,
  },
  exitButton: {
    padding: 5,
  },
  statusDisplayContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  // Styles for Feedback Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  feedbackReasonButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  feedbackReasonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  feedbackReasonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  feedbackReasonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  feedbackTextInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1, // Distribute space
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5, // Add some space between buttons
  },
  skipButton: {
    backgroundColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonDisabled: {
    backgroundColor: '#ced4da',
  }
});

export default ActiveWorkoutScreen; 