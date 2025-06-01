import React, { createContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme, Appearance } from 'react-native';
import theme, { colors, AppTheme, ColorScheme } from './theme';

interface ThemeContextProps extends AppTheme {
  setScheme: (scheme: ColorScheme) => void;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialScheme?: ColorScheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialScheme }) => {
  const deviceScheme = useDeviceColorScheme();
  const [currentScheme, setCurrentScheme] = useState<ColorScheme>(
    initialScheme || deviceScheme || 'light'
  );

  // Listen to device theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (!initialScheme) { // Only update if no initialScheme is forced
        setCurrentScheme(colorScheme || 'light');
      }
    });
    return () => subscription.remove();
  }, [initialScheme]);

  const setScheme = (scheme: ColorScheme) => {
    setCurrentScheme(scheme);
  };

  const currentColors = useMemo(() => {
    return colors[currentScheme];
  }, [currentScheme]);

  const activeTheme: AppTheme = useMemo(() => ({
    ...theme,
    currentScheme: currentScheme,
    currentColors: currentColors,
  }), [currentScheme, currentColors]);

  const contextValue = useMemo(() => ({
    ...activeTheme,
    setScheme,
  }), [activeTheme, setScheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}; 