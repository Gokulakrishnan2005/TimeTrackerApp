/**
 * Authentication Context
 *
 * Provides authentication state management across the React Native app
 * Handles login, logout, and user state persistence
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService from '../services/authService';
import { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: { name?: string; username?: string; email?: string; avatar?: string }) => Promise<void>;
  updatePassword: (passwordData: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await authService.initialize();
      const currentUser = authService.getCurrentUserSync();
      setUser(currentUser);
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: { name: string; username: string; email: string; password: string }) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
    }
  };

  const updateProfile = async (profileData: { name?: string; username?: string; email?: string; avatar?: string }) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updatePassword = async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      await authService.changePassword(passwordData);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
