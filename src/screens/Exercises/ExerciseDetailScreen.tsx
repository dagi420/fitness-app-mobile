import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutsStackParamList } from '../../navigation/types';
import { Exercise } from '../../api/exerciseService';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ExerciseDetailScreenRouteProp = RouteProp<WorkoutsStackParamList, 'ExerciseDetail'>;
type ExerciseDetailScreenNavigationProp = StackNavigationProp<WorkoutsStackParamList, 'ExerciseDetail'>;

const { width } = Dimensions.get('window');

const getYoutubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const DetailChip = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
    <View style={styles.chip}>
        <Ionicons name={icon} size={18} color="#01D38D" />
        <Text style={styles.chipText}>{text}</Text>
    </View>
);


const ExerciseDetailScreen = () => {
  const route = useRoute<ExerciseDetailScreenRouteProp>();
  const navigation = useNavigation<ExerciseDetailScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { exercise } = route.params as { exercise: Exercise };

  const videoId = exercise.mediaUrls?.video ? getYoutubeVideoId(exercise.mediaUrls.video) : null;
  
  const renderSection = (title: string, content: React.ReactNode) => {
    if(!content) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {content}
      </View>
    )
  };
  
  const descriptionContent = exercise.description?.full || exercise.description?.short ? (
     <Text style={styles.bodyText}>
        {exercise.description.full || exercise.description.short}
      </Text>
  ) : null;
  
  const instructionsContent = exercise.instructions?.length > 0 ? exercise.instructions.map((instruction, index) => (
      <View key={index} style={styles.instructionItem}>
        <View style={styles.instructionNumberContainer}>
            <Text style={styles.instructionNumber}>{index + 1}</Text>
        </View>
        <Text style={styles.instructionText}>{instruction}</Text>
      </View>
    )) : null;

  const benefitsContent = exercise.description?.benefits?.length > 0 ? exercise.description.benefits.map((benefit, index) => (
    <View key={index} style={styles.bulletItem}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#01D38D" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>{benefit}</Text>
    </View>
  )) : null;

  const mistakesContent = exercise.description?.commonMistakes?.length > 0 ? exercise.description.commonMistakes.map((mistake, index) => (
      <View key={index} style={styles.bulletItem}>
          <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" style={styles.bulletIcon} />
          <Text style={styles.bulletText}>{mistake}</Text>
      </View>
  )) : null;
  
  const equipmentContent = exercise.equipmentNeeded?.length > 0 ? (
    <View style={styles.tagContainer}>
        {exercise.equipmentNeeded.map(item => <Text key={item} style={styles.tag}>{item}</Text>)}
    </View>
  ) : null;
  
   const muscleGroupsContent = exercise.targetMuscleGroups?.length > 0 ? (
    <View style={styles.tagContainer}>
        {exercise.targetMuscleGroups.map(item => <Text key={item} style={styles.tag}>{item}</Text>)}
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <ImageBackground
          source={{ uri: exercise.imageUrl || 'https://via.placeholder.com/400x300' }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={2}>{exercise.name}</Text>
          </View>
        </ImageBackground>

        <View style={styles.contentContainer}>
          <View style={styles.chipsContainer}>
            {exercise.difficulty && <DetailChip icon="pulse-outline" text={exercise.difficulty} />}
            {exercise.category && <DetailChip icon="grid-outline" text={exercise.category} />}
            {exercise.equipmentNeeded?.[0] && <DetailChip icon="barbell-outline" text={exercise.equipmentNeeded[0]} />}
          </View>
          
          {renderSection("Description", descriptionContent)}
          
          {renderSection("Target Muscle Groups", muscleGroupsContent)}
          
          {renderSection("Equipment Needed", equipmentContent)}

          {videoId && renderSection("Video Guide", (
            <View style={styles.videoContainer}>
                <YoutubePlayer
                    height={(width - 40) * 9 / 16}
                    play={false}
                    videoId={videoId}
                    webViewStyle={{ opacity: 0.99 }} // a common fix for render issues
                />
            </View>
          ))}
          
          {instructionsContent && renderSection("Instructions", instructionsContent)}

          {benefitsContent && renderSection("Benefits", benefitsContent)}
          
          {mistakesContent && renderSection("Common Mistakes", mistakesContent)}
          
        </View>
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
    height: 280,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25, 30, 41, 0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50, // Adjust as needed for status bar height
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
    marginTop: -20,
    backgroundColor: '#191E29',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 25,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  chipText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  bodyText: {
    fontSize: 16,
    color: '#A0A5B1',
    lineHeight: 24,
  },
  videoContainer: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  instructionNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#01D38D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  instructionNumber: {
    color: '#191E29',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionText: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
  },
  tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
  },
  tag: {
      backgroundColor: '#1E2328',
      color: '#A0A5B1',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      fontSize: 14,
      fontWeight: '500',
      overflow: 'hidden', // for rounded corners on iOS
  }
});

export default ExerciseDetailScreen; 