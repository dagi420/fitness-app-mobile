import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList, MainTabParamList } from './types';

// Import your tab screens
import DashboardScreen from '../screens/MainApp/DashboardScreen';
import WorkoutsStackNavigator from './WorkoutsStackNavigator';
import DietPlanScreen from '../screens/Diet/DietPlanScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';

type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabParamList>();

const DummyScreen = () => null;

const CustomTabBarButton = ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={styles.customButtonContainer}>
    <View style={styles.customButtonVisual}>{children}</View>
  </Pressable>
);

const getHeaderTitle = (route: RouteProp<MainTabParamList, keyof MainTabParamList>) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Dashboard';
  switch (routeName) {
    case 'Dashboard': return 'Home';
    case 'WorkoutsStack': return 'Workouts';
    case 'Diet': return 'Diet Plan';
    case 'Progress': return 'Progress';
    default: return 'Fitness App';
  }
};

const MainTabNavigator = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        headerTitleAlign: 'left',
        headerStyle: styles.headerStyle,
        headerTitleStyle: styles.headerTitleStyle,
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#01D38D" />
          </Pressable>
        ),
        headerTitle: getHeaderTitle(route),
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1E2328',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarActiveTintColor: '#01D38D',
        tabBarInactiveTintColor: '#696E79',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'ellipse-outline';
          const iconSize = focused ? 30 : 26;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Workouts':
              iconName = focused ? 'barbell' : 'barbell-outline';
              break;
            case 'Diet':
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              break;
            case 'Progress':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
          }
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Workouts" component={WorkoutsStackNavigator} />
      <Tab.Screen
        name="CreatePlanTab"
        component={DummyScreen}
        options={{
          tabBarIcon: () => <Ionicons name="add" size={32} color="#191E29" />,
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} onPress={() => navigation.navigate('CreatePlan')} />
          ),
        }}
      />
      <Tab.Screen
        name="Diet"
        component={DietPlanScreen}
        options={{
          headerShown: true,
          headerTitle: 'Your Diet Plan',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          headerShown: true,
          headerTitle: 'Your Progress',
        }}
      />
    </Tab.Navigator>
  );
};

const shadowStyle = {
  shadowColor: '#01D38D',
  shadowOffset: {
    width: 0,
    height: 5,
  },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 8,
};

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: '#191E29',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    marginRight: 15,
  },
  tabBarStyle: {
    backgroundColor: '#1E2328',
    borderTopWidth: 0,
    elevation: 0,
  },
  customButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonVisual: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#01D38D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? -10 : -15,
    ...shadowStyle,
  },
});

export default MainTabNavigator;