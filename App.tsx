import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './constants/colors';
import { spacing } from './constants/theme';

// Import screens
import { HomeScreen } from './screens/HomeScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import TasksScreen from './screens/TasksScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import FinanceScreen from './screens/FinanceScreen';
import AddQuickAction from './screens/AddQuickAction';
import ConnectionTest from './components/ConnectionTest';
import { CircularTabBar } from './components/CircularTabBar';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SpendingHistoryScreen from './screens/SpendingHistoryScreen';
import UnfinishedTasksScreen from './screens/UnfinishedTasksScreen';
import taskService from './services/taskService';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Finance: undefined;
  Add: undefined;
  Tasks: undefined;
  Profile: undefined;
};

const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();
const ProfileStack = createStackNavigator();

const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="ProfileChangePassword" component={ChangePasswordScreen} />
      <ProfileStack.Screen name="ProfileNotifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="ProfileSpendingHistory" component={SpendingHistoryScreen} />
      <ProfileStack.Screen
        name="ProfileUnfinishedTasks"
        component={UnfinishedTasksScreen}
        options={{ headerShown: true, title: 'Unfinished Tasks' }}
      />
      <ProfileStack.Screen
        name="ProfileUnfinishedGoals"
        component={UnfinishedTasksScreen}
        options={{ headerShown: true, title: 'Unfinished Goals' }}
      />
    </ProfileStack.Navigator>
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
      <MainTab.Screen name="Profile" component={ProfileNavigator} />
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
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Helper functions for AsyncStorage
export const storeData = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error storing data', e);
  }
};

export const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error('Error reading data', e);
    return null;
  }
};

// Main App component
export default function App() {
  useEffect(() => {
    const initSampleData = async () => {
      // DISABLED: Auto-archiving of expired tasks and goals
      // Tasks and goals will now stay in main lists even after their periods end
      /*
      try {
        console.log('Starting auto-archiving process...');
        const archivedCounts = await taskService.archiveAllUnfinishedItems();
        const totalArchived = archivedCounts.tasks + archivedCounts.weeklyGoals + archivedCounts.yearlyGoals;

        if (totalArchived > 0) {
          console.log(`✅ Auto-archiving complete: ${archivedCounts.tasks} tasks, ${archivedCounts.weeklyGoals} weekly goals, ${archivedCounts.yearlyGoals} yearly goals archived`);
        } else {
          console.log('ℹ️ Auto-archiving complete: No items needed archiving');
        }
      } catch (error) {
        console.error('❌ Error during auto-archiving:', error);
        console.log('This error might be due to invalid data format or date issues when testing with changed system dates');
      }
      */

      await taskService.carryOverTasks();
      const hasData = await getData('initialized');
      if (!hasData) {
        await storeData('timeEntries', [
          { id: '1', project: 'Project Alpha', start: '2023-10-18T09:00', end: '2023-10-18T10:30' }
        ]);
        await storeData('initialized', true);
      }
    };
    initSampleData();
  }, []);

  return (
    <AppContent />
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
