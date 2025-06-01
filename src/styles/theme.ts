export type ColorScheme = 'light' | 'dark';

// Neumorphic Base Colors - Inspired by the provided image
const neumorphicLightBase = '#F0F3F5'; // Lighter, off-white base for light mode
const neumorphicDarkBase = '#2A2E32'; // Darker charcoal for dark mode (adjust as needed)

// Helper to lighten or darken a color - basic version
// A more sophisticated version might handle HSL for better results
const shadeColor = (color: string, percent: number) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(String(R * (100 + percent) / 100));
  G = parseInt(String(G * (100 + percent) / 100));
  B = parseInt(String(B * (100 + percent) / 100));

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = (R > 0) ? R : 0;
  G = (G > 0) ? G : 0;
  B = (B > 0) ? B : 0;

  const RR = ((R.toString(16).length === 1) ? '0' + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? '0' + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? '0' + B.toString(16) : B.toString(16));

  return '#' + RR + GG + BB;
};

export const colors = {
  light: {
    primary: '#007AFF', 
    secondary: '#5856D6',
    accent: '#4CAF50', // Vibrant Green from image (approximate)
    accentSecondary: '#FFA726', // Orange/Yellow accent from progress bar (approximate)

    // Neumorphic specifics
    base: neumorphicLightBase,
    shadowLight: shadeColor(neumorphicLightBase, 15),  // More intense lighter shadow
    shadowDark: shadeColor(neumorphicLightBase, -15), // More intense darker shadow
    
    background: '#FFFFFF', // Pure white background for the screen, cards will use 'base'
    surface: neumorphicLightBase, // Elements like cards will use this base for Neumorphic effect

    textPrimary: shadeColor(neumorphicLightBase, -75), // Darker gray for high contrast text
    textSecondary: shadeColor(neumorphicLightBase, -55), // Medium gray
    textOnPrimary: '#FFFFFF', // Text on primary colored elements

    border: shadeColor(neumorphicLightBase, -15), // Subtle borders if needed
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    
    tabBarActive: '#007AFF',
    tabBarInactive: shadeColor(neumorphicLightBase, -40),
    buttonText: '#FFFFFF',
    disabled: shadeColor(neumorphicLightBase, -15), // Softer disabled state 

    // Neumorphic Tab Bar specific colors
    tabBarBackgroundNeumorphic: neumorphicLightBase,
    tabBarActiveTintColorNeumorphic: shadeColor(neumorphicLightBase, -30), // Darker than base for pressed-in feel
    tabBarInactiveTintColorNeumorphic: shadeColor(neumorphicLightBase, -50), // Standard inactive
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    accent: '#66BB6A', // Vibrant Green for dark mode (slightly adjusted)
    accentSecondary: '#FFB74D', // Orange/Yellow for dark mode (slightly adjusted)

    // Neumorphic specifics
    base: neumorphicDarkBase,
    shadowLight: shadeColor(neumorphicDarkBase, 20), // More intense lighter shadow for dark mode
    shadowDark: shadeColor(neumorphicDarkBase, -20), // More intense darker shadow for dark mode

    background: neumorphicDarkBase, // Dark background for the screen itself
    surface: neumorphicDarkBase, // Elements like cards will use this for Neumorphic effect

    textPrimary: shadeColor(neumorphicDarkBase, 80), // Lighter gray for high contrast text
    textSecondary: shadeColor(neumorphicDarkBase, 60), // Medium light gray
    textOnPrimary: '#FFFFFF',

    border: shadeColor(neumorphicDarkBase, 10), // Subtle borders
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',

    tabBarActive: '#0A84FF',
    tabBarInactive: shadeColor(neumorphicDarkBase, 40),
    buttonText: '#FFFFFF',
    disabled: shadeColor(neumorphicDarkBase, -5), // Subtle disabled state on dark 

    // Neumorphic Tab Bar specific colors
    tabBarBackgroundNeumorphic: neumorphicDarkBase,
    tabBarActiveTintColorNeumorphic: shadeColor(neumorphicDarkBase, 30), // Lighter than base for pressed-in feel
    tabBarInactiveTintColorNeumorphic: shadeColor(neumorphicDarkBase, 50), // Standard inactive
  },
};

