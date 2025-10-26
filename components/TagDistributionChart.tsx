import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { TagDistributionData } from '../services/analyticsService';
import { colors } from '../constants/colors';
import { resolveTagColor, resolveTagLabel } from '../constants/sessionTags';
import { typography, spacing, radii } from '../constants/theme';

interface TagDistributionChartProps {
  data: TagDistributionData[];
}

export const TagDistributionChart: React.FC<TagDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Tag Distribution</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No tagged sessions yet. Tag a session to see the distribution here.</Text>
        </View>
      </View>
    );
  }

  const chartData = data.map(item => ({
    name: resolveTagLabel(item.tag) || item.tag,
    population: item.minutes,
    color: resolveTagColor(item.tag),
    legendFontColor: colors.textPrimary,
    legendFontSize: 14,
  }));

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - (spacing.xl * 2), 340);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tag Distribution</Text>
      <PieChart
        data={chartData}
        width={chartWidth}
        height={220}
        chartConfig={{
          color: (opacity = 1) => colors.textPrimary,
          labelColor: (opacity = 1) => colors.textPrimary,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
        hasLegend={false}
      />
      <View style={styles.legendContainer}>
        {data.map(item => (
          <View key={item.tag} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: resolveTagColor(item.tag) }]} />
            <Text style={styles.legendLabel}>{resolveTagLabel(item.tag) || item.tag}</Text>
            <Text style={styles.legendValue}>{item.percentage.toFixed(1)}%</Text>
            <Text style={styles.legendValue}>{item.minutes.toFixed(0)} M</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legendContainer: {
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  legendLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  legendValue: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
});
