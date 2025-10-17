/**
 * Authentication Service
 *
 * Handles user authentication state and operations in React Native
 * Manages login, logout, registration, and user profile updates
 * Integrates with AsyncStorage for token persistence
 */

import { authAPI, authStorage } from './api';

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
      const isAuth = await authStorage.isAuthenticated();
      this._isAuthenticated = isAuth;

      if (isAuth) {
        const userData = await authStorage.getUserData();
        if (userData) {
          this._currentUser = userData;
        }
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
      const response: AuthResponse = await authAPI.register(userData);

      if (response.success) {
        // Store authentication data
        await authStorage.storeAuthData(response.data.token, response.data.user);

        // Update internal state
        this._currentUser = response.data.user;
        this._isAuthenticated = true;
      }

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
      const response: LoginResponse = await authAPI.login(credentials);

      if (response.success) {
        // Store authentication data
        await authStorage.storeAuthData(response.data.token, response.data.user);

        // Update internal state
        this._currentUser = response.data.user;
        this._isAuthenticated = true;
      }

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
      // Call logout API (optional, for cleanup)
      await authAPI.logout();

      // Clear stored data
      await authStorage.clearAuthData();

      // Reset internal state
      this._currentUser = null;
      this._isAuthenticated = false;

    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local data
      await authStorage.clearAuthData();
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

      // Otherwise fetch from API
      const response = await authAPI.getProfile();

      if (response.success) {
        this._currentUser = response.data.user;
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
      const response = await authAPI.updateProfile(profileData);

      if (response.success) {
        // Update cached user data
        this._currentUser = response.data.user;

        // Update stored user data
        await authStorage.storeAuthData(
          await authStorage.getToken() || '',
          this._currentUser
        );

        return this._currentUser;
      }

      throw new Error(response.error || 'Failed to update profile');
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
      const response = await authAPI.changePassword(passwordData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
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
      const response = await authAPI.getProfile();

      if (response.success) {
        this._currentUser = response.data.user;
        return this._currentUser;
      }

      return null;
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
