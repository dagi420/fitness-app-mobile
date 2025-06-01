import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons'; // For tab icons
import { View, TouchableOpacity, StyleSheet, Platform, Pressable, Dimensions } from 'react-native'; // Import TouchableOpacity and View for custom button and added Dimensions
import { useNavigation, getFocusedRouteNameFromRoute } from '@react-navigation/native'; // To navigate from tab button and getFocusedRouteNameFromRoute
import { StackNavigationProp } from '@react-navigation/stack'; // For typing navigation
import { RootStackParamList } from './types'; // For typing navigation

// Import your tab screens
import DashboardScreen from '../screens/Home/DashboardScreen';
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

// Get screen width for dynamic positioning if needed
const { width: screenWidth } = Dimensions.get('window');
const tabIconContainerWidth = screenWidth / 5; // Assuming 5 visual spots (4 icons + 1 middle button)

const CustomTabBarButton = ({ children, onPress }: { children: React.ReactNode, onPress?: () => void }) => (
  <TouchableOpacity
    style={styles.customButtonContainer} // This container will be a flex item
    onPress={onPress}
    activeOpacity={1} // Can adjust if feedback is desired directly on the transparent part
  >
    {/* The visual part is absolutely positioned relative to this container */}
    <View style={styles.customButtonVisual}>
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
        tabBarShowLabel: false, // Hide labels for a cleaner look with a central button
        tabBarStyle: styles.tabBarStyle, // Use StyleSheet for tabBarStyle
        headerShown: true, // Keep header shown for the profile button
        headerTitle: getHeaderTitle(route), // Dynamically set header title
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
            <Ionicons name="person-circle-outline" size={28} color="#007AFF" />
          </Pressable>
        ),
        // Apply a common style to each tab item for consistent spacing
        tabBarItemStyle: styles.tabBarItemStyle, 
        tabBarIcon: ({ focused, color }) => { // size prop is not used from here if tabBarItemStyle controls it
          let iconName;
          let iconSize = focused ? 24 : 24;

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
          return <Ionicons name={iconName as any} size={iconSize} color={color} />;
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
          tabBarItemStyle: { ...styles.tabBarItemStyle, flex: 1 }, // Also ensure this item gets its flex space
          tabBarIcon: ({ focused }) => (
            // This icon is for the children prop of CustomTabBarButton
            <Ionicons name="add" size={28} color={'#FFFFFF'} /> 
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
  tabBarStyle: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20, // Adjust for notch/home bar on iOS
    left: 25,
    right: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Smoother radius
    height: 65, // Adjusted height
    flexDirection: 'row', // Ensure items are laid out in a row
    justifyContent: 'space-around', // Distribute items evenly
    alignItems: 'center', // Center items vertically
    paddingHorizontal: 0, // No horizontal padding on the bar itself, items control their space
    borderTopWidth: 0, // Remove top border for a cleaner look
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3, // Shadow upwards for a floating effect
    },
    shadowOpacity: 0.05,
    shadowRadius: 4.0,
    elevation: 5, // Elevation for Android shadow
  },
  tabBarItemStyle: {
    flex: 1, // Each item takes equal width
    alignItems: 'center', // Center icon within the item
    justifyContent: 'center', // Center icon vertically
  },
  customButtonContainer: { // This is the TouchableOpacity passed to tabBarButton
    flex: 1, // Takes up its 1/5th slot in the tab bar
    justifyContent: 'center',
    alignItems: 'center',
     backgroundColor: 'transparent', // Or for debugging: 'rgba(0,255,0,0.2)' 
  },
  customButtonVisual: { // This is the styled circular button, absolutely positioned
    position: 'absolute',
    // To center it horizontally within its parent (customButtonContainer which is flex:1)
    // and then offset vertically. The parent should be wide enough.
    top: -22, // Adjust this to pull the visual button up
    // left: '50%', // These with transform would center it if parent wasn't full width of slot
    // marginLeft: -30, // Half of its own width
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', // Center itself within the flex:1 container
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.0,
    elevation: 8,
  },
});

export default MainTabNavigator;