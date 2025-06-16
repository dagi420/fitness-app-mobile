import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList, AIWorkoutConfigData } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

type AIWorkoutConfigurationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AIWorkoutConfigurationScreen'>;
type AIWorkoutConfigurationScreenRouteProp = RouteProp<RootStackParamList, 'AIWorkoutConfigurationScreen'>;

const fitnessGoals = ['Strength Building', 'Muscle Gain', 'Weight Loss', 'Endurance', 'General Fitness'];
const fitnessLevels = ['Beginner', 'Intermediate', 'Advanced'];
const workoutTypes = ['Full Body', 'Upper Body', 'Lower Body', 'Core Focus', 'Cardio'];
const equipmentOptions = ['Bodyweight', 'Dumbbells', 'Resistance Bands', 'Pull-up Bar', 'Bench', 'Full Gym'];

const toValidGender = (gender: string | undefined): AIWorkoutConfigData['gender'] => {
    switch (gender) {
        case 'male':
        case 'female':
        case 'other':
            return gender;
        default:
            return 'not_specified';
    }
};

const Section = ({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const SingleSelectGroup = ({ options, selected, onSelect }) => (
    <View style={styles.optionContainer}>
        {options.map(option => (
            <TouchableOpacity
                key={option}
                style={[styles.optionChip, selected === option && styles.optionChipSelected]}
                onPress={() => onSelect(option)}
            >
                <Text style={[styles.optionText, selected === option && styles.optionTextSelected]}>
                    {option}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

const MultiSelectGroup = ({ options, selected, onToggle }) => (
     <View style={styles.optionContainer}>
        {options.map(option => (
            <TouchableOpacity
                key={option}
                style={[styles.optionChip, selected.includes(option) && styles.optionChipSelected]}
                onPress={() => onToggle(option)}
            >
                <Text style={[styles.optionText, selected.includes(option) && styles.optionTextSelected]}>
                    {option}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);


const AIWorkoutConfigurationScreen = () => {
  const navigation = useNavigation<AIWorkoutConfigurationScreenNavigationProp>();
  const route = useRoute<AIWorkoutConfigurationScreenRouteProp>();
  const { user } = useAuth();

  const [fitnessGoal, setFitnessGoal] = useState('General Fitness');
  const [fitnessLevel, setFitnessLevel] = useState('Beginner');
  const [workoutType, setWorkoutType] = useState('Full Body');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Bodyweight']);
  const [timePerSession, setTimePerSession] = useState(45);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEquipmentToggle = (value: string) => {
    setSelectedEquipment(prev => {
        const isSelected = prev.includes(value);
        if (value === 'Bodyweight') {
             return isSelected && prev.length > 1 ? prev.filter(item => item !== 'Bodyweight') : ['Bodyweight'];
        }
        
        const otherSelections = prev.filter(item => item !== 'Bodyweight');
        if(isSelected) {
            const newSelection = otherSelections.filter(item => item !== value);
            return newSelection.length === 0 ? ['Bodyweight'] : newSelection;
        } else {
            return [...otherSelections, value];
        }
    });
  };

  const handleSubmit = async () => {
    if (!fitnessGoal || !fitnessLevel || !workoutType || selectedEquipment.length === 0) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const config: AIWorkoutConfigData = {
      fitnessGoal,
      fitnessLevel,
      workoutTypePreferences: workoutType,
      availableEquipment: selectedEquipment,
      timePerSession,
      workoutsPerWeek,
      gender: toValidGender(user?.profile?.gender),
    };

    setIsSubmitting(true);
    try {
      await route.params.onSubmit(config);
    } catch (error) {
      console.error('Error submitting workout configuration:', error);
      Alert.alert('Error', 'An error occurred while generating your workout plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Configure AI Workout</Text>
        </View>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <Section title="What's your main fitness goal?">
                <SingleSelectGroup options={fitnessGoals} selected={fitnessGoal} onSelect={setFitnessGoal} />
            </Section>

            <Section title="What's your current fitness level?">
                <SingleSelectGroup options={fitnessLevels} selected={fitnessLevel} onSelect={setFitnessLevel} />
            </Section>
            
            <Section title="Any preferred workout type?">
                <SingleSelectGroup options={workoutTypes} selected={workoutType} onSelect={setWorkoutType} />
            </Section>
            
            <Section title="What equipment do you have?">
                <MultiSelectGroup options={equipmentOptions} selected={selectedEquipment} onToggle={handleEquipmentToggle} />
            </Section>

            <Section title={`How much time per session? (~${timePerSession} mins)`}>
                <Slider
                    style={styles.slider}
                    minimumValue={15}
                    maximumValue={120}
                    step={15}
                    value={timePerSession}
                    onValueChange={setTimePerSession}
                    minimumTrackTintColor="#01D38D"
                    maximumTrackTintColor="#2A2D32"
                    thumbTintColor="#FFFFFF"
                />
            </Section>
            
             <Section title={`How many workouts per week? (${workoutsPerWeek} times)`}>
                <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={7}
                    step={1}
                    value={workoutsPerWeek}
                    onValueChange={setWorkoutsPerWeek}
                    minimumTrackTintColor="#01D38D"
                    maximumTrackTintColor="#2A2D32"
                    thumbTintColor="#FFFFFF"
                />
            </Section>
            <View style={{height: 120}} />
        </ScrollView>
        <View style={styles.footer}>
            <TouchableOpacity style={styles.generateButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                    <ActivityIndicator color="#191E29" />
                ) : (
                    <Text style={styles.generateButtonText}>Generate Plan</Text>
                )}
            </TouchableOpacity>
        </View>
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
    scrollContainer: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 15,
    },
    optionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionChip: {
        backgroundColor: '#1E2328',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2A2D32',
    },
    optionChipSelected: {
        backgroundColor: '#01D38D',
        borderColor: '#01D38D',
    },
    optionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#191E29',
    },
    slider: {
        width: '100%',
        height: 40,
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
    generateButton: {
        backgroundColor: '#01D38D',
        padding: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    generateButtonText: {
        color: '#191E29',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AIWorkoutConfigurationScreen; 