/**
 * Authentication Service
 *
 * Handles user authentication state and operations in React Native
 * Manages login, logout, registration, and user profile updates
 * Integrates with local storage for token persistence
 */

import { storeData, getData } from './LocalStorage';

/**
 * Authentication state interface
 */
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Login response interface
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Authentication service class
 * Manages all authentication-related operations
 */
class AuthService {
  private _currentUser: User | null = null;
  private _isAuthenticated: boolean = false;

  /**
   * Initialize authentication service
   * Check for existing token and restore user state
   */
  async initialize(): Promise<void> {
    try {
      const userData = await getData('user');
      if (userData) {
        this._currentUser = userData;
        this._isAuthenticated = true;
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      // Reset auth state on error
      this._isAuthenticated = false;
      this._currentUser = null;
    }
  }

  /**
   * Register new user
   */
  async register(userData: {
    name: string;
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      // For local storage, we don't need authentication
      const response: AuthResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          user: { id: '1', email: userData.email },
          token: 'dummy-token',
        },
      };

      // Store authentication data
      await storeData('user', response.data.user);

      // Update internal state
      this._currentUser = response.data.user;
      this._isAuthenticated = true;

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    try {
      // For local storage, we don't need authentication
      const response: LoginResponse = {
        success: true,
        message: 'User logged in successfully',
        data: {
          user: { id: '1', email: credentials.email },
          token: 'dummy-token',
        },
      };

      // Store authentication data
      await storeData('user', response.data.user);

      // Update internal state
      this._currentUser = response.data.user;
      this._isAuthenticated = true;

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Clear stored data
      await storeData('user', null);

      // Reset internal state
      this._currentUser = null;
      this._isAuthenticated = false;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local data
      await storeData('user', null);
      this._currentUser = null;
      this._isAuthenticated = false;
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      if (!this._isAuthenticated) {
        return null;
      }

      // If we have cached user data, return it
      if (this._currentUser) {
        return this._currentUser;
      }

      // Otherwise fetch from local storage
      const userData = await getData('user');
      if (userData) {
        this._currentUser = userData;
        return this._currentUser;
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Reset auth state on error
      this._isAuthenticated = false;
      this._currentUser = null;
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: {
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
  }): Promise<User> {
    try {
      // Update cached user data
      this._currentUser = { ...this._currentUser, ...profileData };

      // Update stored user data
      await storeData('user', this._currentUser);

      return this._currentUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    try {
      // For local storage, we don't need to change password
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn(): boolean {
    return this._isAuthenticated;
  }

  /**
   * Get current user (cached)
   */
  getCurrentUserSync(): User | null {
    return this._currentUser;
  }

  /**
   * Refresh user profile from server
   */
  async refreshProfile(): Promise<User | null> {
    try {
      // For local storage, we don't need to refresh profile
      return this._currentUser;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();

export default authService;
export { authService };
