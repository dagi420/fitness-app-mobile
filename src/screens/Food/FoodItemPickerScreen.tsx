import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Button,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { FoodItem, searchFoodItems } from '../../api/foodService'; // To be created

type FoodItemPickerNavigationProp = StackNavigationProp<RootStackParamList, 'FoodItemPicker'>;
type FoodItemPickerRouteProp = RouteProp<RootStackParamList, 'FoodItemPicker'>;

const FoodItemPickerScreen = () => {
  const navigation = useNavigation<FoodItemPickerNavigationProp>();
  const route = useRoute<FoodItemPickerRouteProp>();
  const { mealId, onFoodItemSelected } = route.params;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]); // Replace any with FoodItem[]
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debounced search or search on button press
    if (searchTerm.length > 2) { // Example: search when term is longer than 2 chars
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchFoodItems(searchTerm);
      if (results.success && results.foodItems) {
        setSearchResults(results.foodItems);
      } else {
        setError(results.message || 'No food items found or error in search.');
        setSearchResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search food items.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
    // For now, using placeholder data
    // setSearchResults([
    //   { _id: 'food1', foodName: 'Apple', quantity: '1 medium', calories: 95, macronutrients: { proteinGr: 0.5, carbsGr: 25, fatGr: 0.3 } },
    //   { _id: 'food2', foodName: 'Chicken Breast', quantity: '100g', calories: 165, macronutrients: { proteinGr: 31, carbsGr: 0, fatGr: 3.6 } },
    //   { _id: 'food3', foodName: 'Brown Rice', quantity: '1 cup cooked', calories: 216, macronutrients: { proteinGr: 5, carbsGr: 45, fatGr: 1.8 } },
    // ]);
    // console.log(`Searching for: ${searchTerm} for mealId: ${mealId}`);
  };

  const handleSelectFoodItem = (foodItem: FoodItem) => { // Replace any with FoodItem
    onFoodItemSelected(foodItem);
    navigation.goBack();
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => ( // Replace any with FoodItem
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectFoodItem(item)}>
      <Text style={styles.itemName}>{item.foodName} ({item.quantity})</Text>
      <Text style={styles.itemDetails}>
        {item.calories} kcal | P: {item.macronutrients.proteinGr}g, C: {item.macronutrients.carbsGr}g, F: {item.macronutrients.fatGr}g
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Select Food Item</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a food item..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch} // Search on submit
          />
          <Button title="Search" onPress={handleSearch} disabled={isLoading} />
        </View>

        {isLoading && <ActivityIndicator size="large" style={styles.loader} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <FlatList
          data={searchResults}
          renderItem={renderFoodItem}
          keyExtractor={item => item._id}
          ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>No results. Type and press search.</Text> : null}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
});

export default FoodItemPickerScreen; 