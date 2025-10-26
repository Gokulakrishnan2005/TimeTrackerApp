import { FC, useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { colors } from "../constants/colors";
import { radii, spacing, typography } from "../constants/theme";
import { Session } from "../services/session";

const HOURS_IN_MS = 1000 * 60 * 60;

const toChartData = (sessions: Session[]) =>
  sessions.map((session, index) => ({
    sessionNumber: session.sessionNumber ?? index + 1,
    durationHours: Math.max(0, Number((session.duration / HOURS_IN_MS).toFixed(2))),
  }));

export interface DurationTrendChartProps {
  sessions: Session[];
}

export const DurationTrendChart: FC<DurationTrendChartProps> = ({ sessions }) => {
  const chartData = useMemo(() => toChartData(sessions), [sessions]);
  const hasEnoughData = chartData.length >= 2;

  if (!hasEnoughData) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.title}>Progress Trend</Text>
        <Text style={styles.emptyText}>Not enough data. Start tracking sessions to see trends.</Text>
      </View>
    );
  }

  // Mobile-first approach using react-native-chart-kit
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - (spacing.xl * 2), 360);
  const labels = chartData.map(d => `S${d.sessionNumber}`);
  const dataPoints = chartData.map(d => d.durationHours);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Trend</Text>
      <LineChart
        data={{
          labels: labels,
          datasets: [{ data: dataPoints }],
        }}
        width={chartWidth}
        height={220}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`, // Slate-600 for professional look
          labelColor: (opacity = 1) => colors.textSecondary,
          style: {
            borderRadius: radii.lg,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: colors.primary,
            fill: colors.surface,
          },
        }}
        bezier
        style={{
          marginVertical: spacing.sm,
          borderRadius: radii.lg,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 0,
    alignSelf: "stretch",
    width: "100%",
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 3,
    overflow: "hidden",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
    alignSelf: "flex-start",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
