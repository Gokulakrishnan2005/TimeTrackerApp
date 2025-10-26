/**
 * Finance Overview Screen
 *
 * Main finance dashboard showing income, expenses, and savings
 * Displays summary cards, charts, and transaction trends
 * Integrates with backend API for real-time data
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useIsFocused } from '@react-navigation/native';
import AddTransactionModal from '../components/AddTransactionModal';
import { financeService, MonthlyTrend, TrendPoint } from '../services/financeService';
import { colors } from '../constants/colors';
import { spacing, typography, radii } from '../constants/theme';

const CACHE_TTL_MS = 120000; // 2 minutes

interface FinanceSummary {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: string;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: string;
}

type TimePeriod = 'day' | 'month' | 'year';

type ChartSlice = {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
};

const FinanceScreen: React.FC = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [trendSeries, setTrendSeries] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [defaultModalType, setDefaultModalType] = useState<'income' | 'expense' | undefined>(undefined);
  const [showTopIncome, setShowTopIncome] = useState(true);
  const [showTopExpenses, setShowTopExpenses] = useState(true);
  const [incomeChange, setIncomeChange] = useState<string>('+0%');
  const [expenseChange, setExpenseChange] = useState<string>('+0%');
  const [savingsChange, setSavingsChange] = useState<string>('+0%');
  const hydratedRef = useRef(false);
  const loadingRef = useRef(false);
  const isFocused = useIsFocused();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTiny = width < 330;
  const isSmall = width < 380;
  const isMedium = width >= 380 && width < 768;
  const horizontalPadding = isTiny ? spacing.sm : isSmall ? spacing.md : isMedium ? spacing.lg : spacing.xl;
  const sectionPadding = (isSmall || isTiny) ? spacing.md : spacing.lg;
  const chartAvailableWidth = Math.max(220, width - horizontalPadding * 2 - sectionPadding * 2);
  const chartWidth = Math.min(420, chartAvailableWidth);
  const chartHeight = Math.max(160, Math.min(220, height * 0.3));
  const MAX_VISIBLE_SEGMENTS = 5;

  useEffect(() => {
    // Hydrate saved UI state and cached data first for instant display
    (async () => {
      try {
        const savedPeriod = await AsyncStorage.getItem('finance_time_period');
        if (savedPeriod === 'day' || savedPeriod === 'month' || savedPeriod === 'year') {
          setTimePeriod(savedPeriod);
        }

        const cached = await AsyncStorage.getItem('finance_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.summary) setSummary(parsed.summary);
          if (parsed.expenseBreakdown) setExpenseBreakdown(parsed.expenseBreakdown);
          if (parsed.incomeBreakdown) setIncomeBreakdown(parsed.incomeBreakdown);
          if (parsed.trends) setTrends(parsed.trends);
          if (parsed.meta && parsed.meta.changes) {
            setIncomeChange(parsed.meta.changes.income);
            setExpenseChange(parsed.meta.changes.expenses);
            setSavingsChange(parsed.meta.changes.savings);
          }

          // If cache is fresh, skip immediate network fetch
          const fetchedAt = parsed.meta?.fetchedAt as number | undefined;
          if (fetchedAt && Date.now() - fetchedAt < CACHE_TTL_MS) {
            hydratedRef.current = true;
            return; // do not fetch now
          }
        }
      } catch {}
      finally {
        // Always fetch fresh data after hydrating cache
        await loadFinanceData();
        hydratedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await AsyncStorage.setItem('finance_time_period', timePeriod);
    })();
    // Avoid duplicate fetch until hydration finished
    if (!hydratedRef.current) return;
    loadFinanceData();
  }, [timePeriod]);

  // Reload when Finance tab gets focus (e.g., after adding via center navbar button)
  useEffect(() => {
    if (isFocused && hydratedRef.current) {
      loadFinanceData();
    }
  }, [isFocused]);

  const loadFinanceData = async () => {
    try {
      if (loadingRef.current) return; // prevent overlapping loads
      loadingRef.current = true;
      setIsLoading(true);

      const range = getDateRange(timePeriod);
      const prevRange = getPreviousRange(range, timePeriod);
      let expenseData: CategoryBreakdown[] = [];
      let incomeData: CategoryBreakdown[] = [];
      let trendData: MonthlyTrend[] = [];
      let trendSeriesData: TrendPoint[] = [];
      let currSummary: FinanceSummary = summary || { income: 0, expenses: 0, savings: 0, savingsRate: '0' };
      let incDelta = incomeChange;
      let expDelta = expenseChange;
      let savDelta = savingsChange;

      // Optimize requests: for month view, use /finance/stats (1 request) and compute deltas from trends
      if (timePeriod === 'month') {
        const stats = await financeService.getStats(6);
        trendData = stats.trends || [];
        trendSeriesData = await financeService.getTrendSeries('month', 6);
        currSummary = stats.currentMonth.summary;
        expenseData = stats.currentMonth.expenseBreakdown;
        incomeData = stats.currentMonth.incomeBreakdown;

        if (trendData && trendData.length >= 2) {
          const prev = trendData[trendData.length - 2];
          const curr = trendData[trendData.length - 1];
          incDelta = calcDelta(prev.income, curr.income);
          expDelta = calcDelta(prev.expenses, curr.expenses);
          savDelta = calcDelta(prev.savings, curr.savings);
        } else {
          const previous = await financeService.getSummary(prevRange);
          incDelta = calcDelta(previous.summary.income, currSummary.income);
          expDelta = calcDelta(previous.summary.expenses, currSummary.expenses);
          savDelta = calcDelta(previous.summary.savings, currSummary.savings);
        }
      } else {
        // Non-month periods: parallelize requests
        const [current, previous, [expRes, incRes, trRes, seriesData]] = await Promise.all([
          financeService.getSummary(range),
          financeService.getSummary(prevRange),
          Promise.all([
            financeService.getExpenseBreakdown(range),
            financeService.getIncomeBreakdown(range),
            financeService.getTrends(6),
            financeService.getTrendSeries(timePeriod, timePeriod === 'day' ? 7 : timePeriod === 'year' ? 5 : 6),
          ]),
        ]);

        currSummary = current.summary;
        incDelta = calcDelta(previous.summary.income, currSummary.income);
        expDelta = calcDelta(previous.summary.expenses, currSummary.expenses);
        savDelta = calcDelta(previous.summary.savings, currSummary.savings);
        expenseData = expRes;
        incomeData = incRes;
        trendData = trRes;
        trendSeriesData = seriesData;
      }

      // Update state once with computed values
      setSummary(currSummary);
      setIncomeChange(incDelta);
      setExpenseChange(expDelta);
      setSavingsChange(savDelta);
      setExpenseBreakdown(expenseData);
      setIncomeBreakdown(incomeData);
      setTrends(trendData);
      setTrendSeries(trendSeriesData);

      // Cache the latest dataset to keep UI after refresh
      await AsyncStorage.setItem('finance_cache', JSON.stringify({
        summary: currSummary,
        expenseBreakdown: expenseData,
        incomeBreakdown: incomeData,
        trends: trendData,
        meta: {
          period: { current: range, previous: prevRange },
          changes: { income: incDelta, expenses: expDelta, savings: savDelta },
          fetchedAt: Date.now(),
        }
      }));
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const getDateRange = (period: TimePeriod) => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    if (period === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const getPreviousRange = (
    range: { startDate: string; endDate: string },
    period: TimePeriod
  ) => {
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    if (period === 'day') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
      end.setMonth(end.getMonth() - 1);
    } else {
      start.setFullYear(start.getFullYear() - 1);
      end.setFullYear(end.getFullYear() - 1);
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const calcDelta = (prev: number, curr: number) => {
    // If previous is zero, treat as unbounded and cap to readable ±9999%
    if (prev === 0) {
      if (curr === 0) return '0%';
      return curr > 0 ? '+9999%' : '-9999%';
    }
    const pct = ((curr - prev) / Math.abs(prev)) * 100;
    const abs = Math.min(9999, Math.abs(pct));
    const sign = pct >= 0 ? '+' : '-';
    return `${sign}${abs.toFixed(0)}%`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFinanceData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    const isLargeNumber = amount >= 1000000; // 1 million+
    const isMediumNumber = amount >= 10000; // 10,000+
    
    if (isLargeNumber) {
      // Format as crores/lakhs for very large numbers
      const inLakhs = amount / 100000;
      return `₹${inLakhs.toFixed(1)}L`; // Shows as 1.2L for 120,000
    } else if (isMediumNumber) {
      // Format with compact notation for medium numbers
      return `₹${(amount / 1000).toFixed(0)}K`; // Shows as 12K for 12,000
    }
    
    // For smaller numbers, use regular formatting
    return `₹${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    })}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading finance data...</Text>
      </View>
    );
  }

  const last6 = trends.slice(-6);

  // Chart data builders
  const incomeColors = ['#5B9AA8', '#7FB7A7', '#A3C9A5', '#77C3B1', '#4ECDC4'];
  const expenseColors = ['#C87272', '#D8847B', '#E89684', '#BC5E5E', '#A85050'];

  const parsePercentageValue = (value: string) => {
    const numeric = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const buildPieSlices = (
    categories: CategoryBreakdown[],
    palette: string[],
    showTop: boolean
  ) => {
    const sorted = [...categories].sort((a, b) => b.amount - a.amount);
    const hasOverflow = sorted.length > MAX_VISIBLE_SEGMENTS;
    const topItems = sorted.slice(0, MAX_VISIBLE_SEGMENTS);
    const remainderItems = sorted.slice(MAX_VISIBLE_SEGMENTS);

    const mapWithPalette = (items: CategoryBreakdown[], offset = 0) =>
      items.map((item, idx) => ({
        name: `${item.category || 'Others'} (${item.percentage})`,
        population: item.amount,
        color: palette[(offset + idx) % palette.length],
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      }));

    if (sorted.length === 0) {
      return { slices: [] as ChartSlice[], hasOverflow, remainderItems };
    }

    if (showTop) {
      const slices = mapWithPalette(topItems);
      if (hasOverflow) {
        const othersAmount = remainderItems.reduce((sum, item) => sum + item.amount, 0);
        const othersPercentage = remainderItems.reduce(
          (sum, item) => sum + parsePercentageValue(item.percentage),
          0
        );
        slices.push({
          name: `Others (${othersPercentage.toFixed(2)}%)`,
          population: othersAmount,
          color: palette[slices.length % palette.length],
          legendFontColor: colors.textSecondary,
          legendFontSize: 12,
        });
      }
      return { slices, hasOverflow, remainderItems };
    }

    if (!hasOverflow) {
      return { slices: mapWithPalette(sorted), hasOverflow, remainderItems };
    }

    return { slices: mapWithPalette(remainderItems), hasOverflow, remainderItems };
  };

  const incomePie = buildPieSlices(incomeBreakdown, incomeColors, showTopIncome);
  const expensePie = buildPieSlices(expenseBreakdown, expenseColors, showTopExpenses);

  const incomeChartData = incomePie.slices;
  const expenseChartData = expensePie.slices;

  const buildTrendChart = (type: 'income' | 'expenses') => {
    const series = trendSeries.length ? trendSeries : trends.slice(-6).map((t) => ({
      startDate: new Date(t.year, t.month - 1, 1).toISOString(),
      endDate: new Date(t.year, t.month - 1, 28).toISOString(),
      income: t.income,
      expenses: t.expenses,
      savings: t.savings,
    }));

    const labels = series.map((point) => {
      const start = new Date(point.startDate);
      if (timePeriod === 'day') {
        return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      if (timePeriod === 'year') {
        return start.getFullYear().toString();
      }
      return start.toLocaleDateString(undefined, { month: 'short' });
    });

    const dataValues = series.map((point) => (type === 'income' ? point.income : point.expenses));

    const color = type === 'income'
      ? (opacity: number = 1) => `rgba(16, 185, 129, ${opacity})`
      : (opacity: number = 1) => `rgba(239, 68, 68, ${opacity})`;

    return {
      labels,
      datasets: [
        {
          data: dataValues,
          color,
          strokeWidth: 3,
        },
      ],
    };
  };

  const expensesTrendData = buildTrendChart('expenses');
  const incomeTrendData = buildTrendChart('income');

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2' },
    propsForBackgroundLines: { strokeDasharray: '', stroke: '#E5E7EB', strokeWidth: 1 },
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }} // Extra space for FAB
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, {
          padding: horizontalPadding,
          paddingBottom: horizontalPadding + insets.bottom + 16,
          maxWidth: 800, // Max width for larger screens
          width: '100%',
          alignSelf: 'center'
        }]}> 
        <Text style={[styles.title, (isSmall || isTiny) && styles.titleSmall]}>Finance Overview</Text>

        {/* Summary Cards */}
        <View style={[
          styles.summaryContainer, 
          isSmall ? styles.summaryContainerStack : styles.summaryContainerWide
        ]}>
          <View style={[
            styles.summaryCard, 
            styles.incomeCard,
            { width: isSmall ? '100%' : '48%', marginBottom: isSmall ? 12 : 16 }
          ]}>
            <Text style={styles.summaryLabel} numberOfLines={1} ellipsizeMode="tail">Income</Text>
            <Text
              style={[
                styles.summaryAmount,
                isTiny ? styles.summaryAmountTiny : isSmall ? styles.summaryAmountSmall : styles.summaryAmountLarge,
              ]}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              numberOfLines={1}
            >
              {summary ? formatCurrency(summary.income) : '₹0'}
            </Text>
            <Text style={[styles.summaryTrend, incomeChange.startsWith('-') ? styles.negativeTrend : styles.positiveTrend]}>
              {incomeChange}
            </Text>
          </View>

          <View style={[
            styles.summaryCard, 
            styles.expenseCard,
            { width: isSmall ? '100%' : '48%', marginBottom: isSmall ? 12 : 16 }
          ]}>
            <Text style={styles.summaryLabel} numberOfLines={1} ellipsizeMode="tail">Expenses</Text>
            <Text
              style={[
                styles.summaryAmount,
                isTiny ? styles.summaryAmountTiny : isSmall ? styles.summaryAmountSmall : styles.summaryAmountLarge,
              ]}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              numberOfLines={1}
            >
              {summary ? formatCurrency(summary.expenses) : '₹0'}
            </Text>
            <Text style={[styles.summaryTrend, expenseChange.startsWith('-') ? styles.positiveTrend : styles.negativeTrend]}>
              {expenseChange}
            </Text>
          </View>

          <View style={[
            styles.summaryCard, 
            styles.savingsCard,
            { width: '100%' }
          ]}>
            <Text style={styles.summaryLabel} numberOfLines={1} ellipsizeMode="tail">Savings</Text>
            <Text
              style={[
                styles.summaryAmount,
                isTiny ? styles.summaryAmountTiny : isSmall ? styles.summaryAmountSmall : styles.summaryAmountLarge,
              ]}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              numberOfLines={1}
            >
              {summary ? formatCurrency(summary.savings) : '₹0'}
            </Text>
            <Text style={[styles.summaryTrend, savingsChange.startsWith('-') ? styles.negativeTrend : styles.positiveTrend]}>
              {savingsChange}
            </Text>
          </View>
        </View>

        {/* Time Filter */}
        <View style={[styles.filterContainer, isTiny && { width: '100%' }]}>
          <TouchableOpacity onPress={() => setTimePeriod('day')} style={[styles.filterButton, timePeriod === 'day' && styles.activeFilter]}>
            <Text style={[styles.filterText, timePeriod === 'day' && styles.activeFilterText]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTimePeriod('month')} style={[styles.filterButton, timePeriod === 'month' && styles.activeFilter]}>
            <Text style={[styles.filterText, timePeriod === 'month' && styles.activeFilterText]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTimePeriod('year')} style={[styles.filterButton, timePeriod === 'year' && styles.activeFilter]}>
            <Text style={[styles.filterText, timePeriod === 'year' && styles.activeFilterText]}>Year</Text>
          </TouchableOpacity>
        </View>

        {/* Income Sources */}
        <View style={[styles.section, (isSmall || isTiny) && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Income Sources</Text>
            <View style={styles.sectionHeaderRight}>
              <View style={[styles.categoryToggle, (isSmall || isTiny) && styles.categoryToggleCompact]}>
                <TouchableOpacity
                  onPress={() => setShowTopIncome(true)}
                  style={[styles.toggleButton, (isSmall || isTiny) && styles.toggleButtonCondensed, showTopIncome && styles.toggleButtonActive]}
                >
                  <Text style={[styles.toggleText, (isSmall || isTiny) && styles.toggleTextSmall, showTopIncome && styles.toggleTextActive]}>Top 5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTopIncome(false)}
                  disabled={!incomePie.hasOverflow}
                  style={[
                    styles.toggleButton,
                    (isSmall || isTiny) && styles.toggleButtonCondensed,
                    !showTopIncome && styles.toggleButtonActive,
                    !incomePie.hasOverflow && styles.toggleButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      (isSmall || isTiny) && styles.toggleTextSmall,
                      !showTopIncome && styles.toggleTextActive,
                      !incomePie.hasOverflow && styles.toggleTextDisabled,
                    ]}
                  >
                    Others
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {incomeChartData.length > 0 ? (
            <View style={[styles.chartContainer, styles.chartContainerAligned, isTiny && styles.chartContainerCompact]}>
              <PieChart
                data={incomeChartData}
                width={chartWidth}
                height={chartHeight}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                hasLegend={false}
                paddingLeft={isSmall ? '0' : '15'}
              />
              <View style={styles.legendContainer}>
                {incomeChartData.map((slice, idx) => (
                  <View
                    key={idx}
                    style={[styles.legendItem, (isSmall || isTiny) && styles.legendItemFull]}
                  >
                    <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
                    <Text
                      style={styles.legendText}
                      numberOfLines={isTiny ? 2 : 1}
                      ellipsizeMode="tail"
                    >
                      {slice.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}><Text style={styles.emptyChartText}>No income data</Text></View>
          )}
        </View>

        {/* Expense Categories */}
        <View style={[styles.section, (isSmall || isTiny) && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            <View style={styles.sectionHeaderRight}>
              <View style={[styles.categoryToggle, (isSmall || isTiny) && styles.categoryToggleCompact]}>
                <TouchableOpacity
                  onPress={() => setShowTopExpenses(true)}
                  style={[styles.toggleButton, (isSmall || isTiny) && styles.toggleButtonCondensed, showTopExpenses && styles.toggleButtonActive]}
                >
                  <Text style={[styles.toggleText, (isSmall || isTiny) && styles.toggleTextSmall, showTopExpenses && styles.toggleTextActive]}>Top 5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTopExpenses(false)}
                  disabled={!expensePie.hasOverflow}
                  style={[
                    styles.toggleButton,
                    (isSmall || isTiny) && styles.toggleButtonCondensed,
                    !showTopExpenses && styles.toggleButtonActive,
                    !expensePie.hasOverflow && styles.toggleButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      (isSmall || isTiny) && styles.toggleTextSmall,
                      !showTopExpenses && styles.toggleTextActive,
                      !expensePie.hasOverflow && styles.toggleTextDisabled,
                    ]}
                  >
                    Others
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {expenseChartData.length > 0 ? (
            <View style={[styles.chartContainer, styles.chartContainerAligned, isTiny && styles.chartContainerCompact]}>
              <PieChart
                data={expenseChartData}
                width={chartWidth}
                height={chartHeight}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                hasLegend={false}
                paddingLeft={isSmall ? '0' : '15'}
              />
              <View style={styles.legendContainer}>
                {expenseChartData.map((slice, idx) => (
                  <View
                    key={idx}
                    style={[styles.legendItem, (isSmall || isTiny) && styles.legendItemFull]}
                  >
                    <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
                    <Text
                      style={styles.legendText}
                      numberOfLines={isTiny ? 2 : 1}
                      ellipsizeMode="tail"
                    >
                      {slice.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}><Text style={styles.emptyChartText}>No expense data</Text></View>
          )}
        </View>

        {/* Expenses Trend */}
        <View style={[styles.section, isSmall && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, (isSmall || isTiny) && styles.sectionTitleSmall]}>Expenses</Text>
            <View style={styles.miniFilter}>
              <TouchableOpacity onPress={() => setTimePeriod('day')} style={[styles.miniFilterBtn, timePeriod === 'day' && styles.miniFilterActive]}>
                <Text style={[styles.miniFilterText, timePeriod === 'day' && styles.miniFilterTextActive]}>Day</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimePeriod('month')} style={[styles.miniFilterBtn, timePeriod === 'month' && styles.miniFilterActive]}>
                <Text style={[styles.miniFilterText, timePeriod === 'month' && styles.miniFilterTextActive]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimePeriod('year')} style={[styles.miniFilterBtn, timePeriod === 'year' && styles.miniFilterActive]}>
                <Text style={[styles.miniFilterText, timePeriod === 'year' && styles.miniFilterTextActive]}>Year</Text>
              </TouchableOpacity>
            </View>
          </View>
          {expensesTrendData.datasets[0].data.length > 0 ? (
            <LineChart
              data={expensesTrendData}
              width={chartWidth}
              height={Math.max(chartHeight, 200)}
              chartConfig={chartConfig}
              bezier
              withDots={false}
              withShadow={false}
              withInnerLines={false}
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No expense data for this period</Text>
            </View>
          )}
        </View>

        {/* Income Trend */}
        <View style={[styles.section, isSmall && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, (isSmall || isTiny) && styles.sectionTitleSmall]}>Income</Text>
            <View style={styles.miniFilter}>
              <TouchableOpacity onPress={() => setTimePeriod('day')} style={[styles.miniFilterBtn, timePeriod === 'day' && styles.miniFilterActive]}>
                <Text style={[styles.miniFilterText, timePeriod === 'day' && styles.miniFilterTextActive]}>Day</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimePeriod('month')} style={[styles.miniFilterBtn, timePeriod === 'month' && styles.miniFilterActive]}>
                <Text style={[styles.miniFilterText, timePeriod === 'month' && styles.miniFilterTextActive]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimePeriod('year')} style={[styles.miniFilterBtn, timePeriod === 'year' && styles.miniFilterActive]}>
                <Text style={[styles.miniFilterText, timePeriod === 'year' && styles.miniFilterTextActive]}>Year</Text>
              </TouchableOpacity>
            </View>
          </View>
          {incomeTrendData.datasets[0].data.length > 0 ? (
            <LineChart
              data={incomeTrendData}
              width={chartWidth}
              height={Math.max(chartHeight, 200)}
              chartConfig={chartConfig}
              bezier
              withDots={false}
              withShadow={false}
              withInnerLines={false}
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No income data for this period</Text>
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTransactionAdded={loadFinanceData}
        defaultType={defaultModalType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
  titleSmall: {
    fontSize: 32,
    lineHeight: 38,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.sm,
  },
  summaryContainerWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryContainerStack: {
    flexDirection: 'column',
    gap: 12,
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  savingsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    fontSize: 13,
  },
  summaryAmount: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 26,
    marginBottom: 2,
    includeFontPadding: false,
  },
  summaryAmountLarge: {
    fontSize: 28,
  },
  summaryAmountSmall: {
    fontSize: 24,
  },
  summaryAmountTiny: {
    fontSize: 20,
  },
  summaryTrend: {
    ...typography.caption,
    fontWeight: '600',
  },
  positiveTrend: { color: '#10B981' },
  negativeTrend: { color: '#EF4444' },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
    maxWidth: '100%',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    alignItems: 'center',
    minWidth: 70,
  },
  activeFilter: { 
    backgroundColor: colors.primary,
    boxShadow: `0px 2px 2px ${colors.primary}20`,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeFilterText: { 
    color: colors.surface,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  sectionSmall: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  headerActionIcon: { color: colors.textSecondary, fontWeight: '700', fontSize: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  sectionTitleSmall: {
    fontSize: 16,
  },
  chart: {
    marginTop: spacing.md,
    borderRadius: radii.md,
  },
  chartContainer: {
    alignItems: 'stretch',
    width: '100%',
    overflow: 'hidden',
  },
  chartContainerAligned: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainerCompact: {
    paddingHorizontal: spacing.sm,
  },
  legendContainer: {
    marginTop: spacing.md, 
    gap: spacing.sm,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: 4,
    maxWidth: '45%',
  },
  legendItemFull: {
    maxWidth: '100%',
    flexBasis: '100%',
    justifyContent: 'flex-start',
  },
  legendColor: { 
    width: 10, 
    height: 10, 
    borderRadius: 5,
    flexShrink: 0,
  },
  legendText: { 
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  emptyChart: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  emptyChartText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  categoryToggle: { flexDirection: 'row', gap: spacing.sm },
  categoryToggleCompact: { gap: spacing.xs },
  toggleButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  toggleButtonCondensed: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, flex: 1, minWidth: 0 },
  toggleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleButtonDisabled: { opacity: 0.5 },
  toggleText: { ...typography.body, color: colors.textSecondary },
  toggleTextSmall: { fontSize: 12 },
  toggleTextActive: { color: colors.surface },
  toggleTextDisabled: { color: colors.textTertiary },
  trendHint: { ...typography.caption, color: colors.textTertiary },
  miniFilter: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill },
  miniFilterBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radii.pill },
  miniFilterActive: { backgroundColor: colors.primary },
  miniFilterText: { ...typography.caption, color: colors.textSecondary },
  miniFilterTextActive: { color: colors.surface },
  sectionFab: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    boxShadow: '0px 3px 4px rgba(0, 0, 0, 0.25)',
  },
  sectionFabBlue: { backgroundColor: colors.primary },
  sectionFabGray: { backgroundColor: '#e5e7eb' },
  sectionFabIcon: { color: colors.surface, fontSize: 18, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    boxShadow: `0px 3px 6px ${colors.primary}30`,
    zIndex: 100,
    transform: [{ translateY: 0 }],
  },
  fabText: {
    fontSize: 24,
    color: colors.surface,
    fontWeight: '600',
    marginTop: -1, // Optical alignment
  },
});

export default FinanceScreen;
