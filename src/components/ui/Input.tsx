import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import theme from '../../styles/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [
        error ? theme.colors.light.error : 'rgba(255, 255, 255, 0.2)',
        error ? theme.colors.light.error : theme.colors.light.primary,
      ]
    );

    return {
      borderColor,
      borderWidth: withTiming(focusAnimation.value === 1 ? 2 : 1, { duration: 200 }),
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnimation.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnimation.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: theme.spacing.md,
    };

    return baseStyle;
  };

  const getInputContainerStyle = (): ViewStyle => {
    const padding = size === 'sm' ? theme.spacing.sm : size === 'lg' ? theme.spacing.lg : theme.spacing.md;
    
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borders.radiusLarge,
      paddingHorizontal: padding,
      paddingVertical: padding * 0.75,
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.light.surface,
        };
      default:
        return baseStyle;
    }
  };

  const getInputStyle = (): TextStyle => {
    const fontSize = size === 'sm' ? theme.typography.fontSizes.sm : 
                    size === 'lg' ? theme.typography.fontSizes.lg : 
                    theme.typography.fontSizes.md;

    return {
      flex: 1,
      color: theme.colors.light.textPrimary,
      fontSize: fontSize,
      paddingVertical: 0,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      color: error ? theme.colors.light.error : theme.colors.light.textSecondary,
      marginBottom: theme.spacing.xs,
    };
  };

  const getHelperTextStyle = (): TextStyle => {
    return {
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.normal,
      color: error ? theme.colors.light.error : theme.colors.light.textSecondary,
      marginTop: theme.spacing.xs,
    };
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>
          {label}
        </Text>
      )}
      
      <AnimatedView style={[getInputContainerStyle(), animatedBorderStyle]}>
        {leftIcon && (
          <View style={{ marginRight: theme.spacing.sm }}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholderTextColor={theme.colors.light.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />
        
        {rightIcon && (
          <View style={{ marginLeft: theme.spacing.sm }}>
            {rightIcon}
          </View>
        )}
      </AnimatedView>
      
      {(error || hint) && (
        <Text style={getHelperTextStyle()}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}; 