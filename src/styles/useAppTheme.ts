import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { AppTheme } from './theme';

export const useAppTheme = (): AppTheme & { setScheme: (scheme: 'light' | 'dark') => void } => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}; 