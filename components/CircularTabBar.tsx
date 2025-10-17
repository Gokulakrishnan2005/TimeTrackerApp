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
  const iconColor = focused ? colors.surface : "#A0A0A0";
  const size = routeName === "Add" ? 28 : 24;

  switch (routeName) {
    case "Home":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
            stroke={iconColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 22V12H15V22"
            stroke={iconColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "Analytics":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M18 20V10M12 20V4M6 20V14"
            stroke={iconColor}
            strokeWidth={2}
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
            d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15"
            stroke={iconColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 3H15V5H9V3Z"
            stroke={iconColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 12L11 14L15 10"
            stroke={iconColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case "Profile":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle
            cx="12"
            cy="7"
            r="4"
            stroke={iconColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5.5 21C5.5 17.9624 7.96243 15.5 11 15.5H13C16.0376 15.5 18.5 17.9624 18.5 21"
            stroke={iconColor}
            strokeWidth={2}
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
