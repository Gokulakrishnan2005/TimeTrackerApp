import React from 'react';
import { FC } from "react";
import { View } from "react-native";
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/HomeScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import TasksScreen from "../screens/TasksScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import FinanceScreen from '../screens/FinanceScreen';
import AddQuickAction from '../screens/AddQuickAction';
import { colors } from '../constants/colors';
import { CircularTabBar } from '../components/CircularTabBar';

export type RootTabParamList = {
  Home: undefined;
  Finance: undefined;
  Add: undefined;
  Tasks: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator();

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
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
