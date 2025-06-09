import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, AIPlanConfigData, AIWorkoutConfigData } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../store/AuthContext';
import { generateAIWorkoutPlan } from '../../api/workoutService';
import { generateAIDietPlan } from '../../api/dietService';
import { useAppTheme } from '../../styles/useAppTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NeumorphicButton } from '../../components/NeumorphicButton';
import { AppText } from '../../components/AppText';

type CreatePlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePlan'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

const CreatePlanScreen = () => {
  const navigation = useNavigation<CreatePlanScreenNavigationProp>();
  const { user, token } = useAuth();
  const theme = useAppTheme();
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'workout' | 'diet' | null>(null);

  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handleAIDietGenerate = () => {
    if (!user || !token) {
      Alert.alert("Authentication Error", "User not authenticated.");
      return;
    }
    setSelectedOption('diet');
    navigation.navigate('AIConfigurationScreen', {
      onSubmit: async (config: AIPlanConfigData) => {
        setIsGeneratingDiet(true);
        Alert.alert("AI Diet Generation", "Generating your personalized diet plan... Please wait.");
        try {
          const response = await generateAIDietPlan(token, config);
          if (response.success && response.plan) {
            Alert.alert("Success", "AI diet plan generated successfully!");
            navigation.navigate('MainApp', { screen: 'Diet', params: { refresh: true } as any });
          } else {
            Alert.alert("Error", response.message || "Failed to generate AI diet plan.");
          }
        } catch (apiError) {
          Alert.alert("Error", apiError instanceof Error ? apiError.message : "An unexpected error occurred.");
        } finally {
          setIsGeneratingDiet(false);
          setSelectedOption(null);
        }
      }
    });
  };

  const handleAIWorkoutGenerate = () => {
    if (!user || !token) {
      Alert.alert("Authentication Error", "User not authenticated.");
      return;
    }
    setSelectedOption('workout');
    navigation.navigate('AIWorkoutConfigurationScreen', {
      onSubmit: async (config: AIWorkoutConfigData) => {
        setIsGeneratingWorkout(true);
        Alert.alert("AI Workout Generation", "Generating your personalized workout plan... Please wait.");
        try {
          const response = await generateAIWorkoutPlan(token, config);
          if (response.success && response.plan) {
            Alert.alert("Success", "AI workout plan generated successfully!");
            navigation.navigate('MainApp', { screen: 'Workouts', params: { screen: 'WorkoutList' } });
          } else {
            Alert.alert("Error", response.message || "Failed to generate AI workout plan.");
          }
        } catch (apiError) {
          Alert.alert("Error", apiError instanceof Error ? apiError.message : "An unexpected error occurred.");
        } finally {
          setIsGeneratingWorkout(false);
          setSelectedOption(null);
        }
      }
    });
  };

  const handleManualCreate = () => {
    navigation.navigate('ManualPlanCreator', { preSelectedExercises: undefined });
  };

  const handleOptionPress = (option: 'workout' | 'diet') => {
    // Animate the press
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setSelectedOption(option);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.currentColors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <AppText variant="h1" style={[styles.title, { color: theme.currentColors.textPrimary }]}>
            Create Your Plan
          </AppText>
          <AppText 
            variant="body1" 
            style={[styles.subtitle, { color: theme.currentColors.textSecondary }]}
          >
            Choose how you'd like to build your next fitness journey
          </AppText>
        </View>

        {/* Workout Section */}
        <View style={styles.sectionContainer}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Workout Plans
          </AppText>
          
          {/* AI Workout Card */}
          <TouchableOpacity 
            onPress={() => handleAIWorkoutGenerate()}
            style={[
              styles.card,
              { backgroundColor: theme.currentColors.surface }
            ]}
            disabled={isGeneratingWorkout}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Ionicons 
                  name="flash" 
                  size={32} 
                  color={theme.currentColors.primary} 
                />
              </View>
              <View style={styles.cardTextContainer}>
                <AppText variant="h3" style={{ color: theme.currentColors.textPrimary }}>
                  AI Workout Generator
                </AppText>
                <AppText variant="body2" style={{ color: theme.currentColors.textSecondary }}>
                  Let our AI create a personalized workout plan based on your goals
                </AppText>
              </View>
              {isGeneratingWorkout ? (
                <ActivityIndicator size="small" color={theme.currentColors.primary} />
              ) : (
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={theme.currentColors.textSecondary} 
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Manual Workout Card */}
          <TouchableOpacity 
            onPress={handleManualCreate}
            style={[
              styles.card,
              { backgroundColor: theme.currentColors.surface }
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Ionicons 
                  name="create" 
                  size={32} 
                  color={theme.currentColors.primary} 
                />
              </View>
              <View style={styles.cardTextContainer}>
                <AppText variant="h3" style={{ color: theme.currentColors.textPrimary }}>
                  Manual Workout Creator
                </AppText>
                <AppText variant="body2" style={{ color: theme.currentColors.textSecondary }}>
                  Build your own workout plan from our exercise library
                </AppText>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={theme.currentColors.textSecondary} 
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Diet Section */}
        <View style={styles.sectionContainer}>
          <AppText variant="h2" style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
            Diet Plans
          </AppText>
          
          {/* AI Diet Card */}
          <TouchableOpacity 
            onPress={() => handleAIDietGenerate()}
            style={[
              styles.card,
              { backgroundColor: theme.currentColors.surface }
            ]}
            disabled={isGeneratingDiet}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Ionicons 
                  name="nutrition" 
                  size={32} 
                  color={theme.currentColors.primary} 
                />
              </View>
              <View style={styles.cardTextContainer}>
                <AppText variant="h3" style={{ color: theme.currentColors.textPrimary }}>
                  AI Diet Generator
                </AppText>
                <AppText variant="body2" style={{ color: theme.currentColors.textSecondary }}>
                  Get a personalized meal plan tailored to your needs
                </AppText>
              </View>
              {isGeneratingDiet ? (
                <ActivityIndicator size="small" color={theme.currentColors.primary} />
              ) : (
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={theme.currentColors.textSecondary} 
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Manual Diet Card */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('ManualDietPlanner')}
            style={[
              styles.card,
              { backgroundColor: theme.currentColors.surface }
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Ionicons 
                  name="restaurant" 
                  size={32} 
                  color={theme.currentColors.primary} 
                />
              </View>
              <View style={styles.cardTextContainer}>
                <AppText variant="h3" style={{ color: theme.currentColors.textPrimary }}>
                  Manual Diet Creator
                </AppText>
                <AppText variant="body2" style={{ color: theme.currentColors.textSecondary }}>
                  Create your own meal plan with custom foods
                </AppText>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={theme.currentColors.textSecondary} 
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <NeumorphicButton
          neumorphicType="pressedIn"
          onPress={() => navigation.goBack()}
          containerStyle={styles.closeButton}
          buttonType="secondary"
        >
          <AppText variant="button" style={{ color: theme.currentColors.textSecondary }}>
            Close
          </AppText>
        </NeumorphicButton>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    textAlign: 'left',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});

export default CreatePlanScreen; 