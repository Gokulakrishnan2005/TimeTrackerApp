import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { colors } from './constants/colors';
import { spacing } from './constants/theme';

// Import screens
import { HomeScreen } from './screens/HomeScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import TasksScreen from './screens/TasksScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import FinanceScreen from './screens/FinanceScreen';
import AddQuickAction from './screens/AddQuickAction';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import ConnectionTest from './components/ConnectionTest';
import { CircularTabBar } from './components/CircularTabBar';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Finance: undefined;
  Add: undefined;
  Tasks: undefined;
  Profile: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Authentication navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      {/* ConnectionTest available but not in main flow */}
    </AuthStack.Navigator>
  );
};

// Main app navigator with tabs
const MainNavigator = () => {
  return (
    <MainTab.Navigator
      tabBar={(props) => <CircularTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Finance" component={FinanceScreen} />
      <MainTab.Screen name="Add" component={AddQuickAction} />
      <MainTab.Screen name="Tasks" component={TasksScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
};

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

// Main app component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Main App component
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
