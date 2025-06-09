import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../styles/useAppTheme';

type WorkoutsHomeScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList>;

const WorkoutsHomeScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutsHomeScreenNavigationProp>();
  const theme = useAppTheme();

  const navigationCards = [
    {
      title: 'Workouts',
      description: 'Browse and start pre-made workout plans',
      icon: 'barbell-outline',
      onPress: () => navigation.navigate('WorkoutList')
    },
    {
      title: 'Exercise Library',
      description: 'Explore individual exercises by category',
      icon: 'fitness-outline',
      onPress: () => navigation.navigate('ExerciseLibrary')
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.currentColors.background }]}>
      <View style={styles.cardsContainer}>
        {navigationCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              theme.shadows.getNeumorphicStyles(theme.currentColors, 'raised', 'medium'),
              { backgroundColor: theme.currentColors.surface }
            ]}
            onPress={card.onPress}
          >
            <Ionicons
              name={card.icon as any}
              size={40}
              color={theme.currentColors.primary}
              style={styles.cardIcon}
            />
            <Text style={[styles.cardTitle, { color: theme.currentColors.textPrimary }]}>
              {card.title}
            </Text>
            <Text style={[styles.cardDescription, { color: theme.currentColors.textSecondary }]}>
              {card.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default WorkoutsHomeScreen; 