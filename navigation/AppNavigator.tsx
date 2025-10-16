import { FC } from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/HomeScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { TasksScreen } from "../screens/TasksScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

export type RootTabParamList = {
  Home: undefined;
  Analytics: undefined;
  Add: undefined;
  Tasks: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Placeholder for Add screen (can be a modal or action)
const AddScreen: FC = () => {
  return <View style={{ flex: 1 }} />; // Empty view as placeholder
};

export const AppNavigator: FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
        />
        <Tab.Screen
          name="Add"
          component={AddScreen}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};
