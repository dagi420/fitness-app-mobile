import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type WorkoutsHomeScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList>;

const ActionCard = ({
  title,
  description,
  icon,
  imageUri,
  onPress,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  imageUri: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionCard} activeOpacity={0.8}>
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.cardBackground}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.cardOverlay}>
          <Ionicons name={icon} size={40} color="#FFFFFF" />
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          <View style={styles.cardGoContainer}>
            <Text style={styles.cardGoText}>Let's Go</Text>
            <Ionicons name="arrow-forward" size={18} color="#01D38D" />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const WorkoutsHomeScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutsHomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workout Center</Text>
          <Text style={styles.headerSubtitle}>
            Your journey to strength starts here. Choose your path.
          </Text>
        </View>
        <ActionCard
          title="Browse Workouts"
          description="Follow structured plans to reach your goals"
          icon="barbell"
          imageUri="https://images.unsplash.com/photo-1574680096145-d05b474e2155?fit=crop&w=1200&q=80"
          onPress={() => navigation.navigate('WorkoutList')}
        />
        <ActionCard
          title="Exercise Library"
          description="Discover and learn new exercises"
          icon="search"
          imageUri="https://images.unsplash.com/photo-1599058917212-d750089bc07e?fit=crop&w=1200&q=80"
          onPress={() => navigation.navigate('ExerciseLibrary')}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#A0A5B1',
  },
  actionCard: {
    height: 220,
    borderRadius: 25,
    marginHorizontal: 25,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    borderRadius: 25,
  },
  cardOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    padding: 25,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  cardDescription: {
    fontSize: 15,
    color: '#E0E0E0',
    flex: 1, // Pushes the "Let's Go" to the bottom
  },
  cardGoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  cardGoText: {
    color: '#191E29',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
});

export default WorkoutsHomeScreen; 