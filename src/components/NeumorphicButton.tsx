import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacityProps,
} from 'react-native';
import { useAppTheme } from '../styles/useAppTheme';

export type NeumorphicType = 'raised' | 'pressedIn' | 'flat';
export type ButtonType = 'primary' | 'secondary' | 'default';

interface NeumorphicButtonProps extends TouchableOpacityProps {
  neumorphicType: NeumorphicType;
  buttonType?: ButtonType;
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  iconName?: string;
  iconSize?: number;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  neumorphicType,
  buttonType = 'default',
  containerStyle,
  children,
  iconName,
  iconSize,
  ...touchableProps
}) => {
  const theme = useAppTheme();

  // Get the base neumorphic styles from the theme
  const neumorphicStyles = theme.shadows.getNeumorphicStyles(
    theme.currentColors,
    neumorphicType,
    'small'
  );

  // Determine button background color based on type
  let backgroundColor = theme.currentColors.surface;
  if (buttonType === 'primary') {
    backgroundColor = theme.currentColors.primary;
  } else if (buttonType === 'secondary') {
    backgroundColor = theme.currentColors.secondary;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      {...touchableProps}
      style={[
        styles.button,
        neumorphicStyles,
        { backgroundColor },
        containerStyle,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
}); 