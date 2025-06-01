import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView, Alert, TouchableOpacity, View, ViewProps } from 'react-native'; // Added View back
import { useAuth } from '../../store/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../styles/useAppTheme';
import NeumorphicView from '../../components/common/NeumorphicView';
import AppText from '../../components/common/AppText';
import NeumorphicButton from '../../components/common/NeumorphicButton';
import Ionicons from '@expo/vector-icons/Ionicons';

// Define navigation prop type for this screen
type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileDetailItemProps {
  label: string;
  value: string | number | undefined | null;
  iconName?: keyof typeof Ionicons.glyphMap;
}

const ProfileDetailItem: React.FC<ProfileDetailItemProps> = ({ label, value, iconName }) => {
  const theme = useAppTheme();
  const styles = createThemedStyles(theme);

  if (value === undefined || value === null || value === '') {
    return null;
  }
  return (
    <View style={styles.detailItemContainer}>
      {iconName && <Ionicons name={iconName} size={20} color={theme.currentColors.textSecondary} style={styles.detailItemIcon} />}
      <AppText style={styles.detailItemLabel} variant="body2" color="textSecondary" fontWeight="semibold">{label}:</AppText>
      <AppText style={styles.detailItemValue} variant="body2">{String(value)}</AppText>
    </View>
  );
};

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const theme = useAppTheme();
  const styles = createThemedStyles(theme);

  const handleLogout = async () => {
    await logout();
    Alert.alert("Logged Out", "You have been successfully logged out.");
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.safeAreaBase, {backgroundColor: '#FFFFFF'}]}>
        <NeumorphicView type="flat" style={[styles.centeredContainer, {backgroundColor: '#FFFFFF'}]}>
          <AppText>No user data found. You might be logged out.</AppText>
          <NeumorphicButton 
            title="Go to Login" 
            onPress={handleLogout} 
            buttonType="primary"
            iconName="log-in-outline"
            containerStyle={{marginTop: theme.spacing.lg}}
            />
        </NeumorphicView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeAreaBase, {backgroundColor: '#FFFFFF'}]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <NeumorphicView type="flat" style={[styles.container, {backgroundColor: '#FFFFFF'}]}>
            <AppText variant="h1" fontWeight="bold" style={styles.title}>{user.fullName || 'User Profile'}</AppText>
            <AppText variant="body1" color="textSecondary" style={styles.email}>{user.email}</AppText>

            <NeumorphicView type="raised" style={styles.detailsSectionCard} borderRadius={theme.borders.radiusLarge}>
              <View style={styles.sectionHeaderContainer}>
                <Ionicons name="person-circle-outline" size={28} color={theme.currentColors.primary} style={styles.sectionHeaderIcon} />
                <AppText variant="h3" style={styles.sectionTitle}>Personal Information</AppText>
              </View>
              <ProfileDetailItem label="Full Name" value={user.fullName} iconName="person-outline" />
              <ProfileDetailItem label="Email" value={user.email} iconName="mail-outline" />
              {user.profile && (
                <>
                  <ProfileDetailItem label="Age" value={user.profile.age} iconName="calendar-outline" />
                  <ProfileDetailItem label="Gender" value={user.profile.gender} iconName="transgender-outline" />
                  <ProfileDetailItem label="Height" value={user.profile.height ? `${user.profile.height} cm` : undefined} iconName="stats-chart-outline" />
                  <ProfileDetailItem label="Weight" value={user.profile.weight ? `${user.profile.weight} kg` : undefined} iconName="barbell-outline" />
                  <ProfileDetailItem label="Activity Level" value={user.profile.activityLevel} iconName="walk-outline" />
                  {user.profile.workoutGoals && user.profile.workoutGoals.length > 0 && (
                    <ProfileDetailItem label="Workout Goals" value={user.profile.workoutGoals.join(', ')} iconName="trophy-outline" />
                  )}
                  {user.profile.healthConditions && user.profile.healthConditions.length > 0 && (
                     <ProfileDetailItem label="Health Conditions" value={user.profile.healthConditions.join(', ')} iconName="heart-outline" />
                  )}
                   {user.profile.dietaryRestrictions && user.profile.dietaryRestrictions.length > 0 && (
                     <ProfileDetailItem label="Dietary Restrictions" value={user.profile.dietaryRestrictions.join(', ')} iconName="restaurant-outline"/>
                  )}
                </>
              )}
            </NeumorphicView>

            <NeumorphicView type="raised" style={styles.detailsSectionCard} borderRadius={theme.borders.radiusLarge}>
              <View style={styles.sectionHeaderContainer}>
                <Ionicons name="analytics-outline" size={28} color={theme.currentColors.primary} style={styles.sectionHeaderIcon} />
                <AppText variant="h3" style={styles.sectionTitle}>Progress Tracking</AppText>
              </View>
              <NeumorphicButton 
                title="View Weight & Measurement History"
                onPress={() => navigation.navigate('ProgressHistory')}
                buttonType="default"
                iconName="folder-open-outline"
                iconSecondaryName="chevron-forward-outline"
                neumorphicType="flat"
                containerStyle={{ paddingVertical: theme.spacing.lg }}
                fullWidth
              />
            </NeumorphicView>

            <View style={styles.logoutButtonContainer}>
              <NeumorphicButton 
                title="Logout" 
                onPress={handleLogout} 
                buttonType="error" 
                neumorphicType="pressedIn" 
                iconName="log-out-outline"
                fullWidth
              />
            </View>
        </NeumorphicView>
      </ScrollView>
    </SafeAreaView>
  );
};

// createThemedStyles is now correctly scoped for ProfileScreen and its child ProfileDetailItem
const createThemedStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  safeAreaBase: {
    flex: 1,
    backgroundColor: theme.currentColors.background, 
  },
  scrollContainer: {
    flexGrow: 1, 
  },
  container: {
    padding: theme.spacing.lg,
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: theme.currentColors.textPrimary, 
  },
  email: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  detailsSectionCard: { 
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionHeaderIcon: {
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    paddingBottom: theme.spacing.xs,
    color: theme.currentColors.primary, 
  },
  detailItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.currentColors.border, 
  },
  detailItemIcon: {
    marginRight: theme.spacing.md,
  },
  detailItemLabel: {
    marginRight: theme.spacing.sm,
  },
  detailItemValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  logoutButtonContainer: {
    marginTop: theme.spacing.xl,
  },
});

export default ProfileScreen; 