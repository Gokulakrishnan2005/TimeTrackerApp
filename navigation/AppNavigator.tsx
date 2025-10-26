import React from 'react';
import { FC } from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/HomeScreen";
import TasksScreen from "../screens/TasksScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import FinanceScreen from '../screens/FinanceScreen';
import AddQuickAction from '../screens/AddQuickAction';
import { CircularTabBar } from '../components/CircularTabBar';
import WishlistScreen from '../screens/WishlistScreen';
import SpendingHistoryScreen from '../screens/SpendingHistoryScreen';
import UnfinishedTasksScreen from '../screens/UnfinishedTasksScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { AccomplishedTasksScreen } from '../screens/AccomplishedTasksScreen';

export type RootTabParamList = {
  Home: undefined;
  Finance: undefined;
  Add: undefined;
  Tasks: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Wishlist: undefined;
  ProfileNotifications: undefined;
  ProfileSpendingHistory: undefined;
  ProfileUnfinishedTasks: { type: 'tasks' | 'goals' };
  ProfileUnfinishedGoals: { type: 'tasks' | 'goals' };
  ProfileAccomplishedTasks: undefined;
};

const ProfileStack = createStackNavigator<ProfileStackParamList>();

const ProfileStackNavigator: FC = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          headerShown: true,
          title: 'Future Purchases & Wishlist',
          headerBackTitle: 'Back',
        }}
      />
      <ProfileStack.Screen
        name="ProfileNotifications"
        component={NotificationsScreen}
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Back',
        }}
      />
      <ProfileStack.Screen
        name="ProfileSpendingHistory"
        component={SpendingHistoryScreen}
        options={{
          headerShown: true,
          title: 'Spending History',
          headerBackTitle: 'Back',
        }}
      />
      <ProfileStack.Screen
        name="ProfileUnfinishedTasks"
        component={UnfinishedTasksScreen}
        options={{
          headerShown: true,
          title: 'Unfinished Tasks',
          headerBackTitle: 'Back',
        }}
      />
       <ProfileStack.Screen
        name="ProfileUnfinishedGoals"
        component={UnfinishedTasksScreen}
        options={{
          headerShown: true,
          title: 'Unfinished Goals',
          headerBackTitle: 'Back',
        }}
      />
      <ProfileStack.Screen
        name="ProfileAccomplishedTasks"
        component={AccomplishedTasksScreen}
        options={{
          headerShown: true,
          title: 'Accomplished Tasks',
          headerBackTitle: 'Back',
        }}
      />
    </ProfileStack.Navigator>
  );
}

export type RootStackParamList = {
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Main tab navigator
const MainTabNavigator: FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CircularTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="Add" component={AddQuickAction} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

// Root stack navigator
export const AppNavigator: FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >  
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};