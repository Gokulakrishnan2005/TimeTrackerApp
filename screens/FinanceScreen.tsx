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
import { useAuth } from '../contexts/AuthContext';
import { financeService, MonthlyTrend } from '../services/financeService';
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
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [defaultModalType, setDefaultModalType] = useState<'income' | 'expense' | undefined>(undefined);
  const [showTopExpenses, setShowTopExpenses] = useState(true);
  const [incomeChange, setIncomeChange] = useState<string>('+0%');
  const [expenseChange, setExpenseChange] = useState<string>('+0%');
  const [savingsChange, setSavingsChange] = useState<string>('+0%');
  const hydratedRef = useRef(false);
  const loadingRef = useRef(false);
  const isFocused = useIsFocused();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmall = width < 380;
  const isMedium = width >= 380 && width < 768;
  const horizontalPadding = isSmall ? spacing.sm : isMedium ? spacing.md : spacing.lg;
  const chartWidth = Math.min(width - (horizontalPadding as number) * 2, 400);
  const chartHeight = Math.min(180, height * 0.25);
  const summaryCardWidth = isSmall ? '100%' : isMedium ? '48%' : 1;
  const fontSizeMultiplier = isSmall ? 0.9 : 1;
  const chartLegendFontSize = 10 * fontSizeMultiplier;

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
      let currSummary: FinanceSummary = summary || { income: 0, expenses: 0, savings: 0, savingsRate: '0' };
      let incDelta = incomeChange;
      let expDelta = expenseChange;
      let savDelta = savingsChange;

      // Optimize requests: for month view, use /finance/stats (1 request) and compute deltas from trends
      if (timePeriod === 'month') {
        const stats = await financeService.getStats(6);
        trendData = stats.trends || [];
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
        const [current, previous, [expRes, incRes, trRes]] = await Promise.all([
          financeService.getSummary(range),
          financeService.getSummary(prevRange),
          Promise.all([
            financeService.getExpenseBreakdown(range),
            financeService.getIncomeBreakdown(range),
            financeService.getTrends(6),
          ]),
        ]);

        currSummary = current.summary;
        incDelta = calcDelta(previous.summary.income, currSummary.income);
        expDelta = calcDelta(previous.summary.expenses, currSummary.expenses);
        savDelta = calcDelta(previous.summary.savings, currSummary.savings);
        expenseData = expRes;
        incomeData = incRes;
        trendData = trRes;
      }

      // Update state once with computed values
      setSummary(currSummary);
      setIncomeChange(incDelta);
      setExpenseChange(expDelta);
      setSavingsChange(savDelta);
      setExpenseBreakdown(expenseData);
      setIncomeBreakdown(incomeData);
      setTrends(trendData);

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

  // Chart data builders
  const incomeColors = ['#5B9AA8', '#7FB7A7', '#A3C9A5', '#77C3B1', '#4ECDC4'];
  const expenseColors = ['#C87272', '#D8847B', '#E89684', '#BC5E5E', '#A85050'];

  const incomeChartData: ChartSlice[] = incomeBreakdown.map((item, i) => ({
    name: `${item.category || 'Others'} (${item.percentage}%)`,
    population: item.amount,
    color: incomeColors[i % incomeColors.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const expData = (showTopExpenses ? expenseBreakdown.slice(0, 5) : expenseBreakdown);
  const formatLegendText = (text: string) => {
    if (!text) return '';
    // Truncate long category names
    const maxLength = isSmall ? 10 : 15;
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '..';
    }
    return text;
  };

  const expenseChartData: ChartSlice[] = expData.map((item, i) => {
    const displayName = formatLegendText(item.category || 'Others');
    return {
      name: `${displayName} ${item.percentage}%`,
      population: item.amount,
      color: expenseColors[i % expenseColors.length],
      legendFontColor: colors.textSecondary,
      legendFontSize: chartLegendFontSize,
    };
  });

  const last6 = trends.slice(-6);
  const labels = last6.map(t => ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][t.month - 1] || '');
  const expensesTrendData = {
    labels,
    datasets: [{ data: last6.map(t => t.expenses), color: (o: number = 1) => `rgba(239, 68, 68, ${o})`, strokeWidth: 3 }],
  };
  const incomeTrendData = {
    labels,
    datasets: [{ data: last6.map(t => t.income), color: (o: number = 1) => `rgba(16, 185, 129, ${o})`, strokeWidth: 3 }],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: { 
      r: isSmall ? '3' : '4', 
      strokeWidth: '2' 
    },
    propsForBackgroundLines: { 
      stroke: '#E5E7EB', 
      strokeWidth: 1,
      strokeDasharray: '' 
    },
    propsForLabels: {
      fontSize: 10 * fontSizeMultiplier,
    },
    barPercentage: 0.8,
    useShadowColorFromDataset: false,
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
        <Text style={styles.title}>Finance Overview</Text>

        {/* Summary Cards */}
        <View style={[
          styles.summaryContainer, 
          isSmall ? styles.summaryContainerStack : { flexWrap: 'wrap', justifyContent: 'space-between' }
        ]}>
          <View style={[
            styles.summaryCard, 
            styles.incomeCard,
            { 
              width: isSmall ? '100%' : '48%', 
              marginBottom: isSmall ? 12 : 16,
              flex: undefined // Remove flex to fix type error
            }
          ]}>
            <Text style={styles.summaryLabel} numberOfLines={1} ellipsizeMode="tail">Income</Text>
            <Text 
              style={[styles.summaryAmount, { fontSize: isSmall ? 24 : 28 }]} 
              adjustsFontSizeToFit 
              minimumFontScale={0.8} 
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
            { 
              width: isSmall ? '100%' : '48%', 
              marginBottom: isSmall ? 12 : 16,
              flex: undefined // Remove flex to fix type error
            }
          ]}>
            <Text style={styles.summaryLabel} numberOfLines={1} ellipsizeMode="tail">Expenses</Text>
            <Text 
              style={[styles.summaryAmount, { fontSize: isSmall ? 24 : 28 }]} 
              adjustsFontSizeToFit 
              minimumFontScale={0.8} 
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
              style={[styles.summaryAmount, { fontSize: isSmall ? 24 : 28 }]} 
              adjustsFontSizeToFit 
              minimumFontScale={0.8} 
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
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity 
              onPress={() => setTimePeriod('day')} 
              style={[styles.filterButton, timePeriod === 'day' && styles.activeFilter]}
            >
              <Text style={[styles.filterText, timePeriod === 'day' && styles.activeFilterText]}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTimePeriod('month')} 
              style={[styles.filterButton, timePeriod === 'month' && styles.activeFilter]}
            >
              <Text style={[styles.filterText, timePeriod === 'month' && styles.activeFilterText]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTimePeriod('year')} 
              style={[styles.filterButton, timePeriod === 'year' && styles.activeFilter]}
            >
              <Text style={[styles.filterText, timePeriod === 'year' && styles.activeFilterText]}>Year</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Income Sources */}
        <View style={[styles.section, isSmall && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Income Sources</Text>
          </View>
          {incomeChartData.length > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={incomeChartData}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={isSmall ? '0' : '15'}
              />
              <View style={styles.legendContainer}>
                {incomeChartData.map((s, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: s.color }]} />
                    <Text style={styles.legendText}>{s.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}><Text style={styles.emptyText}>No income data</Text></View>
          )}
        </View>

        {/* Expense Categories */}
        <View style={[styles.section, isSmall && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            <View style={styles.sectionHeaderRight}>
              <View style={styles.categoryToggle}>
                <TouchableOpacity onPress={() => setShowTopExpenses(true)} style={[styles.toggleButton, showTopExpenses && styles.toggleButtonActive]}>
                  <Text style={[styles.toggleText, showTopExpenses && styles.toggleTextActive]}>Top 5</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowTopExpenses(false)} style={[styles.toggleButton, !showTopExpenses && styles.toggleButtonActive]}>
                  <Text style={[styles.toggleText, !showTopExpenses && styles.toggleTextActive]}>Others</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {expenseChartData.length > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={expenseChartData}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={isSmall ? '0' : '15'}
              />
              <View style={styles.legendContainer}>
                {expenseChartData.map((s, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: s.color }]} />
                    <Text style={styles.legendText}>{s.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}><Text style={styles.emptyText}>No expense data</Text></View>
          )}
        </View>

        {/* Expenses Trend */}
        <View style={[styles.section, isSmall && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
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
          {last6.length > 0 ? (
            <LineChart
              data={expensesTrendData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              withInnerLines
              withOuterLines
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}><Text style={styles.emptyText}>No expense trend data</Text></View>
          )}
        </View>

        {/* Income Trend */}
        <View style={[styles.section, isSmall && styles.sectionSmall]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Income</Text>
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
          {last6.length > 0 ? (
            <LineChart
              data={incomeTrendData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              withInnerLines
              withOuterLines
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}><Text style={styles.emptyText}>No income trend data</Text></View>
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
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.sm,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    fontSize: 28,
    marginBottom: 2,
    includeFontPadding: false,
  },
  summaryTrend: {
    ...typography.caption,
    fontWeight: '600',
  },
  positiveTrend: { color: '#10B981' },
  negativeTrend: { color: '#EF4444' },
  filterContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    maxWidth: '100%',
    height: 44,
    justifyContent: 'center',
  },
  filterScrollContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    height: 32,
  },
  activeFilter: { 
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeFilterText: { 
    color: colors.surface,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  chart: { 
    marginVertical: spacing.sm, 
    borderRadius: radii.md,
    paddingRight: 0,
  },
  chartContainer: { 
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  legendContainer: { 
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 8,
    marginBottom: 6,
    maxWidth: '45%',
  },
  legendColor: { 
    width: 8, 
    height: 8, 
    borderRadius: 4,
    marginRight: 4,
    flexShrink: 0,
  },
  legendText: { 
    fontSize: 10,
    color: colors.textSecondary,
    flexShrink: 1,
    lineHeight: 12,
  },
  emptyChart: { 
    height: 160, 
    backgroundColor: colors.background, 
    borderRadius: radii.lg, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  emptyText: { 
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.md,
  },
  categoryToggle: { flexDirection: 'row', gap: spacing.sm },
  toggleButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  toggleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { ...typography.body, color: colors.textSecondary },
  toggleTextActive: { color: colors.surface },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
