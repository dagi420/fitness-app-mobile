import React, { useState } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import NeumorphicView, { NeumorphicViewProps } from './NeumorphicView';
import AppText from './AppText';
import { useAppTheme } from '../../styles/useAppTheme';
import Ionicons from '@expo/vector-icons/Ionicons'; // Or your preferred icon set

export interface NeumorphicButtonProps extends TouchableOpacityProps {
  title?: string; // Title is optional if it's an icon-only button
  neumorphicType?: NeumorphicViewProps['type'];
  neumorphicSize?: NeumorphicViewProps['size'];
  buttonType?: 'primary' | 'secondary' | 'error' | 'success' | 'default';
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  iconRight?: boolean; // If true, main icon appears to the right of the text
  fullWidth?: boolean;
  containerStyle?: ViewStyle; // Style for the NeumorphicView container
  textStyle?: TextStyle;
  children?: React.ReactNode; // Allow passing custom children instead of title/icon

  // New props for a secondary, typically right-aligned icon (e.g., chevron)
  iconSecondaryName?: keyof typeof Ionicons.glyphMap;
  iconSecondarySize?: number;
  iconSecondaryColor?: string;
  iconSecondaryStyle?: ViewStyle;
}

const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  title,
  onPress,
  onPressIn,
  onPressOut,
  neumorphicType = 'raised',
  neumorphicSize = 'medium',
  buttonType = 'default',
  iconName,
  iconSize = 20,
  iconColor,
  iconRight = false,
  fullWidth = false,
  disabled,
  containerStyle,
  textStyle,
  style, // This will be for the TouchableOpacity itself
  children,
  iconSecondaryName,
  iconSecondarySize = 18,
  iconSecondaryColor,
  iconSecondaryStyle,
  ...rest
}) => {
  const theme = useAppTheme();
  const [isPressed, setIsPressed] = useState(false);

  const currentNeumorphicType = disabled ? 'flat' : (isPressed ? 'pressedIn' : neumorphicType);

  let baseBackgroundColor = theme.currentColors.surface;
  let currentIconColor = iconColor || theme.currentColors.textPrimary;
  let currentTextColor = theme.currentColors.textPrimary; // Default text color for 'default' button

  switch (buttonType) {
    case 'primary':
      baseBackgroundColor = theme.currentColors.primary;
      currentIconColor = iconColor || theme.currentColors.textOnPrimary;
      currentTextColor = theme.currentColors.textOnPrimary;
      break;
    case 'secondary':
      baseBackgroundColor = theme.currentColors.secondary;
      currentIconColor = iconColor || theme.currentColors.textOnPrimary;
      currentTextColor = theme.currentColors.textOnPrimary;
      break;
    case 'error':
      baseBackgroundColor = theme.currentColors.error;
      currentIconColor = iconColor || theme.currentColors.textOnPrimary;
      currentTextColor = theme.currentColors.textOnPrimary;
      break;
    case 'success':
      baseBackgroundColor = theme.currentColors.success;
      currentIconColor = iconColor || theme.currentColors.textOnPrimary;
      currentTextColor = theme.currentColors.textOnPrimary;
      break;
    case 'default':
    default:
      // For default, text and icon color might need to be more prominent if bg is just surface
      currentIconColor = iconColor || theme.currentColors.primary; 
      currentTextColor = theme.currentColors.primary; // Or a contrasted textPrimary
      break;
  }
  
  if(disabled) {
    baseBackgroundColor = theme.currentColors.disabled;
    currentIconColor = theme.currentColors.textSecondary;
    currentTextColor = theme.currentColors.textSecondary;
  }

  const handlePressIn = (event: GestureResponderEvent) => {
    setIsPressed(true);
    if (onPressIn) onPressIn(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setIsPressed(false);
    if (onPressOut) onPressOut(event);
  };

  const styles = StyleSheet.create({
    touchableStyle: {
      width: fullWidth ? '100%' : undefined,
      opacity: disabled ? 0.6 : 1,
    },
    neumorphicContainer: {
      paddingVertical: neumorphicSize === 'small' ? theme.spacing.sm : theme.spacing.md,
      paddingHorizontal: neumorphicSize === 'small' ? theme.spacing.md : theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconRight ? 'row-reverse' : 'row',
    },
    text: {
      // variant="button" is used in AppText
      marginHorizontal: iconName && title ? theme.spacing.sm : 0,
      flexGrow: 1, // Allow text to take available space if icons are on both sides
      textAlign: iconName && !iconSecondaryName && !iconRight ? 'center' : (iconSecondaryName && !iconName && iconRight ? 'center' : 'left'), // Adjust text align if only one icon or specific combos
    },
    iconStyle: {
      // Additional styles for icon if needed, e.g. margin if it's an icon-only button
    },
    iconSecondary: {
      marginLeft: title ? theme.spacing.sm : 0, // Add margin if there is text
    }
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.85} // Controls opacity on press for TouchableOpacity
      style={[styles.touchableStyle, style]}
      {...rest}
    >
      <NeumorphicView
        type={currentNeumorphicType}
        size={neumorphicSize}
        style={[styles.neumorphicContainer, { backgroundColor: baseBackgroundColor }, containerStyle]}
      >
        {children ? children : (
          <>
            {iconName && (
              <Ionicons 
                name={iconName} 
                size={iconSize} 
                color={currentIconColor} 
                style={styles.iconStyle} 
              />
            )}
            {title && (
              <AppText variant="button" style={[styles.text, { color: currentTextColor }, textStyle]}>
                {title}
              </AppText>
            )}
            {iconSecondaryName && (
              <Ionicons
                name={iconSecondaryName}
                size={iconSecondarySize}
                color={iconSecondaryColor || currentIconColor} // Defaults to currentIconColor
                style={[styles.iconSecondary, iconSecondaryStyle]}
              />
            )}
          </>
        )}
      </NeumorphicView>
    </TouchableOpacity>
  );
};

export default NeumorphicButton; 