import { FC, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { radii, spacing, typography } from "../constants/theme";
import { formatDateTime } from "../utils/time";
import { Session } from "../services/session";

const truncateText = (text: string, limit = 40): string =>
  text.length > limit ? `${text.slice(0, limit)}...` : text;

const tableHeaders = [
  { label: "#", key: "sessionNumber", flex: 0.5, minWidth: 50 },
  { label: "Started", key: "startDateTime", flex: 2, minWidth: 160 },
  { label: "Ended", key: "endDateTime", flex: 2, minWidth: 160 },
  { label: "Duration", key: "duration", flex: 1, minWidth: 90 },
  { label: "Notes", key: "experience", flex: 2.5, minWidth: 150 },
] as const;

export interface SessionsTableProps {
  sessions: Session[];
  fallbackText?: string;
  onRowPress?: (session: Session) => void;
  onRowLongPress?: (session: Session) => void;
}

const formatDurationMs = (duration: number): string => {
  if (duration <= 0) {
    return "--";
  }

  const totalMinutes = Math.round(duration / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} MIN`;
  }

  return minutes === 0 ? `${hours} HRS` : `${hours} HRS ${minutes} MIN`;
};

export const SessionsTable: FC<SessionsTableProps> = ({
  sessions,
  fallbackText = "Completed sessions will appear here.",
  onRowPress,
  onRowLongPress,
}) => {
  const rows = useMemo(() => sessions, [sessions]);
  const mountAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    mountAnimation.setValue(0);
    Animated.timing(mountAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [rows, mountAnimation]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.tableContainer}>
        <View style={styles.headerRow}>
          {tableHeaders.map((header) => (
            <Text key={header.key} style={[styles.headerCell, { flex: header.flex, minWidth: header.minWidth }]}>
              {header.label}
            </Text>
          ))}
        </View>

        {rows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{fallbackText}</Text>
          </View>
        ) : (
          rows.map((session, index) => {
            const isEven = index % 2 === 0;
            const rowAnimatedStyle = {
              opacity: mountAnimation,
              transform: [
                {
                  translateY: mountAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            } as const;
            return (
              <Animated.View key={session.id} style={rowAnimatedStyle}>
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    !isEven && styles.altRow,
                    pressed && styles.rowPressed,
                  ]}
                  android_ripple={{ color: "rgba(59, 89, 152, 0.08)" }}
                  onPress={() => onRowPress?.(session)}
                  onLongPress={() => onRowLongPress?.(session)}
                  delayLongPress={350}
                >
                  <Text style={[styles.cell, styles.centerCell, { flex: tableHeaders[0].flex, minWidth: tableHeaders[0].minWidth }]}>
                    {session.sessionNumber}
                  </Text>
                  <Text style={[styles.cell, { flex: tableHeaders[1].flex, minWidth: tableHeaders[1].minWidth }]} numberOfLines={1} ellipsizeMode="tail">
                    {formatDateTime(session.startDateTime)}
                  </Text>
                  <Text style={[styles.cell, { flex: tableHeaders[2].flex, minWidth: tableHeaders[2].minWidth }]} numberOfLines={1} ellipsizeMode="tail">
                    {session.endDateTime ? formatDateTime(session.endDateTime) : "--"}
                  </Text>
                  <Text style={[styles.cell, { flex: tableHeaders[3].flex, minWidth: tableHeaders[3].minWidth }]} numberOfLines={1}>
                    {formatDurationMs(session.duration)}
                  </Text>
                  <Text
                    style={[styles.cell, { flex: tableHeaders[4].flex, minWidth: tableHeaders[4].minWidth }]}
                    numberOfLines={2}
                  >
                    {truncateText(session.experience, 70)}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    minWidth: 650,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerCell: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: spacing.md,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  altRow: {
    backgroundColor: colors.background,
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cell: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    flexShrink: 1,
  },
  centerCell: {
    textAlign: "center",
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
