import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { BaseExercise } from './ManualPlanCreatorScreen';
import { fetchAllExercises } from '../../api/exerciseService';
import { useAuth } from '../../store/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '../../styles/useAppTheme';
import { AppText } from '../../components/AppText';
import { NeumorphicButton } from '../../components/NeumorphicButton';
import { ScrollView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;

type ExercisePickerNavigationProp = StackNavigationProp<RootStackParamList, 'ExercisePicker'>;

interface ExerciseListItemProps {
  item: BaseExercise;
  isSelected: boolean;
  onToggleSelect: (exerciseId: string) => void;
}

interface ExerciseSection {
  title: string;
  data: BaseExercise[];
}

const ExerciseListItem: React.FC<ExerciseListItemProps> = React.memo(({ item, isSelected, onToggleSelect }) => {
  const theme = useAppTheme();
  
  return (
    <TouchableOpacity 
      onPress={() => onToggleSelect(item._id)} 
      style={[
        styles.itemContainer,
        { backgroundColor: theme.currentColors.surface }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <AppText 
              variant="h3" 
              style={{ color: theme.currentColors.textPrimary }}
            >
              {item.name}
            </AppText>
            <View style={styles.badgesContainer}>
              <View style={[
                styles.badge,
                { backgroundColor: theme.currentColors.primary + '20' }
              ]}>
                <Ionicons 
                  name={item.type.toLowerCase() === 'cardio' ? 'heart' : 'barbell'} 
                  size={12} 
                  color={theme.currentColors.primary}
                />
                <AppText 
                  variant="caption" 
                  style={[styles.badgeText, { color: theme.currentColors.primary }]}
                >
                  {item.type}
                </AppText>
              </View>
              <View style={[
                styles.badge,
                { backgroundColor: theme.currentColors.secondary + '20' }
              ]}>
                <Ionicons 
                  name={
                    item.difficulty === 'Beginner' ? 'leaf' :
                    item.difficulty === 'Intermediate' ? 'flame' : 'star'
                  } 
                  size={12} 
                  color={theme.currentColors.secondary}
                />
                <AppText 
                  variant="caption" 
                  style={[styles.badgeText, { color: theme.currentColors.secondary }]}
                >
                  {item.difficulty}
                </AppText>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => onToggleSelect(item._id)}
            style={[
              styles.checkboxContainer,
              { 
                backgroundColor: isSelected ? theme.currentColors.primary : 'transparent',
                borderColor: isSelected ? theme.currentColors.primary : theme.currentColors.border
              }
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
          </TouchableOpacity>
        </View>

        {item.description && (
          <AppText 
            variant="body2" 
            style={[
              styles.description,
              { color: theme.currentColors.textSecondary }
            ]}
            numberOfLines={2}
          >
            {item.description}
          </AppText>
        )}

        {item.targetMuscleGroups && item.targetMuscleGroups.length > 0 && (
          <View style={styles.muscleGroupsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.muscleGroupsContent}
            >
              {item.targetMuscleGroups.map((muscle, index) => (
                <View 
                  key={index}
                  style={[
                    styles.muscleTag,
                    { backgroundColor: theme.currentColors.surface }
                  ]}
                >
                  <AppText 
                    variant="caption" 
                    style={{ color: theme.currentColors.textSecondary }}
                  >
                    {muscle}
                  </AppText>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
  const theme = useAppTheme();
  return (
    <View style={[
      styles.sectionHeader,
      { backgroundColor: theme.currentColors.background }
    ]}>
      <AppText 
        variant="h2" 
        style={{ color: theme.currentColors.textPrimary }}
      >
        {title}
      </AppText>
    </View>
  );
};

const ExercisePickerScreen = () => {
  const navigation = useNavigation<ExercisePickerNavigationProp>();
  const { token } = useAuth();
  const theme = useAppTheme();
  
  const [allExercises, setAllExercises] = useState<BaseExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Record<string, BaseExercise>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercises = async () => {
      if (!token) {
        setError('Authentication token not found.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchAllExercises(token);
        if (response.success && response.exercises) {
          // Map Exercise type to BaseExercise type with safe description handling
          const mappedExercises: BaseExercise[] = response.exercises.map(exercise => ({
            _id: exercise._id,
            name: exercise.name,
            type: exercise.type,
            category: exercise.category,
            difficulty: exercise.difficulty,
            targetMuscleGroups: exercise.targetMuscleGroups,
            equipmentNeeded: exercise.equipmentNeeded,
            description: typeof exercise.description === 'string' 
              ? exercise.description 
              : exercise.description?.short || exercise.description?.full || '',
            videoUrl: exercise.mediaUrls?.video,
            imageUrl: exercise.mediaUrls?.image,
            instructions: exercise.instructions
          }));
          setAllExercises(mappedExercises);
        } else {
          setError(response.message || 'Failed to load exercises.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    loadExercises();
  }, [token]);

  const exerciseSections = useMemo(() => {
    if (allExercises.length === 0) return [];
    
    const grouped: { [key: string]: BaseExercise[] } = {};
    allExercises.forEach(exercise => {
      const category = exercise.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(exercise);
    });

    return Object.keys(grouped)
      .map(category => ({
        title: category,
        data: grouped[category],
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allExercises]);

  const handleToggleSelect = (exerciseId: string) => {
    setSelectedExercises(prevSelected => {
      const newSelected = { ...prevSelected };
      if (newSelected[exerciseId]) {
        delete newSelected[exerciseId];
      } else {
        const exerciseToAdd = allExercises.find(ex => ex._id === exerciseId);
        if (exerciseToAdd) {
          newSelected[exerciseId] = exerciseToAdd;
        }
      }
      return newSelected;
    });
  };

  const handleDoneSelection = () => {
    const exercisesToReturn = Object.values(selectedExercises);
    if (exercisesToReturn.length === 0) {
      Alert.alert("No Exercises Selected", "Please select at least one exercise.");
      return;
    }
    navigation.navigate('ManualPlanCreator', { preSelectedExercises: exercisesToReturn });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.currentColors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.currentColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.currentColors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.currentColors.error} />
          <AppText 
            variant="body1" 
            style={[styles.errorText, { color: theme.currentColors.error }]}
          >
            {error}
          </AppText>
          <NeumorphicButton
            onPress={() => navigation.goBack()}
            containerStyle={styles.errorButton}
            neumorphicType="flat"
            buttonType="secondary"
          >
            <AppText variant="button" style={{ color: theme.currentColors.textPrimary }}>
              Go Back
            </AppText>
          </NeumorphicButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.currentColors.background }]}>
      <View style={styles.screenContainer}>
        <SectionList
          sections={exerciseSections}
          renderItem={({ item }) => (
            <ExerciseListItem 
              item={item} 
              isSelected={!!selectedExercises[item._id]}
              onToggleSelect={handleToggleSelect}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeader title={title} />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={false}
        />
        
        {Object.keys(selectedExercises).length > 0 && (
          <View style={[
            styles.bottomBar,
            { backgroundColor: theme.currentColors.surface }
          ]}>
            <NeumorphicButton
              onPress={handleDoneSelection}
              containerStyle={styles.doneButton}
              neumorphicType="raised"
              buttonType="primary"
            >
              <AppText variant="button" style={{ color: 'white' }}>
                Add {Object.keys(selectedExercises).length} Exercise{Object.keys(selectedExercises).length > 1 ? 's' : ''}
              </AppText>
            </NeumorphicButton>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  errorButton: {
    marginTop: 24,
    paddingHorizontal: 32,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  itemContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    marginLeft: 4,
  },
  description: {
    marginTop: 8,
  },
  muscleGroupsContainer: {
    marginTop: 12,
  },
  muscleGroupsContent: {
    paddingRight: 16,
  },
  muscleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  doneButton: {
    paddingVertical: 12,
  },
});

export default ExercisePickerScreen; 