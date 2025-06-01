import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useAppTheme } from '../../styles/useAppTheme';
import { typography as themeTypography, colors as themeColors } from '../../styles/theme'; // Import specific parts

// Define keys for typography variants and color names for stricter prop typing
type TypographyVariant = keyof typeof themeTypography.variants;
type ColorName = keyof typeof themeColors.light; // Assuming light/dark have same color names

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorName | string; // Allow specific color names or a custom hex/rgb string
  fontWeight?: keyof typeof themeTypography.fontWeights;
  fontSize?: number;
  textAlign?: TextStyle['textAlign'];
  children?: React.ReactNode;
}

const AppText: React.FC<AppTextProps> = ({
  variant = 'body1',
  color,
  fontWeight,
  fontSize,
  textAlign,
  style, // User-provided styles
  children,
  ...rest
}) => {
  const theme = useAppTheme();

  // Determine the base style from the variant
  let baseStyle: TextStyle = theme.typography.variants[variant] || theme.typography.variants.body1;

  // Determine text color
  let textColor: string;
  if (typeof color === 'string') {
    // Check if it's a key of our theme colors
    if (theme.currentColors[color as ColorName]) {
      textColor = theme.currentColors[color as ColorName];
    } else {
      textColor = color; // Assume it's a custom color string like hex/rgb
    }
  } else {
    textColor = theme.currentColors.textPrimary; // Default to textPrimary
  }

  // Apply specific overrides if provided
  const overrideStyles: TextStyle = {};
  if (fontWeight && theme.typography.fontWeights[fontWeight]) {
    overrideStyles.fontWeight = theme.typography.fontWeights[fontWeight];
  }
  if (fontSize) {
    overrideStyles.fontSize = fontSize;
  }
  if (textAlign) {
    overrideStyles.textAlign = textAlign;
  }

  const finalStyle = StyleSheet.flatten([
    baseStyle,
    { color: textColor }, // Apply the determined text color
    overrideStyles,
    style, // Apply user-provided styles last
  ]);

  return (
    <Text style={finalStyle} {...rest}>
      {children}
    </Text>
  );
};

export default AppText; 