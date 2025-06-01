import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../../store/AuthContext'; // Optional: if you need user info here

// type DietPlanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Diet'>;

// interface DietPlanScreenProps {
//   navigation: DietPlanScreenNavigationProp;
// }

const DietPlanScreen = () => {
  const { user } = useAuth(); // Optional: Get user if needed for personalized messages

  // Placeholder function for when the feature is implemented
  const handleCreateDietPlan = () => {
    alert('AI Diet Plan Generation - Coming Soon!');
  };

  const handleViewMyPlan = () => {
    alert('Viewing My Diet Plan - Coming Soon!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Diet Plan</Text>

        <View style={styles.contentSection}>
          <Text style={styles.placeholderText}>
            Welcome, {user?.fullName || 'Guest'}!
          </Text>
          <Text style={styles.placeholderText}>
            Our AI-powered diet planning feature is currently under development.
            Soon, you'll be able to generate personalized meal plans tailored to your goals and preferences.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Generate My AI Diet Plan" onPress={handleCreateDietPlan} />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button title="View My Current Plan (Coming Soon)" onPress={handleViewMyPlan} />
        </View>

        {/* Future: Display a summary of the current diet plan if one exists */}
        {/* <View style={styles.planSummary}>
          <Text style={styles.sectionTitle}>Today's Meals (Example)</Text>
          <Text>- Breakfast: Oatmeal with Berries</Text>
          <Text>- Lunch: Grilled Chicken Salad</Text>
          <Text>- Dinner: Salmon with Roasted Vegetables</Text>
        </View> */}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Light background
  },
  container: {
    flexGrow: 1, // Ensures content can scroll if it exceeds screen height
    padding: 20,
    alignItems: 'center', // Center content horizontally
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  contentSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  buttonContainer: {
    width: '80%', // Make buttons a bit narrower than the content section
    marginBottom: 15,
    borderRadius: 8, // Apply border radius to button container for consistent styling
    overflow: 'hidden', // Necessary for Button component on Android to respect borderRadius
  },
  planSummary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e9f5ff',
    borderRadius: 8,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
});

export default DietPlanScreen; 