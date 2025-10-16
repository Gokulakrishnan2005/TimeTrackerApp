import { FC } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "./screens/HomeScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { TasksScreen } from "./screens/TasksScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { CircularTabBar } from "./components/CircularTabBar";

const Tab = createBottomTabNavigator();

const AddScreen: FC = () => {
  return <View style={{ flex: 1 }} />; // Empty view as placeholder
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CircularTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Add" component={AddScreen} />
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
