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
import { resolveTagColor, resolveTagLabel } from "../constants/sessionTags";
import { formatDateTime } from "../utils/time";
import { Session } from "../services/session";

const truncateText = (text: string, limit = 25): string =>
  text.length > limit ? `${text.slice(0, limit)}...` : text;

const tableHeaders = [
  { label: "#", key: "sessionNumber", flex: 0.3, minWidth: 30 },
  { label: "Started", key: "startDateTime", flex: 1, minWidth: 75 },
  { label: "Ended", key: "endDateTime", flex: 1, minWidth: 75 },
  { label: "Duration", key: "duration", flex: 0.7, minWidth: 55 },
  { label: "Notes", key: "experience", flex: 1.3, minWidth: 70 },
  { label: "Tag", key: "tag", flex: 0.7, minWidth: 60 },
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
      useNativeDriver: false,
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
                    {truncateText(session.experience, 50)}
                  </Text>
                  <View
                    style={[styles.cell, styles.tagCell, { flex: tableHeaders[5].flex, minWidth: tableHeaders[5].minWidth }]}
                  >
                    <TagChip tag={session.tag} />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const TagChip: FC<{ tag: string | null }> = ({ tag }) => {
  const label = resolveTagLabel(tag);
  if (!label) {
    return <Text style={styles.tagFallback}>-</Text>;
  }
  const backgroundColor = resolveTagColor(tag);
  return (
    <View style={[styles.tagChip, { backgroundColor }]}
    >
      <Text style={styles.tagChipLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    minWidth: 380,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: colors.surface,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 3,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerCell: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: spacing.xs,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.md,
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
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
    flexShrink: 1,
  },
  centerCell: {
    textAlign: "center",
  },
  tagCell: {
    justifyContent: "flex-start",
  },
  tagChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagChipLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.surface,
    letterSpacing: 0.4,
    textTransform: "capitalize",
  },
  tagFallback: {
    ...typography.body,
    color: colors.textSecondary,
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
