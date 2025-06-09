import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAppTheme } from '../styles/useAppTheme';

export type TextVariant = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'body1' 
  | 'body2' 
  | 'caption' 
  | 'button' 
  | 'label';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({ 
  variant = 'body1',
  style,
  children,
  ...props 
}) => {
  const theme = useAppTheme();

  // Get the typography styles for this variant
  const variantStyle = theme.typography.variants[variant];

  return (
    <Text
      style={[
        variantStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}; 