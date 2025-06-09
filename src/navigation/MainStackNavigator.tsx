import { createStackNavigator } from '@react-navigation/stack';
import ManualPlanCreatorScreen from '../screens/Planner/ManualPlanCreatorScreen';
import AIWorkoutConfigurationScreen from '../screens/Planner/AIWorkoutConfigurationScreen';
import ExercisePickerScreen from '../screens/Exercises/ExercisePickerScreen';

const Stack = createStackNavigator();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManualPlanCreator"
        component={ManualPlanCreatorScreen}
        options={{
          title: 'Create Plan',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AIWorkoutConfigurationScreen"
        component={AIWorkoutConfigurationScreen}
        options={{
          title: 'AI Workout Configuration',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExercisePicker"
        component={ExercisePickerScreen}
        options={{
          title: 'Select Exercises',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStackNavigator; 