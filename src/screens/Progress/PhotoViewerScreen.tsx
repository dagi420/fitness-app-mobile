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
  StatusBar,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { API_BASE_URL } from '../../api/apiConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';

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
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title: string, message: string) => {
    setAlertInfo({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
      iconName: 'alert-circle-outline',
    });
  };

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
    showAlert('Image Error', 'Failed to load the selected image. Please check your connection or try again.');
  };

  const renderFullScreenPhoto = (photoUrl: string) => {
    if (!photoUrl) return null;
    const imageUri = getImageUri(photoUrl);
    
    if (imageLoadErrors[photoUrl]) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="image-outline" size={60} color="#696E79" />
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      );
    }

    return (
      <View style={styles.fullScreenContainer}>
        {isLoading && (
          <ActivityIndicator 
            size="large" 
            color="#01D38D" 
            style={StyleSheet.absoluteFill}
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
          <Text style={styles.comparisonLabel}>
            {photoUrls[selectedPhotoIndex] ? new Date(logDate).toLocaleDateString() : 'Current'}
          </Text>
        </View>
        <View style={styles.comparisonDivider} />
        <View style={styles.comparisonHalf}>
          {renderFullScreenPhoto(photoUrls[comparisonIndex])}
          <Text style={styles.comparisonLabel}>
            {photoUrls[comparisonIndex] ? 'Comparison' : 'Compare'}
          </Text>
        </View>
      </View>
    );
  };

  const renderThumbnail = ({ item: photoUrl, index }: { item: string; index: number }) => {
    if (!photoUrl) return null;
    const imageUri = getImageUri(photoUrl);
    const isSelected = index === selectedPhotoIndex || index === comparisonIndex;
    const isComparisonTarget = index === comparisonIndex;

    return (
      <TouchableOpacity
        style={[
            styles.thumbnailContainer, 
            isSelected && styles.selectedThumbnail,
            isComparisonTarget && styles.comparisonThumbnail
        ]}
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
        {isSelected && !isComparisonTarget &&(
          <View style={styles.selectedOverlay}>
            <Ionicons name="eye-outline" size={24} color="#FFF" />
          </View>
        )}
        {isComparisonTarget && (
            <View style={[styles.selectedOverlay, styles.comparisonOverlay]}>
                <Ionicons name="git-compare-outline" size={24} color="#FFF" />
            </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!photoUrls.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Progress Photos</Text>
            <View style={{width: 24}}/>
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={80} color="#2A2D32" />
            <Text style={styles.emptyText}>No photos for this log</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {logDate ? new Date(logDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Photos'}
          </Text>
          <View style={{width: 24}}/>
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
            <View style={styles.thumbnailHeader}>
              <Text style={styles.thumbnailTitle}>
                {viewMode === 'comparison' 
                  ? 'Select photos to compare' 
                  : 'All photos'}
              </Text>
              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => {
                  setViewMode(viewMode === 'single' ? 'comparison' : 'single');
                  setComparisonIndex(null);
                }}
              >
                <Ionicons
                  name={viewMode === 'single' ? 'git-compare-outline' : 'image-outline'}
                  size={22}
                  color="#01D38D"
                />
                <Text style={styles.modeButtonText}>
                  {viewMode === 'single' ? 'Compare' : 'Single View'}
                </Text>
              </TouchableOpacity>
            </View>
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
      <CustomAlert
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        iconName={alertInfo.iconName}
        iconColor="#FF6B6B"
        onClose={() => setAlertInfo(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#1E2328',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32'
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#12151C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: '#A0A5B1',
    marginTop: 10,
    fontSize: 16,
  },
  comparisonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  comparisonHalf: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonDivider: {
    width: 2,
    backgroundColor: '#01D38D',
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  thumbnailSection: {
    paddingVertical: 15,
    backgroundColor: '#1E2328',
    borderTopWidth: 1,
    borderTopColor: '#2A2D32'
  },
  thumbnailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  thumbnailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#01D38D20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  modeButtonText: {
    color: '#01D38D',
    fontSize: 14,
    fontWeight: 'bold',
  },
  thumbnailList: {
    paddingHorizontal: 20,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedThumbnail: {
    borderColor: '#01D38D',
  },
  comparisonThumbnail: {
    borderColor: '#FF9F0A',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1, 211, 141, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonOverlay: {
    backgroundColor: 'rgba(255, 159, 10, 0.4)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
  },
});

export default PhotoViewerScreen; 