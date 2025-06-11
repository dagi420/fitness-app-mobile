import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { API_BASE_URL } from '../../api/apiConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type PhotoViewerScreenRouteProp = RouteProp<RootStackParamList, 'PhotoViewer'>;

const { width, height } = Dimensions.get('window');

const PhotoViewerScreen = () => {
  const route = useRoute<PhotoViewerScreenRouteProp>();
  const navigation = useNavigation();
  const { photoUrls = [], logDate } = route.params || {};
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single');
  const [comparisonIndex, setComparisonIndex] = useState<number | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

  const getImageUri = (photoUrl: string): string => {
    if (!photoUrl) return '';
    const serverRoot = API_BASE_URL.replace('/api', '');
    return photoUrl.includes('://') ? photoUrl : `${serverRoot}${photoUrl}`;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = (photoUrl: string) => {
    setIsLoading(false);
    setImageLoadErrors(prev => ({ ...prev, [photoUrl]: true }));
    Alert.alert('Error', 'Failed to load image');
  };

  const renderFullScreenPhoto = (photoUrl: string) => {
    if (!photoUrl) return null;
    const imageUri = getImageUri(photoUrl);
    
    if (imageLoadErrors[photoUrl]) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="image-off" size={48} color="#666" />
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      );
    }

    return (
      <View style={styles.fullScreenContainer}>
        {isLoading && (
          <ActivityIndicator 
            size="large" 
            color="#007AFF" 
            style={styles.loader}
          />
        )}
        <Image
          source={{ uri: imageUri }}
          style={styles.fullScreenImage}
          resizeMode="contain"
          onLoadStart={() => setIsLoading(true)}
          onLoad={handleImageLoad}
          onError={() => handleImageError(photoUrl)}
        />
      </View>
    );
  };

  const renderComparisonView = () => {
    if (comparisonIndex === null || selectedPhotoIndex === comparisonIndex || !photoUrls[selectedPhotoIndex] || !photoUrls[comparisonIndex]) {
      return null;
    }

    return (
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonHalf}>
          {renderFullScreenPhoto(photoUrls[selectedPhotoIndex])}
          <Text style={styles.comparisonLabel}>Current</Text>
        </View>
        <View style={styles.comparisonDivider} />
        <View style={styles.comparisonHalf}>
          {renderFullScreenPhoto(photoUrls[comparisonIndex])}
          <Text style={styles.comparisonLabel}>Compare</Text>
        </View>
      </View>
    );
  };

  const renderThumbnail = ({ item: photoUrl, index }: { item: string; index: number }) => {
    if (!photoUrl) return null;
    const imageUri = getImageUri(photoUrl);
    const isSelected = index === selectedPhotoIndex || index === comparisonIndex;

    return (
      <TouchableOpacity
        style={[styles.thumbnailContainer, isSelected && styles.selectedThumbnail]}
        onPress={() => {
          if (viewMode === 'comparison' && selectedPhotoIndex !== index) {
            setComparisonIndex(index);
          } else {
            setSelectedPhotoIndex(index);
            setComparisonIndex(null);
          }
        }}
        onLongPress={() => {
          if (photoUrls.length > 1) {
            setViewMode(viewMode === 'single' ? 'comparison' : 'single');
            setComparisonIndex(null);
          }
        }}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => handleImageError(photoUrl)}
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <Icon name="check-circle" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!photoUrls.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {logDate ? new Date(logDate).toLocaleDateString() : 'Progress Photos'}
            </Text>
          </View>
          <View style={styles.emptyContainer}>
            <Icon name="image-off" size={48} color="#666" />
            <Text style={styles.emptyText}>No photos available</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {logDate ? new Date(logDate).toLocaleDateString() : 'Progress Photos'}
          </Text>
          {photoUrls.length > 1 && (
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => {
                setViewMode(viewMode === 'single' ? 'comparison' : 'single');
                setComparisonIndex(null);
              }}
            >
              <Icon
                name={viewMode === 'single' ? 'compare' : 'image'}
                size={24}
                color="#007AFF"
              />
              <Text style={styles.modeButtonText}>
                {viewMode === 'single' ? 'Compare' : 'Single View'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.mainContent}>
          {viewMode === 'single' ? (
            renderFullScreenPhoto(photoUrls[selectedPhotoIndex])
          ) : (
            renderComparisonView()
          )}
        </View>

        {photoUrls.length > 1 && (
          <View style={styles.thumbnailSection}>
            <Text style={styles.thumbnailTitle}>
              {viewMode === 'comparison' 
                ? 'Select photos to compare' 
                : 'All photos'}
            </Text>
            <FlatList
              data={photoUrls}
              renderItem={renderThumbnail}
              keyExtractor={(item, index) => `${item}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
            />
          </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  modeButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.6,
  },
  loader: {
    position: 'absolute',
    zIndex: 1,
  },
  thumbnailSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  thumbnailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  thumbnailList: {
    paddingVertical: 8,
  },
  thumbnailContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: '#007AFF',
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,122,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  comparisonHalf: {
    flex: 1,
  },
  comparisonDivider: {
    width: 2,
    backgroundColor: '#fff',
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default PhotoViewerScreen; 