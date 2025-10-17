/**
 * Signup Screen
 *
 * Handles user registration with form validation
 * Integrates with authentication context and backend API
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import { spacing, typography, radii } from '../constants/theme';

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { name, username, email, password, confirmPassword } = formData;

    if (!name.trim()) return 'Name is required';
    if (!username.trim()) return 'Username is required';
    if (!email.trim()) return 'Email is required';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';

    // Username validation
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';

    return null;
  };

  const handleSignup = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        username: formData.username.toLowerCase().trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });
      // Navigation will be handled by AuthContext
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Please try again'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Too short' };
    if (password.length < 8) return { strength: 2, label: 'Weak' };

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (score >= 3) return { strength: 4, label: 'Strong' };
    if (score >= 2) return { strength: 3, label: 'Medium' };
    return { strength: 2, label: 'Weak' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the 1% improvement journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => updateField('username', value)}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>

            {formData.password.length > 0 && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthSegment,
                        passwordStrength.strength >= level && {
                          backgroundColor: getStrengthColor(passwordStrength.strength),
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: getStrengthColor(passwordStrength.strength) }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStrengthColor = (strength: number) => {
  switch (strength) {
    case 1: return '#ef4444'; // Red
    case 2: return '#f59e0b'; // Orange
    case 3: return '#eab308'; // Yellow
    case 4: return '#22c55e'; // Green
    default: return colors.border;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 18,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...typography.body,
    color: colors.textPrimary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  showPasswordButton: {
    padding: spacing.md,
  },
  showPasswordText: {
    fontSize: 18,
  },
  passwordStrength: {
    marginTop: spacing.sm,
  },
  strengthBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  strengthSegment: {
    flex: 1,
    height: '100%',
  },
  strengthText: {
    ...typography.caption,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.heading,
    color: colors.surface,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
