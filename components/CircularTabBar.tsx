import { FC } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "../constants/colors";
import { spacing } from "../constants/theme";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";

interface TabIconProps {
  focused: boolean;
  routeName: string;
}

const TabIcon: FC<TabIconProps> = ({ focused, routeName }) => {
  const iconColor = focused ? colors.surface : "#6B7280";
  const size = routeName === "Add" ? 28 : 26;

  switch (routeName) {
    case "Home":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M11.47 2.72a.75.75 0 0 1 1.06 0l8.75 8.5a.75.75 0 0 1-1.03 1.09l-.5-.49V21a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4a.75.75 0 0 0-.75-.75h-2a.75.75 0 0 0-.75.75v4a.75.75 0 0 1-.75.75H4.5A.75.75 0 0 1 3.75 21v-9.78l-.5.49a.75.75 0 0 1-1.03-1.09l8.75-8.5Z"
            fill={iconColor}
          />
        </Svg>
      );

    case "Finance":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle
            cx={12}
            cy={12}
            r={9}
            stroke={iconColor}
            strokeWidth={1.8}
            fill="none"
          />
          <Path
            d="M10.5 7.5h5"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M10.5 11h4a2 2 0 0 1 0 4H12"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.5 9.25h4"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M11.75 6v12"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M12 15h3"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "Add":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line
            x1="12"
            y1="5"
            x2="12"
            y2="19"
            stroke={iconColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Line
            x1="5"
            y1="12"
            x2="19"
            y2="12"
            stroke={iconColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </Svg>
      );

    case "Tasks":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M8 6.5h8A2.5 2.5 0 0 1 18.5 9v9.5A2.5 2.5 0 0 1 16 21H8A2.5 2.5 0 0 1 5.5 18.5V9A2.5 2.5 0 0 1 8 6.5Z"
            stroke={iconColor}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 4h6v2H9z"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M9 12.5l2.25 2.25L15.5 10"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "Profile":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle
            cx={12}
            cy={8.5}
            r={3.5}
            stroke={iconColor}
            strokeWidth={1.8}
            fill="none"
          />
          <Path
            d="M6.5 19.5c1.2-3.4 4.1-4.75 5.5-4.75h0c1.4 0 4.3 1.35 5.5 4.75"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    default:
      return null;
  }
};

export const CircularTabBar: FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCenter = route.name === "Add";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          // Special handling: always trigger Add tab with a changing param
          if (route.name === "Add") {
            if (!event.defaultPrevented) {
              navigation.navigate("Add", { openAt: Date.now() });
            }
            return;
          }

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessible={true}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tabButton, isCenter && styles.centerButton]}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isCenter && styles.iconContainerLarge,
                isFocused && styles.iconContainerActive,
                isFocused && isCenter && styles.iconContainerActiveCenter,
              ]}
            >
              {isFocused && (
                <View
                  style={[
                    styles.activeRing,
                    isCenter && styles.activeRingLarge,
                  ]}
                />
              )}
              <TabIcon focused={isFocused} routeName={route.name} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
  centerButton: {
    marginTop: -spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconContainerLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  iconContainerActive: {
    backgroundColor: "#4ECDC4",
  },
  iconContainerActiveCenter: {
    backgroundColor: "#4ECDC4",
  },
  activeRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FF6B6B",
    top: -4,
    left: -4,
  },
  activeRingLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    top: -4,
    left: -4,
  },
});