export const typography = {
  fonts: {
    // We'll rely on system fonts initially (San Francisco for iOS, Roboto for Android)
    // For specific custom fonts, we'd load them using expo-font and list them here.
    // Example:
    // regular: 'Inter-Regular',
    // bold: 'Inter-Bold',
    // semibold: 'Inter-SemiBold',
    // heading: 'System', // Fallback or explicit use of system default
    // body: 'System',   // Fallback or explicit use of system default
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16, // Default body text size
    lg: 18,
    xl: 20,
    xxl: 24,
    h3: 20, // For consistency with named styles below
    h2: 26,
    h1: 32,
  },
  fontWeights: {
    thin: '100' as '100',
    extralight: '200' as '200',
    light: '300' as '300',
    normal: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
    extrabold: '800' as '800',
    black: '900' as '900',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5, // Default line height for body text
    loose: 1.75,
  },
  // Predefined text variant styles
  variants: {
    h1: {
      // fontFamily: 'heading', // Use if custom heading font is defined
      fontSize: 32,
      fontWeight: 'bold' as 'bold',
    },
    h2: {
      fontSize: 26,
      fontWeight: 'bold' as 'bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold' as 'bold',
    },
    body1: {
      // fontFamily: 'body', // Use if custom body font is defined
      fontSize: 17, // Slightly larger for main body text
      fontWeight: 'normal' as 'normal',
      lineHeight: 17 * 1.5,
    },
    body2: {
      fontSize: 15,
      fontWeight: 'normal' as 'normal',
      lineHeight: 15 * 1.5,
    },
    caption: {
      fontSize: 13,
      fontWeight: 'normal' as 'normal',
      lineHeight: 13 * 1.4,
    },
    button: {
      fontSize: 17,
      fontWeight: '600' as '600', // semibold
    },
    label: { // For input labels etc.
      fontSize: 15,
      fontWeight: '500' as '500', // medium
    }
  },
};

export const spacing = {
  unit: 4,
  xs: 4,  // 1 * unit
  sm: 8,  // 2 * unit
  md: 16, // 4 * unit
  lg: 24, // 6 * unit
  xl: 32, // 8 * unit
  xxl: 48, // 12 * unit
};

export const borders = {
  radiusSmall: 8, // Slightly more rounded for Neumorphism
  radiusMedium: 12,
  radiusLarge: 20,
  widthSmall: 1,
  widthMedium: 2,
};

// Neumorphic Shadow System
export const neumorphicShadowOffset = {
  small: { width: 2, height: 2 },       // Smaller, tighter offset
  medium: { width: 4, height: 4 },      // Adjusted medium offset
  large: { width: 7, height: 7 },       // Adjusted large offset
};

export const neumorphicShadowOpacity = 0.6; // Slightly reduced global opacity

// Function to generate Neumorphic shadow styles
// type: 'raised', 'pressedIn', 'flat' (flat might just have no shadow or very subtle inset)
// shape: 'concave', 'convex', 'flat' (mainly affects how shadows are applied)
export const getNeumorphicStyles = (colorPalette: typeof colors.light, type: 'raised' | 'pressedIn' | 'flat' = 'raised', size: 'small' | 'medium' | 'large' = 'medium') => {
  const baseColor = colorPalette.base;
  const shadowLightColor = colorPalette.shadowLight;
  const shadowDarkColor = colorPalette.shadowDark;
  const offset = neumorphicShadowOffset[size];
  const borderRadius = borders.radiusMedium; // Default radius

  const commonStyles = {
    backgroundColor: baseColor,
    borderRadius: borderRadius,
  };

  if (type === 'flat') {
    return {
      ...commonStyles,
      // For a truly flat look against a different background, it might have no shadow
      // or a very subtle one to differentiate if on a similar color.
      // If screen bg is different from component bg, it might not need shadow.
      // Example: if screen is white and component is neumorphicLightBase
      shadowColor: shadowDarkColor, // Subtle shadow if needed
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.05, // Very subtle
      shadowRadius: 1,
      elevation: 1,
    };
  }

  if (type === 'pressedIn') {
    // Attempting a more pronounced inset shadow, closer to the image
    return {
      ...commonStyles,
      // Inner dark shadow (simulated by a dark shadow with positive offset, towards center)
      shadowColor: shadowDarkColor,
      shadowOffset: { width: offset.width * 0.5, height: offset.height * 0.5 }, // Pushed inwards
      shadowOpacity: neumorphicShadowOpacity * 0.5, // Slightly increased opacity
      shadowRadius: offset.width * 0.8,      
      // Inner light highlight (simulated by a light shadow with negative offset, towards center from opposite side)
      // This would ideally be a separate shadow property, but we fake it with border or another layer.
      // For simplicity, focusing on the main inner dark shadow for now.
      // Consider adding border highlights for a stronger effect:
      // borderTopColor: shadowDarkColor, 
      // borderLeftColor: shadowDarkColor,
      // borderBottomColor: shadowLightColor, 
      // borderRightColor: shadowLightColor,
      // borderWidth: 1,
      elevation: 2, 
    };
  }

  // Raised (default) - NeumorphicView now handles dual shadows for iOS.
  // This function primarily provides backgroundColor, borderRadius, and Android elevation.
  return {
    backgroundColor: commonStyles.backgroundColor, // Keep commonStyles.backgroundColor
    borderRadius: commonStyles.borderRadius,   // Keep commonStyles.borderRadius
    // No shadow properties here for 'raised', NeumorphicView handles them for iOS.
    // Android elevation is still useful.
    elevation: offset.width + 3, // Keep Android elevation as it was
  };
};

// Replace the old shadows object
export const shadows = {
  getNeumorphicStyles,
  // we can add predefined neumorphic styles here for convenience
  // e.g., raisedMedium: (colorPalette) => getNeumorphicStyles(colorPalette, 'raised', 'medium')
};

const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
};

export type AppTheme = typeof theme & {
  currentScheme: ColorScheme;
  currentColors: typeof colors.light;
};

export default theme; 