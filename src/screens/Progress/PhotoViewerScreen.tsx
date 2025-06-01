import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, SafeAreaView, Dimensions } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { API_BASE_URL } from '../../api/apiConfig';

type PhotoViewerScreenRouteProp = RouteProp<RootStackParamList, 'PhotoViewer'>;

const { width } = Dimensions.get('window');

const PhotoViewerScreen = () => {
  const route = useRoute<PhotoViewerScreenRouteProp>();
  const { photoUrls, logDate } = route.params;

  const renderPhoto = ({ item: photoUrl }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image 
        source={{ uri: `${API_BASE_URL}${photoUrl}` }} 
        style={styles.image} 
        resizeMode="contain" 
        onError={(e) => console.log("Error loading full image:", e.nativeEvent.error, `${API_BASE_URL}${photoUrl}`)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Photos for {logDate ? new Date(logDate).toLocaleDateString() : 'Progress Log'}
        </Text>
        {photoUrls && photoUrls.length > 0 ? (
          <FlatList
            data={photoUrls}
            renderItem={renderPhoto}
            keyExtractor={(item, index) => `${item}-${index}`}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <Text style={styles.noPhotosText}>No photos found for this log entry.</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f5',
  },
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  image: {
    width: width - 40, // Adjust width as needed, leaving some padding
    height: (width - 40) * (3/4), // Maintain a 4:3 aspect ratio, adjust as needed
    borderRadius: 8,
    backgroundColor: '#e0e0e0', // Placeholder background
  },
  noPhotosText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 30,
  },
});

export default PhotoViewerScreen; 