import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { Workout, fetchAllWorkouts } from '../../api/workoutService';
import { fetchUserWorkoutPlans } from '../../api/planService';
import { useAuth } from '../../store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../styles/useAppTheme';
import { UserWorkoutPlan } from '../../api/planService';
import { AppText } from '../../components/AppText';
import { NeumorphicButton } from '../../components/NeumorphicButton';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const FEATURED_CARD_WIDTH = width * 0.85;
const REGULAR_CARD_WIDTH = width * 0.7;

export interface DisplayableWorkoutPlan extends Omit<UserWorkoutPlan, 'userId' | 'isAIgenerated'> {
  description?: string;
  type?: string;
  difficulty?: string;
  durationEstimateMinutes?: number;
  isAIGenerated?: boolean;
  imageUrl?: string;
}

type WorkoutListNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'WorkoutList'>;

interface WorkoutCardProps {
  workout: DisplayableWorkoutPlan;
  onPress: () => void;
  style?: any;
  featured?: boolean;
}

const WorkoutCard: React.FC<WorkoutCardProps> = React.memo(({ workout, onPress, style, featured = false }) => {
  const theme = useAppTheme();
  const cardWidth = featured ? FEATURED_CARD_WIDTH : REGULAR_CARD_WIDTH;

  return (
    <TouchableOpacity
      style={[
        styles.workoutCard,
        { 
          backgroundColor: theme.currentColors.surface,
          width: cardWidth,
        },
        featured && styles.featuredCard,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.cardImageContainer,
        featured && styles.featuredImageContainer
      ]}>
        {workout.imageUrl ? (
          <Image 
            source={{ uri: workout.imageUrl }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[
            styles.placeholderImage, 
            { backgroundColor: theme.currentColors.border + '40' }
          ]}>
            <Ionicons 
              name={workout.type?.toLowerCase().includes('cardio') ? 'heart-outline' : 'barbell-outline'} 
              size={featured ? 48 : 40} 
              color={theme.currentColors.textSecondary} 
            />
          </View>
        )}
        {workout.isAIGenerated && (
          <View style={[
            styles.aiTag, 
            { backgroundColor: theme.currentColors.primary }
          ]}>
            <Ionicons name="flash" size={12} color="white" />
            <AppText variant="caption" style={styles.aiTagText}>AI</AppText>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <AppText 
          variant={featured ? "h2" : "h3"} 
          style={{ color: theme.currentColors.textPrimary }} 
          numberOfLines={1}
        >
          {workout.planName}
        </AppText>
        
        <AppText 
          variant="body2" 
          style={[
            styles.workoutDescription, 
            { color: theme.currentColors.textSecondary }
          ]} 
          numberOfLines={2}
        >
          {workout.description || 'No description available'}
        </AppText>

        <View style={styles.workoutMetadata}>
          {workout.difficulty && (
            <View style={[
              styles.metadataItem,
              { backgroundColor: theme.currentColors.primary + '15' }
            ]}>
              <Ionicons 
                name={
                  workout.difficulty === 'Beginner' ? 'leaf-outline' :
                  workout.difficulty === 'Intermediate' ? 'flame-outline' : 'star-outline'
                } 
                size={14} 
                color={theme.currentColors.primary} 
              />
              <AppText 
                variant="caption" 
                style={[
                  styles.metadataText, 
                  { color: theme.currentColors.primary }
                ]}
              >
                {workout.difficulty}
              </AppText>
            </View>
          )}
          
          {workout.durationEstimateMinutes && (
            <View style={[
              styles.metadataItem,
              { backgroundColor: theme.currentColors.secondary + '15' }
            ]}>
              <Ionicons 
                name="time-outline" 
                size={14} 
                color={theme.currentColors.secondary} 
              />
              <AppText 
                variant="caption" 
                style={[
                  styles.metadataText, 
                  { color: theme.currentColors.secondary }
                ]}
              >
                {workout.durationEstimateMinutes} min
              </AppText>
            </View>
          )}

          <View style={[
            styles.metadataItem,
            { backgroundColor: theme.currentColors.accent + '15' }
          ]}>
            <Ionicons 
              name="fitness-outline" 
              size={14} 
              color={theme.currentColors.accent} 
            />
            <AppText 
              variant="caption" 
              style={[
                styles.metadataText, 
                { color: theme.currentColors.accent }
              ]}
            >
              {workout.exercises.length} exercises
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const SectionHeader: React.FC<{ 
  title: string; 
  icon: keyof typeof Ionicons.glyphMap;
  onSeeAll?: () => void;
}> = ({ title, icon, onSeeAll }) => {
  const theme = useAppTheme();
  
  return (
    <View style={[
      styles.sectionHeader, 
      { backgroundColor: theme.currentColors.background }
    ]}>
      <View style={styles.sectionTitleContainer}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={theme.currentColors.primary} 
        />
        <AppText 
          variant="h2" 
          style={[
            styles.sectionTitle, 
            { color: theme.currentColors.textPrimary }
          ]}
        >
          {title}
        </AppText>
      </View>
      {onSeeAll && (
        <NeumorphicButton
          onPress={onSeeAll}
          containerStyle={styles.seeAllButton}
          neumorphicType="flat"
          buttonType="secondary"
        >
          <AppText 
            variant="button" 
            style={{ color: theme.currentColors.primary }}
          >
            See All
          </AppText>
        </NeumorphicButton>
      )}
    </View>
  );
};

const EmptySection: React.FC<{
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = ({ message, icon }) => {
  const theme = useAppTheme();
  
  return (
    <View style={[
      styles.emptySection,
      { backgroundColor: theme.currentColors.surface + '80' }
    ]}>
      <Ionicons 
        name={icon} 
        size={48} 
        color={theme.currentColors.textSecondary} 
      />
      <AppText 
        variant="body1" 
        style={[
          styles.emptyText,
          { color: theme.currentColors.textSecondary }
        ]}
      >
        {message}
      </AppText>
    </View>
  );
};

const WorkoutListScreen = () => {
  const navigation = useNavigation<WorkoutListNavigationProp>();
  const { token, user } = useAuth();
  const theme = useAppTheme();
  const scrollY = new Animated.Value(0);

  const [workouts, setWorkouts] = useState<DisplayableWorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkouts = async () => {
    if (!token || !user?._id) return;
    try {
      const [workoutsResponse, userPlansResponse] = await Promise.all([
        fetchAllWorkouts(token),
        fetchUserWorkoutPlans(token, user._id)
      ]);

      let allWorkouts: DisplayableWorkoutPlan[] = [];

      // Add pre-made workouts
      if (workoutsResponse.success && workoutsResponse.workouts) {
        allWorkouts = [...workoutsResponse.workouts.map(mapWorkoutToDisplayablePlan)];
      }

      // Add user-created plans
      if (userPlansResponse.success && userPlansResponse.plans) {
        const userPlans = userPlansResponse.plans.map(plan => ({
          ...plan,
          isAIGenerated: plan.isAIgenerated, // Fix property name mismatch
          type: plan.isAIgenerated ? 'AI' : 'Custom',
          difficulty: 'Custom',
          durationEstimateMinutes: plan.exercises.length * 5, // Rough estimate
        }));
        allWorkouts = [...allWorkouts, ...userPlans];
      }

      setWorkouts(allWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapWorkoutToDisplayablePlan = (workout: Workout): DisplayableWorkoutPlan => ({
    _id: workout._id,
    planName: workout.name,
    description: workout.description,
    exercises: workout.exercises.map((ex, index) => ({
      _id: ex._id,
      exerciseId: ex._id,
      name: ex.name,
      type: ex.type || 'Strength',
      category: 'General', // Default category for compatibility
      difficulty: ex.difficulty || 'Intermediate',
      targetMuscleGroups: ex.muscleGroups || [],
      equipment: ex.equipment,
      description: ex.description,
      videoUrl: ex.videoUrl,
      imageUrl: ex.imageUrl,
      instructions: ex.instructions,
      sets: ex.sets?.toString(),
      reps: ex.reps,
      durationSeconds: ex.durationSeconds,
      order: ex.order || index,
    })),
    type: workout.type,
    difficulty: workout.difficulty,
    durationEstimateMinutes: workout.durationEstimateMinutes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAIGenerated: false,
  });

  useEffect(() => {
    loadWorkouts();
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  }, []);

  const handleWorkoutPress = (workout: DisplayableWorkoutPlan) => {
    navigation.navigate('WorkoutDetail', { workout });
  };

  // Filter workouts by type
  const featuredWorkouts = workouts.filter(w => w.type === 'Featured');
  const aiWorkouts = workouts.filter(w => w.isAIGenerated);
  const customWorkouts = workouts.filter(w => !w.isAIGenerated && w.type !== 'Featured');

  const renderWorkoutSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    workouts: DisplayableWorkoutPlan[],
    featured = false
  ) => {
    if (workouts.length === 0) {
      return (
        <>
          <SectionHeader title={title} icon={icon} />
          <EmptySection 
            message={`No ${title.toLowerCase()} available yet`}
            icon={icon}
          />
        </>
      );
    }

    return (
      <>
        <SectionHeader 
          title={title} 
          icon={icon}
          onSeeAll={() => {/* Handle see all */}}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
          decelerationRate="fast"
          snapToInterval={featured ? FEATURED_CARD_WIDTH + CARD_MARGIN * 2 : REGULAR_CARD_WIDTH + CARD_MARGIN * 2}
          snapToAlignment="center"
        >
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout._id}
              workout={workout}
              onPress={() => handleWorkoutPress(workout)}
              featured={featured}
              style={styles.horizontalCard}
            />
          ))}
        </ScrollView>
      </>
    );
  };

  return (
    <Animated.ScrollView
      style={[
        styles.container, 
        { backgroundColor: theme.currentColors.background }
      ]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={theme.currentColors.primary}
        />
      }
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    >
      {renderWorkoutSection("Featured Workouts", "star", featuredWorkouts, true)}
      {renderWorkoutSection("AI Workouts", "flash", aiWorkouts)}
      {renderWorkoutSection("My Workouts", "barbell", customWorkouts)}
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  horizontalScrollContent: {
    paddingHorizontal: CARD_MARGIN,
  },
  workoutCard: {
    borderRadius: 16,
    marginVertical: CARD_MARGIN,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featuredCard: {
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  horizontalCard: {
    marginRight: CARD_MARGIN * 2,
  },
  cardImageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  featuredImageContainer: {
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiTagText: {
    color: 'white',
    marginLeft: 4,
  },
  cardContent: {
    padding: 16,
  },
  workoutDescription: {
    marginTop: 4,
    marginBottom: 12,
  },
  workoutMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  metadataText: {
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: 8,
  },
  seeAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptySection: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
  },
});

export default WorkoutListScreen; 