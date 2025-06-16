import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, AIPlanConfigData, AIWorkoutConfigData } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../store/AuthContext';
import { generateAIWorkoutPlan } from '../../api/workoutService';
import { generateAIDietPlan } from '../../api/dietService';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CreatePlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreatePlan'>;

const ActionCard = ({ title, description, icon, imageUrl, onPress, isLoading = false }) => (
  <TouchableOpacity onPress={onPress} style={styles.card} disabled={isLoading}>
    <ImageBackground
      source={{ uri: imageUrl }}
      style={styles.cardBackground}
      imageStyle={{ borderRadius: 20 }}
    >
      <View style={styles.cardOverlay}>
        <View style={styles.cardIconContainer}>
            <Ionicons name={icon} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        {isLoading && (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
            </View>
        )}
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const CreatePlanScreen = () => {
  const navigation = useNavigation<CreatePlanScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);

  const handleAIWorkoutGenerate = () => {
    if (!user || !token) {
      Alert.alert('Authentication Error', 'User not authenticated.');
      return;
    }
    navigation.navigate('AIWorkoutConfigurationScreen', {
      onSubmit: async (config: AIWorkoutConfigData) => {
        setIsGeneratingWorkout(true);
        try {
          const response = await generateAIWorkoutPlan(token, config);
          if (response.success && response.plan) {
            Alert.alert('Success', 'AI workout plan generated successfully!');
            navigation.navigate('MainApp', { screen: 'Workouts', params: { screen: 'WorkoutList' } });
          } else {
            Alert.alert('Error', response.message || 'Failed to generate AI workout plan.');
          }
        } catch (apiError) {
          Alert.alert('Error', apiError instanceof Error ? apiError.message : 'An unexpected error occurred.');
        } finally {
          setIsGeneratingWorkout(false);
        }
      },
    });
  };

  const handleManualCreate = () => {
    navigation.navigate('ManualPlanCreator', { preSelectedExercises: undefined });
  };
  
  const handleAIDietGenerate = () => {
    if (!user || !token) {
      Alert.alert("Authentication Error", "User not authenticated.");
      return;
    }
    navigation.navigate('AIConfigurationScreen', {
      onSubmit: async (config: AIPlanConfigData) => {
        setIsGeneratingDiet(true);
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
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, {paddingBottom: insets.bottom + 20}]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New Plan</Text>
        </View>

        <Text style={styles.sectionTitle}>Workout Plan</Text>
        <ActionCard
          title="Generate with AI"
          description="Let our AI build a custom workout plan for you"
          icon="sparkles-outline"
          imageUrl="https://images.unsplash.com/photo-1599058917212-d750089bc07e?fit=crop&w=1200&q=80"
          onPress={handleAIWorkoutGenerate}
          isLoading={isGeneratingWorkout}
        />
        <ActionCard
          title="Create Manually"
          description="Build your own workout from our exercise library"
          icon="build-outline"
          imageUrl="https://images.unsplash.com/photo-1576678927484-cc907957088c?fit=crop&w=1200&q=80"
          onPress={handleManualCreate}
        />

        <Text style={styles.sectionTitle}>Diet Plan</Text>
        <ActionCard
          title="Generate with AI"
          description="Get a personalized diet plan to match your goals"
          icon="sparkles-outline"
          imageUrl="https://images.unsplash.com/photo-1498837167922-ddd27525d352?fit=crop&w=1200&q=80"
          onPress={handleAIDietGenerate}
          isLoading={isGeneratingDiet}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 15,
  },
  card: {
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'flex-end',
  },
  cardIconContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardDescription: {
    color: '#E0E0E0',
    fontSize: 15,
    marginTop: 5,
  },
  loadingContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  }
});

export default CreatePlanScreen; 