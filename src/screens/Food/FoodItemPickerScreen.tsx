import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { FoodItem, searchFoodItems } from '../../api/dietService';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert';

type FoodItemPickerNavigationProp = StackNavigationProp<RootStackParamList, 'FoodItemPicker'>;
type FoodItemPickerRouteProp = RouteProp<RootStackParamList, 'FoodItemPicker'>;

const FoodItemPickerScreen = () => {
  const navigation = useNavigation<FoodItemPickerNavigationProp>();
  const route = useRoute<FoodItemPickerRouteProp>();
  const insets = useSafeAreaInsets();
  const { mealId, onFoodItemSelected } = route.params;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    iconName?: keyof typeof Ionicons.glyphMap;
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title: string, message: string, iconName?: keyof typeof Ionicons.glyphMap) => {
    setAlertInfo({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
      iconName,
    });
  };

  // Popular food items for quick selection
  const popularFoodItems: FoodItem[] = [
    {
      _id: 'popular_1',
      foodName: 'Chicken Breast',
      quantity: '100g',
      calories: 165,
      macronutrients: { proteinGr: 31, carbsGr: 0, fatGr: 3.6 }
    },
    {
      _id: 'popular_2',
      foodName: 'Brown Rice',
      quantity: '1 cup cooked',
      calories: 216,
      macronutrients: { proteinGr: 5, carbsGr: 45, fatGr: 1.8 }
    },
    {
      _id: 'popular_3',
      foodName: 'Banana',
      quantity: '1 medium',
      calories: 105,
      macronutrients: { proteinGr: 1.3, carbsGr: 27, fatGr: 0.4 }
    },
    {
      _id: 'popular_4',
      foodName: 'Oats',
      quantity: '50g dry',
      calories: 190,
      macronutrients: { proteinGr: 6.8, carbsGr: 34, fatGr: 3.4 }
    },
    {
      _id: 'popular_5',
      foodName: 'Almonds',
      quantity: '30g',
      calories: 173,
      macronutrients: { proteinGr: 6.3, carbsGr: 6.1, fatGr: 14.8 }
    },
    {
      _id: 'popular_6',
      foodName: 'Greek Yogurt',
      quantity: '150g',
      calories: 100,
      macronutrients: { proteinGr: 17, carbsGr: 6, fatGr: 0.4 }
    }
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showAlert('Search Required', 'Please enter a food item to search for.', 'alert-circle-outline');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await searchFoodItems(searchTerm.trim());
      if (results.success && results.foodItems) {
        setSearchResults(results.foodItems);
      } else {
        setError(results.message || 'No food items found.');
        setSearchResults([]);
      }
    } catch (err) {
      setError('Failed to search food items. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFoodItem = (foodItem: FoodItem) => {
    onFoodItemSelected(foodItem);
    navigation.goBack();
  };

  const FoodItemCard = ({ item, isPopular = false }: { item: FoodItem; isPopular?: boolean }) => (
    <TouchableOpacity 
      style={[styles.foodItemCard, isPopular && styles.popularFoodItem]} 
      onPress={() => handleSelectFoodItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodItemHeader}>
        <View style={styles.foodItemInfo}>
          <Text style={styles.foodItemName}>{item.foodName}</Text>
          <Text style={styles.foodItemQuantity}>{item.quantity}</Text>
        </View>
        {isPopular && (
          <View style={styles.popularTag}>
            <Ionicons name="star" size={12} color="#FFB74D" />
            <Text style={styles.popularTagText}>Popular</Text>
          </View>
        )}
      </View>
      
      <View style={styles.nutritionInfo}>
        <View style={styles.caloriesSection}>
          <Ionicons name="flame-outline" size={16} color="#FF6B6B" />
          <Text style={styles.caloriesText}>{item.calories} kcal</Text>
        </View>
        
        <View style={styles.macrosSection}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>P</Text>
            <Text style={styles.macroValue}>{item.macronutrients.proteinGr}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>C</Text>
            <Text style={styles.macroValue}>{item.macronutrients.carbsGr}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>F</Text>
            <Text style={styles.macroValue}>{item.macronutrients.fatGr}g</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.selectButton}>
        <Ionicons name="add-circle" size={24} color="#01D38D" />
      </View>
    </TouchableOpacity>
  );

  const EmptySearchState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="search-outline" size={60} color="#A0A5B1" />
      <Text style={styles.emptyStateTitle}>
        {hasSearched ? 'No Results Found' : 'Search for Food Items'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {hasSearched 
          ? 'Try searching with different keywords'
          : 'Enter a food name to find nutritional information'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food Item</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#A0A5B1" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food items..."
            placeholderTextColor="#696E79"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={[styles.searchButton, !searchTerm.trim() && styles.searchButtonDisabled]} 
            onPress={handleSearch}
            disabled={!searchTerm.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#191E29" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!hasSearched ? (
          // Show popular items when no search has been performed
          <>
            <Text style={styles.sectionTitle}>Popular Items</Text>
            <FlatList
              data={popularFoodItems}
              renderItem={({ item }) => <FoodItemCard item={item} isPopular />}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        ) : (
          // Show search results
          <>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
                <Text style={styles.errorTitle}>Search Failed</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  Search Results {searchResults.length > 0 && `(${searchResults.length})`}
                </Text>
                <FlatList
                  data={searchResults}
                  renderItem={({ item }) => <FoodItemCard item={item} />}
                  keyExtractor={item => item._id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                  ListEmptyComponent={<EmptySearchState />}
                />
              </>
            )}
          </>
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
  container: {
    flex: 1,
    backgroundColor: '#191E29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 34, // Same width as back button for centering
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D32',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2328',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: '#01D38D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  searchButtonDisabled: {
    backgroundColor: '#696E79',
  },
  searchButtonText: {
    color: '#191E29',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  listContainer: {
    paddingBottom: 20,
  },
  foodItemCard: {
    backgroundColor: '#1E2328',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularFoodItem: {
    borderWidth: 1,
    borderColor: '#FFB74D20',
    backgroundColor: '#1E2328',
  },
  foodItemHeader: {
    flex: 1,
  },
  foodItemInfo: {
    marginBottom: 8,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  foodItemQuantity: {
    fontSize: 14,
    color: '#A0A5B1',
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB74D20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  popularTagText: {
    fontSize: 12,
    color: '#FFB74D',
    fontWeight: '600',
  },
  nutritionInfo: {
    alignItems: 'flex-end',
    marginRight: 15,
  },
  caloriesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  macrosSection: {
    flexDirection: 'row',
    gap: 10,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#A0A5B1',
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#A0A5B1',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#A0A5B1',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#01D38D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  retryButtonText: {
    color: '#191E29',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FoodItemPickerScreen; 