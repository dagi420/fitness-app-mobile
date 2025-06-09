import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList, AIWorkoutConfigData } from '../../navigation/types';
import { useAppTheme } from '../../styles/useAppTheme';
import { AppText } from '../../components/AppText';
import { NeumorphicButton } from '../../components/NeumorphicButton';
import Ionicons from '@expo/vector-icons/Ionicons';

type AIWorkoutConfigurationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AIWorkoutConfigurationScreen'>;
type AIWorkoutConfigurationScreenRouteProp = RouteProp<RootStackParamList, 'AIWorkoutConfigurationScreen'>;

interface ConfigOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const fitnessGoals: ConfigOption[] = [
  { value: 'Strength Building', label: 'Strength Building', icon: 'barbell' },
  { value: 'Muscle Gain (Hypertrophy)', label: 'Muscle Gain', icon: 'fitness' },
  { value: 'Weight Loss', label: 'Weight Loss', icon: 'trending-down' },
  { value: 'Endurance', label: 'Endurance', icon: 'infinite' },
  { value: 'General Fitness', label: 'General Fitness', icon: 'body' },
];

const fitnessLevels: ConfigOption[] = [
  { value: 'Beginner', label: 'Beginner', icon: 'leaf' },
  { value: 'Intermediate', label: 'Intermediate', icon: 'flame' },
  { value: 'Advanced', label: 'Advanced', icon: 'star' },
];

const workoutTypes: ConfigOption[] = [
  { value: 'Full Body', label: 'Full Body', icon: 'body' },
  { value: 'Upper Body', label: 'Upper Body', icon: 'barbell' },
  { value: 'Lower Body', label: 'Lower Body', icon: 'walk' },
  { value: 'Core Focus', label: 'Core Focus', icon: 'fitness' },
  { value: 'Cardio', label: 'Cardio', icon: 'heart' },
];

const equipmentOptions: ConfigOption[] = [
  { value: 'Bodyweight', label: 'Bodyweight Only', icon: 'body' },
  { value: 'Dumbbells', label: 'Dumbbells', icon: 'barbell' },
  { value: 'Resistance Bands', label: 'Resistance Bands', icon: 'infinite' },
  { value: 'Pull-up Bar', label: 'Pull-up Bar', icon: 'arrow-up' },
  { value: 'Bench', label: 'Bench', icon: 'bed' },
  { value: 'Full Gym', label: 'Full Gym Access', icon: 'fitness' },
];

const timeOptions: ConfigOption[] = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
];

const frequencyOptions: ConfigOption[] = [
  { value: '2', label: '2x per week' },
  { value: '3', label: '3x per week' },
  { value: '4', label: '4x per week' },
  { value: '5', label: '5x per week' },
  { value: '6', label: '6x per week' },
];

const AIWorkoutConfigurationScreen = () => {
  const navigation = useNavigation<AIWorkoutConfigurationScreenNavigationProp>();
  const route = useRoute<AIWorkoutConfigurationScreenRouteProp>();
  const theme = useAppTheme();

  const [fitnessGoal, setFitnessGoal] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Bodyweight']);
  const [timePerSession, setTimePerSession] = useState('');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEquipmentToggle = (value: string) => {
    setSelectedEquipment(prev => {
      if (prev.includes(value)) {
        // Don't remove if it's the last item or if it's Bodyweight
        if (prev.length === 1 || (value === 'Bodyweight' && prev.length <= 2)) {
          return prev;
        }
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSubmit = async () => {
    if (!fitnessGoal || !fitnessLevel || !workoutType || selectedEquipment.length === 0 || !timePerSession || !workoutsPerWeek) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const config: AIWorkoutConfigData = {
      fitnessGoal,
      fitnessLevel,
      workoutTypePreferences: workoutType,
      availableEquipment: selectedEquipment,
      timePerSession: parseInt(timePerSession),
      workoutsPerWeek: parseInt(workoutsPerWeek),
      gender: 'not_specified', // Default value since we don't collect this
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

  const renderOptionCard = (
    option: ConfigOption,
    isSelected: boolean,
    onPress: () => void,
    style?: any
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.optionCard,
        {
          backgroundColor: isSelected ? theme.currentColors.primary : theme.currentColors.surface,
        },
        style,
      ]}
    >
      {option.icon && (
        <Ionicons
          name={option.icon}
          size={24}
          color={isSelected ? 'white' : theme.currentColors.primary}
          style={styles.optionIcon}
        />
      )}
      <AppText
        variant="button"
        style={{
          color: isSelected ? 'white' : theme.currentColors.textPrimary,
        }}
      >
        {option.label}
      </AppText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.currentColors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <AppText variant="h1" style={[styles.title, { color: theme.currentColors.textPrimary }]}>
          Customize Your Workout
        </AppText>

        <View style={styles.section}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            What's your main goal?
          </AppText>
          <View style={styles.optionsGrid}>
            {fitnessGoals.map(goal => (
              <View key={goal.value} style={styles.optionWrapper}>
                {renderOptionCard(
                  goal,
                  fitnessGoal === goal.value,
                  () => setFitnessGoal(goal.value)
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Your fitness level
          </AppText>
          <View style={styles.optionsRow}>
            {fitnessLevels.map(level => (
              <View key={level.value} style={styles.optionWrapper}>
                {renderOptionCard(
                  level,
                  fitnessLevel === level.value,
                  () => setFitnessLevel(level.value)
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Preferred workout type
          </AppText>
          <View style={styles.optionsGrid}>
            {workoutTypes.map(type => (
              <View key={type.value} style={styles.optionWrapper}>
                {renderOptionCard(
                  type,
                  workoutType === type.value,
                  () => setWorkoutType(type.value)
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Available equipment
          </AppText>
          <AppText variant="body2" style={[styles.sectionSubtitle, { color: theme.currentColors.textSecondary }]}>
            Select all that apply
          </AppText>
          <View style={styles.optionsGrid}>
            {equipmentOptions.map(equipment => (
              <View key={equipment.value} style={styles.optionWrapper}>
                {renderOptionCard(
                  equipment,
                  selectedEquipment.includes(equipment.value),
                  () => handleEquipmentToggle(equipment.value)
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Time per workout
          </AppText>
          <View style={styles.optionsRow}>
            {timeOptions.map(time => (
              <View key={time.value} style={styles.optionWrapper}>
                {renderOptionCard(
                  time,
                  timePerSession === time.value,
                  () => setTimePerSession(time.value)
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Workouts per week
          </AppText>
          <View style={styles.optionsRow}>
            {frequencyOptions.map(freq => (
              <View key={freq.value} style={styles.optionWrapper}>
                {renderOptionCard(
                  freq,
                  workoutsPerWeek === freq.value,
                  () => setWorkoutsPerWeek(freq.value)
                )}
              </View>
            ))}
          </View>
        </View>

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
            onPress={handleSubmit}
            disabled={isSubmitting}
            containerStyle={[styles.bottomButton, { marginLeft: 8 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <AppText variant="button" style={{ color: "white", marginRight: 8 }}>
                  Generate Plan
                </AppText>
                <Ionicons name="flash" size={20} color="white" />
              </>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    marginBottom: 12,
    marginTop: -8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  optionsRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  optionWrapper: {
    padding: 8,
    width: '50%',
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 56,
  },
  optionIcon: {
    marginRight: 8,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 12,
  },
});

export default AIWorkoutConfigurationScreen; 