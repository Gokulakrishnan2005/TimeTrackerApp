import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { colors } from '../constants/colors';
import { resolveTagColor, resolveTagLabel } from '../constants/sessionTags';
import { typography, spacing, radii } from '../constants/theme';
import { getLocalAnalytics } from '../services/localAnalyticsService';
import { TimePeriod, TagDistributionData } from '../services/analyticsService';

interface CompactTagDistributionProps {
  onError?: (error: string) => void;
}

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All Time' },
];

export const CompactTagDistribution: React.FC<CompactTagDistributionProps> = ({ onError }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('day');
  const [tagData, setTagData] = useState<TagDistributionData[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      // Use local analytics only (skip backend API calls)
      console.log('Using local analytics only - backend disabled');
      const data = await getLocalAnalytics(selectedPeriod);

      setTagData(data.tagDistribution);
      setTotalMinutes(data.totalTime);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      onError?.(error?.message ?? 'Failed to load tag distribution');
      setTagData([]);
      setTotalMinutes(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  // Format data for react-native-chart-kit PieChart
  const chartData = tagData.slice(0, 5).map((item, index) => ({
    name: resolveTagLabel(item.tag) || item.tag,
    population: item.minutes,
    color: resolveTagColor(item.tag),
    legendFontColor: colors.textPrimary,
    legendFontSize: 12,
  }));

  const hasData = tagData.length > 0 && totalMinutes > 0;
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 40, 320);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tag Distribution</Text>
        <Text style={styles.totalTime}>{formatDuration(totalMinutes)}</Text>
      </View>

      <View style={styles.periodSelector}>
        {PERIOD_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.periodButton,
              selectedPeriod === option.value && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(option.value)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === option.value && styles.periodButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : hasData ? (
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <PieChart
              data={chartData}
              width={chartWidth}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => colors.textPrimary,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend={false}
            />
          </View>
          <View style={styles.legendContainer}>
            {tagData.slice(0, 3).map((item) => (
              <View key={item.tag} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: resolveTagColor(item.tag) }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {resolveTagLabel(item.tag) || item.tag}
                </Text>
                <Text style={styles.legendValue}>{formatDuration(item.minutes)}</Text>
              </View>
            ))}
            {tagData.length > 3 && (
              <Text style={styles.moreText}>+{tagData.length - 3} more</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No tagged sessions for {PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label.toLowerCase()}.
          </Text>
          <Text style={styles.emptySubtext}>
            Start a session and add a tag to see your distribution.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  totalTime: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: colors.surface,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    width: '100%',
    paddingVertical: spacing.sm,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  legendContainer: {
    width: '100%',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '600',
  },
  legendValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  moreText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
