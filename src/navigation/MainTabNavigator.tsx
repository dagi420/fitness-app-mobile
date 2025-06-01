import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons'; // For tab icons
import { View, TouchableOpacity, StyleSheet, Platform, Pressable } from 'react-native'; // Removed Dimensions as it's not critical for docked bar
import { useNavigation, getFocusedRouteNameFromRoute } from '@react-navigation/native'; // To navigate from tab button and getFocusedRouteNameFromRoute
import { StackNavigationProp } from '@react-navigation/stack'; // For typing navigation
import { RootStackParamList } from './types'; // For typing navigation

// Import your tab screens
import DashboardScreen from '../screens/MainApp/DashboardScreen';
import WorkoutListScreen from '../screens/Workouts/WorkoutListScreen';
import DietPlanScreen from '../screens/Diet/DietPlanScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import WorkoutsStackNavigator from './WorkoutsStackNavigator'; // Import the new stack navigator

// Define a ParamList for the Tab navigator if you need to type check route names or params for tabs
export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  // Add a dummy name for the central button's tab. It won't show a screen.
  CreatePlanTab: undefined; 
  Diet: undefined;
  Progress: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Define navigation prop type for navigating from the custom tab button
type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

// Dummy component to assign to the tab screen that only acts as a button
const DummyScreen = () => null;

const CustomTabBarButton = ({ children, onPress }: { children: React.ReactNode, onPress?: () => void }) => (
  <TouchableOpacity
    style={styles.customButtonContainerDocked} // Use new style for docked version
    onPress={onPress}
    activeOpacity={0.7} 
  >
    <View style={styles.customButtonVisualDocked}>
      {children}
    </View>
  </TouchableOpacity>
);

// Helper function to get the title for the header based on the focused tab
const getHeaderTitle = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Dashboard';
  switch (routeName) {
    case 'Dashboard':
      return 'Home';
    case 'Workouts':
    case 'WorkoutsStack': // If your stack navigator is named WorkoutsStack internally
      return 'Workouts';
    case 'Diet':
      return 'Diet Plan';
    case 'Progress':
      return 'Progress';
    default:
      return 'Fitness App'; // Fallback title
  }
};

const MainTabNavigator = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: true, // Show labels for docked bar
        tabBarStyle: styles.tabBarStyleDocked, // Use new style for docked bar
        headerShown: true, // Keep header shown for the profile button
        headerTitle: getHeaderTitle(route), // Dynamically set header title
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
            <Ionicons name="person-circle-outline" size={28} color="#007AFF" />
          </Pressable>
        ),
        // Apply a common style to each tab item for consistent spacing
        tabBarItemStyle: styles.tabBarItemStyleDocked,
        tabBarIcon: ({ focused, color, size }) => { 
          let iconName;
          // Using size passed by navigator for docked version
          // let iconSize = focused ? 26 : 24; 

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Diet') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }
          if (!iconName) return null; // Should not happen for defined routes
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF', // A common modern blue
        tabBarInactiveTintColor: '#8E8E93', // iOS-like inactive color
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutsStackNavigator} 
        options={{ tabBarLabel: 'Workouts', title: 'Workouts' }} 
      />
      <Tab.Screen // The Central Add Button Tab
        name="CreatePlanTab"
        component={DummyScreen} // Use DummyScreen to avoid inline function warning
        options={{
          headerShown: false, // No header for the tab itself that is just a button modal
          tabBarItemStyle: styles.tabBarItemStyleDocked, // Also ensure this item gets its flex space
          tabBarIcon: ({ color, size }) => ( // Standard icon, color/size will be passed by navigator
            <Ionicons name="add-circle" size={size + 14} color={color} /> // Make it larger, use theme color
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              onPress={() => navigation.navigate('CreatePlan')}
            />
          ),
          // No title for this tab button
        }}
      />
      <Tab.Screen name="Diet" component={DietPlanScreen} options={{ title: 'Diet Plan' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{title: "Progress"}}/>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarStyleDocked: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'ios' ? 85 : 70, // Standard height, adjust for iOS bottom safe area
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Padding for home indicator on iOS
    borderTopWidth: 0.5, // Subtle top border
    borderTopColor: '#E0E0E0',
    // Removed absolute positioning, shadows, borderRadius, left, right, bottom
  },
  tabBarItemStyleDocked: {
    // flex: 1, // Default behavior is fine
    // alignItems: 'center', // Default
    // justifyContent: 'center', // Default
  },
  customButtonContainerDocked: { // For the TouchableOpacity wrapper of the center button
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonVisualDocked: { // For the <View> inside the TouchableOpacity (if needed for more complex styling)
    // This View can be used if you want the icon container itself to have a background or specific shape
    // For a simple icon button, this might not be strictly necessary, the icon itself can be styled.
    // If the icon is large enough, this visual can be minimal or just for alignment.
    alignItems: 'center',
    justifyContent: 'center',
    // Example: Make it slightly elevated or have a subtle background for the larger icon
    // width: 60, 
    // height: 40, 
    // borderRadius: 10, 
    // backgroundColor: '#f0f0f0', 
  },
  // Original floating styles (kept for reference, can be deleted)
  tabBarStyle: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20, 
    left: 25,
    right: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 20, 
    height: 65, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingHorizontal: 0, 
    borderTopWidth: 0, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3, 
    },
    shadowOpacity: 0.05,
    shadowRadius: 4.0,
    elevation: 5, 
  },
  tabBarItemStyle: {
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  customButtonContainer: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  customButtonVisual: { 
    position: 'absolute',
    top: -22, 
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', 
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.0,
    elevation: 8,
  },
});

export default MainTabNavigator;