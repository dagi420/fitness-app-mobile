import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ImageBackground,
  BackHandler,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { PlannedExercise } from '../Planner/ManualPlanCreatorScreen';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ActiveWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'ActiveWorkout'>;
type ActiveWorkoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const WorkoutPhase = {
  PREPARING: 'PREPARING',
  EXERCISING_TIMED: 'EXERCISING_TIMED',
  EXERCISING_REPS: 'EXERCISING_REPS',
  PAUSED: 'PAUSED',
  RESTING: 'RESTING',
  WORKOUT_COMPLETE: 'WORKOUT_COMPLETE',
};

const ExerciseInfoModal = ({ exercise, visible, onClose }) => {
  if (!exercise) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{exercise.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScrollView}>
          <ImageBackground source={{ uri: exercise.imageUrl }} style={styles.modalImage} />
          <View style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Description</Text>
            <Text style={styles.modalDescription}>{exercise.description}</Text>

            <Text style={styles.modalSectionTitle}>Instructions</Text>
            {exercise.instructions && exercise.instructions.map((instruction, index) => (
              <Text key={index} style={styles.modalInstruction}>
                {`${index + 1}. ${instruction}`}
              </Text>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const ActiveWorkoutScreen = () => {
  const route = useRoute<ActiveWorkoutScreenRouteProp>();
  const navigation = useNavigation<ActiveWorkoutScreenNavigationProp>();
  const { plan } = route.params;
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState(WorkoutPhase.PREPARING);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);

  const [timer, setTimer] = useState(3);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = useRef(3);
  
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  const currentExercise = useMemo(
    () => plan.exercises[currentExerciseIndex] as PlannedExercise,
    [plan.exercises, currentExerciseIndex]
  );
  
  const totalSets = useMemo(() => {
    const sets = parseInt(currentExercise.sets || '1', 10);
    return isNaN(sets) ? 1 : sets;
  }, [currentExercise]);

  const previousPhaseRef = useRef(phase);

  const startTimer = (duration: number) => {
    totalDuration.current = duration;
    setTimer(duration);
    setIsTimerRunning(true);
  };

  const onSetCompleted = () => {
    const isLastSet = currentSet >= totalSets;
    const isLastExercise = currentExerciseIndex >= plan.exercises.length - 1;

    if (isLastSet && isLastExercise) {
        setPhase(WorkoutPhase.WORKOUT_COMPLETE);
        setIsTimerRunning(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        return;
    }

    setPhase(WorkoutPhase.RESTING);
    startTimer(60);
  }

  const onRestCompleted = () => {
      const isLastSet = currentSet >= totalSets;
      
      if (isLastSet) {
          setCurrentExerciseIndex(i => i + 1);
          setCurrentSet(1);
          } else {
          setCurrentSet(s => s + 1);
      }
      setPhase(WorkoutPhase.PREPARING);
      startTimer(3);
  }

  const handleTimerTick = () => {
    setTimer(prev => {
      if (prev <= 1) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsTimerRunning(false);
        handleTimerEnd();
        return 0;
      }
      return prev - 1;
    });
  };

  const handleTimerEnd = () => {
    if (phase === WorkoutPhase.PREPARING) {
      if (currentExercise.durationSeconds && currentExercise.durationSeconds > 0) {
        setPhase(WorkoutPhase.EXERCISING_TIMED);
        startTimer(currentExercise.durationSeconds);
      } else {
        setPhase(WorkoutPhase.EXERCISING_REPS);
      }
    } else if (phase === WorkoutPhase.EXERCISING_TIMED) {
      onSetCompleted();
    } else if (phase === WorkoutPhase.RESTING) {
      onRestCompleted();
    }
  };
  
  const handleNextPress = () => {
    if (phase === WorkoutPhase.EXERCISING_REPS) {
       onSetCompleted();
    } else if (phase === WorkoutPhase.RESTING) {
       if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
       setIsTimerRunning(false);
       onRestCompleted();
    }
  };

  const handlePreviousPress = () => {
    if (currentExerciseIndex > 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsTimerRunning(false);
      setCurrentExerciseIndex(prev => prev - 1);
    setCurrentSet(1);
      setPhase(WorkoutPhase.PREPARING);
      startTimer(3);
    }
  };

  const handlePausePress = () => {
    if (isTimerRunning) {
      previousPhaseRef.current = phase;
      setPhase(WorkoutPhase.PAUSED);
      setIsTimerRunning(false);
    }
  };
  
  const handlePlayPress = () => {
     if (phase === WorkoutPhase.PAUSED) {
        setPhase(previousPhaseRef.current);
     }
     if(timer > 0) setIsTimerRunning(true);
  };

  const handleExitWorkout = () => {
    setIsTimerRunning(false);
    Alert.alert(
      "End Workout",
      "Are you sure you want to quit this workout?",
      [
        { text: "Resume", style: "cancel", onPress: handlePlayPress },
        {
          text: "End Workout",
          style: "destructive",
          onPress: () => navigation.popToTop(),
        },
      ],
      { cancelable: false }
    );
  };
  
  useEffect(() => {
    startTimer(3); // Initial 3s prep time
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(handleTimerTick, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);
  
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExitWorkout();
      return true;
    });
    return () => backHandler.remove();
  }, [handleExitWorkout]);

  const getTintColor = () => {
    switch (phase) {
      case WorkoutPhase.PREPARING:
        return '#FFC300'; // Yellow
      case WorkoutPhase.EXERCISING_TIMED:
      case WorkoutPhase.EXERCISING_REPS:
        return '#01D38D'; // Green
      case WorkoutPhase.RESTING:
        return '#3B82F6'; // Blue
      case WorkoutPhase.PAUSED:
        return '#A0A5B1'; // Grey
      default:
        return '#01D38D';
    }
  };

  const renderContent = () => {
    if (phase === WorkoutPhase.WORKOUT_COMPLETE) {
      return (
        <View style={styles.centeredContent}>
          <Ionicons name="trophy" size={100} color="#01D38D" />
          <Text style={styles.mainText}>Workout Complete!</Text>
          <Text style={styles.subText}>Great job! You've earned it.</Text>
          <TouchableOpacity
            style={styles.fullWidthButton}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.fullWidthButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const progress = totalDuration.current > 0 ? (timer / totalDuration.current) * 100 : 0;
    const isTimedExercise = phase === WorkoutPhase.EXERCISING_TIMED;
    const isResting = phase === WorkoutPhase.RESTING;
    const isPreparing = phase === WorkoutPhase.PREPARING;
    const isRepsExercise = phase === WorkoutPhase.EXERCISING_REPS;
    const isPaused = phase === WorkoutPhase.PAUSED;

    let phaseText = "GET READY";
    if (isTimedExercise) phaseText = "WORK";
    if (isResting) phaseText = "REST";
    if (isRepsExercise) phaseText = `SET ${currentSet} / ${totalSets}`;
    if (isPaused) phaseText = "PAUSED";

  return (
       <View style={styles.content}>
        <View style={styles.progressContainer}>
            <AnimatedCircularProgress
              size={280}
              width={20}
              fill={isRepsExercise ? 100 : progress}
              tintColor={getTintColor()}
              backgroundColor="#1E2328"
              rotation={0}
              lineCap="round"
            >
              {() => (
                <View style={styles.timerContent}>
                  <Text style={styles.timerPhaseText}>{phaseText}</Text>
                  {isRepsExercise ? (
                     <Text style={styles.timerRepsText}>{currentExercise.reps}</Text>
                  ) : (
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                  )}
                  <Text style={styles.timerSubText}>{isRepsExercise ? "REPS" : "REMAINING"}</Text>
            </View>
              )}
            </AnimatedCircularProgress>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity 
             style={styles.iconButton} 
             onPress={handlePreviousPress} 
             disabled={currentExerciseIndex === 0}
          >
              <Ionicons name="play-skip-back" size={32} color={currentExerciseIndex === 0 ? "#696E79" : "#FFFFFF"} />
          </TouchableOpacity>
          
          {(isTimerRunning && !isRepsExercise) ? (
            <TouchableOpacity style={[styles.mainControlButton, styles.pauseButton]} onPress={handlePausePress}>
              <Ionicons name="pause" size={40} color="#191E29" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.mainControlButton, styles.playButton]} onPress={handlePlayPress} disabled={isRepsExercise}>
              <Ionicons name="play" size={40} color={isRepsExercise ? "#696E79" : "#191E29"} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleNextPress} 
            disabled={!isRepsExercise && !isResting}
          >
             <Ionicons name="play-skip-forward" size={32} color={(isRepsExercise || isResting) ? "#FFFFFF" : "#696E79"} />
          </TouchableOpacity>
        </View>
       </View>
    )
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
       <ExerciseInfoModal 
        exercise={currentExercise}
        visible={isInfoModalVisible}
        onClose={() => setIsInfoModalVisible(false)}
      />
      <ImageBackground
        source={{ uri: currentExercise.imageUrl }}
        style={styles.background}
        blurRadius={15}
      >
        <View style={styles.overlay} />
        <View style={styles.header}>
            <TouchableOpacity onPress={handleExitWorkout}>
                <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.exerciseTitleContainer}>
              <Text style={styles.exerciseName} numberOfLines={1}>{currentExercise.name}</Text>
              <Text style={styles.setCounter}>
                Set {currentSet} of {totalSets}
              </Text>
            </View>
          <TouchableOpacity onPress={() => setIsInfoModalVisible(true)}>
            <Ionicons name="information-circle-outline" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {renderContent()}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 30, 41, 0.85)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  exerciseTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  setCounter: {
    color: '#A0A5B1',
    fontSize: 18,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  progressContainer: {
    marginBottom: 60,
  },
  timerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  timerPhaseText: {
    color: '#A0A5B1',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 10,
  },
   timerRepsText: {
    color: '#FFFFFF',
    fontSize: 80,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  timerSubText: {
    color: '#A0A5B1',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mainControlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#01D38D',
  },
  pauseButton: {
    backgroundColor: '#FF6B6B',
  },
  iconButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  mainText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subText: {
    color: '#A0A5B1',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  fullWidthButton: {
    backgroundColor: '#01D38D',
    width: '100%',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  fullWidthButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScrollView: {
    paddingBottom: 40,
  },
  modalImage: {
    width: '100%',
    height: 250,
    marginBottom: 20,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  modalSectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalDescription: {
    color: '#A0A5B1',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  modalInstruction: {
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 10,
  },
});

export default ActiveWorkoutScreen; 