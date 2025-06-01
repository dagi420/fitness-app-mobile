import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import for gesture handler
import { AuthProvider } from './src/store/AuthContext'; // Import AuthProvider
import { ThemeProvider } from './src/styles/ThemeProvider'; // Import ThemeProvider

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
