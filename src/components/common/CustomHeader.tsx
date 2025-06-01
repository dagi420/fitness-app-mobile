import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../styles/useAppTheme';
import { useAuth } from '../.././store/AuthContext';
import AppText from './AppText';
import NeumorphicButton from './NeumorphicButton';

type CustomHeaderNavigationProp = StackNavigationProp<RootStackParamList>;

const CustomHeader = () => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const navigation = useNavigation<CustomHeaderNavigationProp>();
  const styles = createHeaderStyles(theme);

  const { currentScheme, setScheme, currentColors } = theme;
  const isDarkMode = currentScheme === 'dark';

  const toggleScheme = () => {
    setScheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarContainer}>
        <Ionicons name="person-circle-outline" size={40} color={currentColors.primary} />
      </TouchableOpacity>
      <View style={styles.greetingContainer}>
        <AppText variant="h3" fontWeight="bold" numberOfLines={1}>
          Hello, {user?.fullName?.split(' ')[0] || 'User'}!
        </AppText>
        <AppText variant="caption" color="textSecondary">
          Let's make today count.
        </AppText>
      </View>
      <View style={styles.actionsContainer}>
        <Pressable onPress={toggleScheme} style={styles.themeToggleContainer}>
          <Ionicons 
            name={isDarkMode ? 'sunny-outline' : 'moon-outline'} 
            size={24} 
            color={currentColors.primary} 
          />
        </Pressable>
        <NeumorphicButton 
          iconName="notifications-outline" 
          neumorphicType="flat" 
          neumorphicSize="small"
          containerStyle={styles.headerIcon}
          iconSize={26}
          onPress={() => {/* TODO: Notification action */}}
        />
      </View>
    </View>
  );
};

const createHeaderStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.currentColors.surface, // Or theme.currentColors.background if preferred
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.currentColors.border,
    // Adjust height if necessary, or let content define it
    // height: 60, // Example fixed height
  },
  avatarContainer: {
    marginRight: theme.spacing.sm,
  },
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleContainer: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs, // Space between toggle and notification
  },
  headerIcon: {
    padding: 0, // NeumorphicButton might have internal padding, adjust as needed
    marginLeft: theme.spacing.xs, // Small space if themeToggle is not present or further adjustments
  },
});

export default CustomHeader; 