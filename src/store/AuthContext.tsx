import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../api/authService'; // Assuming User interface is exported from authService

const TOKEN_KEY = 'my-auth-token';
const USER_KEY = 'my-auth-user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // For checking auth state on app load
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updatedUserData: User) => Promise<void>; // For updating user after onboarding etc.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to check stored auth state

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUserString = await SecureStore.getItemAsync(USER_KEY);
        
        if (storedToken && storedUserString) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserString));
        }
      } catch (e) {
        console.error('Failed to load auth data from storage', e);
        // Handle error, maybe clear storage if corrupted
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const login = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, authToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to save auth data to storage', e);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.error('Failed to delete auth data from storage', e);
    }
  };

  const updateUserInContext = async (updatedUserData: User) => {
    setUser(updatedUserData);
    try {
        // Ensure user data in secure store is also updated
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUserData));
    } catch (e) {
        console.error('Failed to update user data in storage', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 