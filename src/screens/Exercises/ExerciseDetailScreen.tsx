import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../styles/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';

type ExerciseDetailScreenRouteProp = RouteProp<WorkoutsStackParamList, 'ExerciseDetail'>;
type ExerciseDetailScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'ExerciseDetail'>;

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = (width * 9) / 16; // 16:9 aspect ratio

const ExerciseDetailScreen = () => {
  const route = useRoute<ExerciseDetailScreenRouteProp>();
  const navigation = useNavigation<ExerciseDetailScreenNavigationProp>();
  const theme = useAppTheme();
  const { exercise } = route.params;

  const [isPlaying, setIsPlaying] = useState(false);

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = exercise.videoUrl ? getYoutubeVideoId(exercise.videoUrl) : null;

  const handleVideoError = () => {
    console.log('Error loading video');
  };

  const openYoutubeApp = async () => {
    if (!videoId) return;
    
    const youtubeUrl = `vnd.youtube://${videoId}`;
    const webUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      const supported = await Linking.canOpenURL(youtubeUrl);
      await Linking.openURL(supported ? youtubeUrl : webUrl);
    } catch (error) {
      console.error('Error opening YouTube:', error);
    }
  };

  const renderMetadataItem = (icon: keyof typeof Ionicons.glyphMap, label: string, value?: string | string[]) => {
    if (!value) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    
    return (
      <View style={styles.metadataItem}>
        <Ionicons name={icon} size={24} color={theme.currentColors.primary} />
        <View style={styles.metadataText}>
          <Text style={[styles.metadataLabel, { color: theme.currentColors.textSecondary }]}>
            {label}
          </Text>
          <Text style={[styles.metadataValue, { color: theme.currentColors.textPrimary }]}>
            {displayValue}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.currentColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.currentColors.surface }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.currentColors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.currentColors.textPrimary }]}>
            {exercise.name}
          </Text>
        </View>

        {/* Video Section */}
        {videoId ? (
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={VIDEO_HEIGHT}
              play={isPlaying}
              videoId={videoId}
              onError={handleVideoError}
            />
            <TouchableOpacity 
              style={[styles.youtubeButton, { backgroundColor: theme.currentColors.error }]}
              onPress={openYoutubeApp}
            >
              <Ionicons name="logo-youtube" size={20} color="white" />
              <Text style={styles.youtubeButtonText}>Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.noVideoContainer, { backgroundColor: theme.currentColors.border }]}>
            <Ionicons name="videocam-off-outline" size={48} color={theme.currentColors.textSecondary} />
            <Text style={[styles.noVideoText, { color: theme.currentColors.textSecondary }]}>
              No video available
            </Text>
          </View>
        )}

        {/* Metadata Section */}
        <View style={[styles.metadataContainer, { backgroundColor: theme.currentColors.surface }]}>
          {renderMetadataItem('barbell-outline', 'Equipment', exercise.equipment)}
          {renderMetadataItem('fitness-outline', 'Target Muscles', exercise.muscleGroups)}
          {renderMetadataItem('speedometer-outline', 'Difficulty', exercise.difficulty)}
          {renderMetadataItem('fitness-outline', 'Type', exercise.type)}
        </View>

        {/* Description Section */}
        {exercise.description && (
          <View style={[styles.section, { backgroundColor: theme.currentColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: theme.currentColors.textSecondary }]}>
              {exercise.description}
            </Text>
          </View>
        )}

        {/* Instructions Section */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.currentColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.currentColors.textPrimary }]}>
              Instructions
            </Text>
            {exercise.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={[styles.instructionNumber, { color: theme.currentColors.primary }]}>
                  {index + 1}
                </Text>
                <Text style={[styles.instructionText, { color: theme.currentColors.textSecondary }]}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    marginBottom: 16,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  youtubeButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  noVideoContainer: {
    height: VIDEO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noVideoText: {
    marginTop: 8,
    fontSize: 16,
  },
  metadataContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metadataText: {
    marginLeft: 12,
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ExerciseDetailScreen; 