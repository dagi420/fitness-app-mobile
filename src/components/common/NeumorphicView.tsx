import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useAppTheme } from '../../styles/useAppTheme';
import { getNeumorphicStyles as getBaseNeumorphicStyles, neumorphicShadowOffset, borders as themeBorders, neumorphicShadowOpacity } from '../../styles/theme'; // Import more theme parts

export interface NeumorphicViewProps extends ViewProps {
  type?: 'raised' | 'pressedIn' | 'flat';
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  borderRadius?: number;
  backgroundColor?: string;
  // style?: ViewStyle; // Already part of ViewProps, ensure it's correctly merged
}

const NeumorphicView: React.FC<NeumorphicViewProps> = ({
  type = 'raised',
  size = 'medium',
  children,
  style, // User-provided styles
  borderRadius: customBorderRadius,
  backgroundColor: customBackgroundColor,
  ...rest
}) => {
  const theme = useAppTheme();
  const baseStylesFromTheme = getBaseNeumorphicStyles(theme.currentColors, type, size);
  const offsetConfig = neumorphicShadowOffset[size];

  const resolvedBorderRadius = customBorderRadius !== undefined ? customBorderRadius : baseStylesFromTheme.borderRadius;
  const resolvedBackgroundColor = customBackgroundColor || baseStylesFromTheme.backgroundColor;

  if (type === 'raised') {
    const lightShadowColor = theme.currentColors.shadowLight;
    const darkShadowColor = theme.currentColors.shadowDark;
    const shadowRadiusValue = offsetConfig.width * 1.8; // Increased radius for softer, more spread shadow
    const shadowOpacityValue = neumorphicShadowOpacity * 0.8; // Slightly reduced opacity for softer feel

    const shadowCommonStyles: ViewStyle = {
      borderRadius: resolvedBorderRadius,
      ...StyleSheet.absoluteFillObject, // Make shadow views fill the parent wrapper
    };

    const shadowLightStyle: ViewStyle = {
      ...shadowCommonStyles,
      shadowColor: lightShadowColor,
      shadowOffset: { width: -offsetConfig.width, height: -offsetConfig.height },
      shadowOpacity: shadowOpacityValue,
      shadowRadius: shadowRadiusValue,
    };
    const shadowDarkStyle: ViewStyle = {
      ...shadowCommonStyles,
      shadowColor: darkShadowColor,
      shadowOffset: { width: offsetConfig.width, height: offsetConfig.height },
      shadowOpacity: shadowOpacityValue,
      shadowRadius: shadowRadiusValue,
    };

    const contentContainerStyle: ViewStyle = {
      backgroundColor: resolvedBackgroundColor,
      borderRadius: resolvedBorderRadius,
      overflow: 'hidden', // Ensures children conform to border radius
    };
    
    // The main NeumorphicView applies the user's style (including dimensions, margins) and elevation for Android.
    // Shadow views are inside and absolutely positioned.
    // Note: For Android elevation to work with absolute children, the parent needs a background color.
    // We use resolvedBackgroundColor on the wrapper as well for Android compatibility if type is raised.
    const wrapperStyle = StyleSheet.flatten([
      Platform.OS === 'android' ? { backgroundColor: resolvedBackgroundColor } : {},
      styles.raisedWrapper, // Basic wrapper style
      { borderRadius: resolvedBorderRadius }, // Wrapper also needs border radius for clipping shadows if necessary
      baseStylesFromTheme, // This will bring elevation for Android from getNeumorphicStyles
      style, // User-supplied styles (margins, width, height etc.)
    ]);

    return (
      <View style={wrapperStyle} {...rest}>
        {Platform.OS === 'ios' && <View style={shadowLightStyle} />}
        {Platform.OS === 'ios' && <View style={shadowDarkStyle} />} 
        {/* On Android, elevation from wrapperStyle is the primary shadow. Layered shadows are hard. */}
        {/* We could try to render them but they might not look good or behave as expected. */} 
        {/* For now, relying on Android elevation for raised effect. */} 
        <View style={contentContainerStyle}>{children}</View>
      </View>
    );
  } else {
    // For 'pressedIn' and 'flat', use the styles directly from getBaseNeumorphicStyles
    const finalStyle = StyleSheet.flatten([
      baseStylesFromTheme, // This includes shadows for pressedIn and flat
      customBackgroundColor ? { backgroundColor: customBackgroundColor } : {},
      customBorderRadius !== undefined ? { borderRadius: customBorderRadius } : {},
      style, // Apply user-provided styles last
    ]);

    return (
      <View style={finalStyle} {...rest}>
        {children}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  // Wrapper for Android elevation, as true multiple shadow layers are not directly supported.
  // The elevation will be on this parent, and the inner views simulate iOS-like shadows.
  raisedWrapper: {
    // Ensure overflow is visible if shadows were to be clipped by this parent for iOS
    // However, with absoluteFillObject, shadows are *inside* this view.
    // overflow: 'visible',
  },
});

export default NeumorphicView; 