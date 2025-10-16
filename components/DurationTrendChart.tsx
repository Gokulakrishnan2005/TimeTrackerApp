import { FC, useMemo } from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
} from "victory";
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

  // Use react-native-chart-kit for mobile
  if (Platform.OS !== 'web') {
    const screenWidth = Dimensions.get('window').width - spacing.xl * 6;
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
          width={Math.max(screenWidth, 280)}
          height={200}
          chartConfig={{
            backgroundColor: colors.surface,
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '7',
              strokeWidth: '3',
              stroke: colors.primary,
              fill: colors.surface,
            },
          }}
          bezier
          style={{
            marginVertical: spacing.sm,
            borderRadius: 16,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Trend</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        height={260}
        padding={{ top: 40, bottom: 60, left: 60, right: 40 }}
      >
        <VictoryAxis
          tickFormat={(tick: number) => `S${tick}`}
          style={{
            axis: { stroke: "transparent" },
            ticks: { stroke: "transparent" },
            tickLabels: {
              ...typography.caption,
              fill: colors.textSecondary,
              angle: -25,
              padding: 18,
            },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(tick: number) => `${tick}h`}
          style={{
            axis: { stroke: "transparent" },
            grid: { stroke: "rgba(59, 89, 152, 0.15)", strokeDasharray: "4 4" },
            tickLabels: {
              ...typography.caption,
              fill: colors.textSecondary,
            },
          }}
        />
        <VictoryLine
          data={chartData}
          x="sessionNumber"
          y="durationHours"
          style={{
            data: {
              stroke: colors.primary,
              strokeWidth: 3,
            },
          }}
          animate={{ duration: 600, easing: "quadInOut" }}
          interpolation="monotoneX"
        />
        <VictoryScatter
          data={chartData}
          x="sessionNumber"
          y="durationHours"
          size={5}
          style={{
            data: { fill: colors.surface, stroke: colors.primary, strokeWidth: 2 },
          }}
          animate={{ duration: 500, easing: "quadInOut" }}
        />
      </VictoryChart>
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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
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
