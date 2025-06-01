import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons'; // For tab icons
import { View, TouchableOpacity, StyleSheet, Platform, Pressable, Text } from 'react-native';
import { useNavigation, getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from './types'; // Use MainTabParamList directly
import { useAppTheme } from '../styles/useAppTheme'; // Import the theme hook
import { neumorphicShadowOffset, neumorphicShadowOpacity } from '../styles/theme'; // Import neumorphic styles

// Import your tab screens
import DashboardScreen from '../screens/MainApp/DashboardScreen';
// import WorkoutListScreen from '../screens/Workouts/WorkoutListScreen';
import DietPlanScreen from '../screens/Diet/DietPlanScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
// import ProfileScreen from '../screens/Profile/ProfileScreen'; // Profile is usually a stack screen, not a tab itself, or handled by headerRight
import WorkoutsStackNavigator from './WorkoutsStackNavigator';
// import AIStackNavigator from './AIStackNavigator'; // Commented out for now

// Define navigation prop type for navigating from the custom tab button
type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

// Dummy component to assign to the tab screen that only acts as a button
const DummyScreen = () => null;

const CustomTabBarButton = ({ children, onPress }: { children: React.ReactNode, onPress?: () => void }) => {
  const theme = useAppTheme();
  const styles = createThemedStyles(theme); // Create styles with theme

  return (
    <TouchableOpacity
      style={styles.customButtonContainerDocked}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.customButtonVisualDocked}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

// Helper function to get the title for the header based on the focused tab
const getHeaderTitle = (route: RouteProp<MainTabParamList, keyof MainTabParamList>, theme: ReturnType<typeof useAppTheme>) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Dashboard';
  switch (routeName) {
    case 'Dashboard':
      return 'Home';
    case 'Workouts':
    case 'WorkoutsStack': // This might be the actual route name from the WorkoutsStackNavigator
      return 'Workouts';
    // case 'AIPlanner': // Commented out
    //   return 'AI Planner';
    case 'Diet':
      return 'Diet Plan';
    case 'Progress':
      return 'Progress';
    // CreatePlanTab does not have a header, so it's not handled here.
    // Profile is handled by RootStack, not a tab header.
    default:
      // Fallback for routeName itself if not matching above
      //This can happen if getFocusedRouteNameFromRoute returns a screen name from a nested stack
      if (Object.keys(theme.typography.variants).includes(routeName)) return routeName;
      return 'Fitness App'; // Default fallback
  }
};

const MainTabNavigator = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useAppTheme();
  const styles = createThemedStyles(theme);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBarStyleDocked,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.currentColors.surface, // Use theme color for header background
          borderBottomColor: theme.currentColors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        headerTitleStyle: {
          color: theme.currentColors.textPrimary, // Use theme color for header title
          fontSize: theme.typography.fontSizes.lg,
          fontWeight: theme.typography.fontWeights.semibold as any,
        },
        headerTitleAlign: 'left',
        headerTitle: getHeaderTitle(route, theme),
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate('Profile')} style={{ marginRight: theme.spacing.md }}>
            <Ionicons name="person-circle-outline" size={28} color={theme.currentColors.primary} />
          </Pressable>
        ),
        tabBarItemStyle: styles.tabBarItemStyleDocked,
        tabBarLabelStyle: {
            fontSize: theme.typography.fontSizes.xs,
            fontWeight: theme.typography.fontWeights.medium as any,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap | undefined = undefined;
          const iconSize = focused ? size + 1 : size; // Make focused icon slightly larger

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          // } else if (route.name === 'AIPlanner') { // Commented out
          //   iconName = focused ? 'bulb' : 'bulb-outline';
          } else if (route.name === 'Diet') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }
          // CreatePlanTab has its own icon defined in its options
          
          if (!iconName && route.name !== 'CreatePlanTab') { 
             // Fallback for any unexpected route names, though ideally all tab routes are handled above.
            console.warn("Unhandled route in TabBarIcon: ", route.name);
            iconName = 'help-circle-outline'; 
          }

          return iconName ? <Ionicons name={iconName} size={iconSize} color={color} /> : null;
        },
        tabBarActiveTintColor: theme.currentColors.tabBarActiveTintColorNeumorphic,
        tabBarInactiveTintColor: theme.currentColors.tabBarInactiveTintColorNeumorphic,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ 
          tabBarLabel: "Home", 
          headerShown: false // This will hide the default header for the Dashboard tab
        }} 
      />
      <Tab.Screen name="Workouts" component={WorkoutsStackNavigator} />
      <Tab.Screen
        name="CreatePlanTab" // This must be a key in MainTabParamList
        component={DummyScreen}
        options={{
          headerShown: false,
          tabBarShowLabel: false, // No label for the central button
          tabBarItemStyle: styles.tabBarItemStyleDocked, 
          tabBarIcon: () => ( // Custom icon for the central button
            <Ionicons name="add-circle" size={theme.typography.fontSizes.h1 + 12} color={theme.currentColors.primary} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              onPress={() => navigation.navigate('CreatePlan')} // Navigate to CreatePlan (RootStack)
            />
          ),
        }}
      />
      <Tab.Screen name="Diet" component={DietPlanScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      {/* <Tab.Screen name="AIPlanner" component={AIStackNavigator} options={{ tabBarLabel: 'AI Plan' }} /> */}
    </Tab.Navigator>
  );
};

// Create a function to generate styles with the theme, memoize if it becomes complex
const createThemedStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  tabBarStyleDocked: {
    backgroundColor: theme.currentColors.tabBarBackgroundNeumorphic,
    height: Platform.OS === 'ios' ? 85 : 70, 
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.lg : 0, 
    // Removing default border, Neumorphic shadows will provide separation
    // borderTopWidth: StyleSheet.hairlineWidth, 
    // borderTopColor: theme.currentColors.border, 

    // Attempting to add Neumorphic shadows directly to the tab bar
    // This might not work perfectly due to limitations of styling the native tab bar component
    // but it's a starting point.
    shadowColor: theme.currentColors.shadowDark, // Dark shadow
    shadowOffset: { width: 0, height: -neumorphicShadowOffset.small.height }, // Shadow upwards
    shadowOpacity: neumorphicShadowOpacity,
    shadowRadius: neumorphicShadowOffset.small.width, // Radius based on offset
    elevation: 5, // Basic elevation for Android
  },
  tabBarItemStyleDocked: {
    paddingVertical: theme.spacing.xs, // Add some vertical padding for icon and label
  },
  customButtonContainerDocked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Apply some negative margin to make the button appear slightly elevated or overlap if desired
    marginTop: Platform.OS === 'ios' ? -theme.spacing.xs : -theme.spacing.sm,
  },
  customButtonVisualDocked: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60, 
    height: 60,
    // backgroundColor and initial borderRadius are provided by getNeumorphicStyles
    ...theme.shadows.getNeumorphicStyles(theme.currentColors, 'raised', 'small'), 
    borderRadius: 30, // Explicitly set borderRadius for circular shape AFTER spreading theme styles
    // The getNeumorphicStyles will set a backgroundColor (theme.currentColors.base).
    // If a different one is needed (e.g., theme.currentColors.primary), it can be set here:
    // backgroundColor: theme.currentColors.primary, 
  },
  // ... other styles if needed, original floating styles can be removed if not used
});

export default MainTabNavigator;