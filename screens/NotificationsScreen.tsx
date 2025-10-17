import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { colors } from "../constants/colors";
import { spacing, typography, radii } from "../constants/theme";
import financeService, { CategoryBreakdown, FinancialStats, MonthlyTrend } from "../services/financeService";

interface Insight {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "warning" | "info";
}

const NotificationsScreen: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildInsights = (stats: FinancialStats) => {
    const result: Insight[] = [];
    const summary = stats.currentMonth?.summary;
    const expenses = stats.currentMonth?.expenseBreakdown ?? [];
    const income = stats.currentMonth?.incomeBreakdown ?? [];
    const trends = stats.trends ?? [];

    if (summary) {
      const net = summary.income - summary.expenses;
      result.push({
        id: "net-balance",
        title: net >= 0 ? "Great job!" : "Mind the gap",
        detail:
          net >= 0
            ? `You saved ${financeService.formatCurrency(net)} this period with a savings rate of ${summary.savingsRate}.`
            : `Expenses exceeded income by ${financeService.formatCurrency(Math.abs(net))}. Try reducing costs or boosting income.`,
        tone: net >= 0 ? "positive" : "warning",
      });
    }

    const topExpense = expenses.reduce<CategoryBreakdown | null>((top, item) => {
      if (!top || item.amount > top.amount) return item;
      return top;
    }, null);

    if (topExpense) {
      result.push({
        id: "top-expense",
        title: "Biggest expense",
        detail: `${topExpense.category} took ${topExpense.percentage} of your spending. Consider budgeting this category.`,
        tone: "info",
      });
    }

    const topIncome = income.reduce<CategoryBreakdown | null>((top, item) => {
      if (!top || item.amount > top.amount) return item;
      return top;
    }, null);

    if (topIncome) {
      result.push({
        id: "top-income",
        title: "Top earning source",
        detail: `${topIncome.category} contributed ${topIncome.percentage} of your income. Keep nurturing this source!`,
        tone: "positive",
      });
    }

    if (trends.length >= 2) {
      const lastTwo = trends.slice(-2) as [MonthlyTrend, MonthlyTrend];
      const prev = lastTwo[0];
      const current = lastTwo[1];
      const expenseDelta = current.expenses - prev.expenses;
      if (expenseDelta > 0) {
        result.push({
          id: "expense-trend",
          title: "Expenses rising",
          detail: `Spending increased by ${financeService.formatCurrency(expenseDelta)} compared to last period. Review recurring costs.`,
          tone: "warning",
        });
      } else if (expenseDelta < 0) {
        result.push({
          id: "expense-trend",
          title: "Expenses reduced",
          detail: `Great work! You spent ${financeService.formatCurrency(Math.abs(expenseDelta))} less than the previous period.`,
          tone: "positive",
        });
      }

      const incomeDelta = current.income - prev.income;
      if (incomeDelta > 0) {
        result.push({
          id: "income-trend",
          title: "Income growing",
          detail: `Income increased by ${financeService.formatCurrency(incomeDelta)} compared to last period.`,
          tone: "positive",
        });
      } else if (incomeDelta < 0) {
        result.push({
          id: "income-trend",
          title: "Income dipped",
          detail: `Income dipped by ${financeService.formatCurrency(Math.abs(incomeDelta))}. Consider following up on delayed payments.`,
          tone: "warning",
        });
      }
    }

    if (!result.length) {
      result.push({
        id: "no-data",
        title: "No insights yet",
        detail: "Add some transactions to unlock personalised spending insights and alerts.",
        tone: "info",
      });
    }

    setInsights(result);
  };

  const loadInsights = useCallback(async () => {
    try {
      setError(null);
      if (!isRefreshing) {
        setIsLoading(true);
      }
      const stats = await financeService.getStats(6);
      buildInsights(stats);
    } catch (err: any) {
      console.error("Failed to load insights", err);
      setError(err?.message ?? "Unable to load notifications.");
      setInsights([
        {
          id: "error",
          title: "Unable to fetch insights",
          detail: "Check your connection and pull to refresh.",
          tone: "warning",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInsights();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.title}>Spending Notifications</Text>
      <Text style={styles.subtitle}>
        These insights are generated from your recent income and expense activity to help you stay on top of
        your goals.
      </Text>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        insights.map((insight) => (
          <View
            key={insight.id}
            style={[styles.insightCard, styles[`insight-${insight.tone}` as const]]}
          >
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDetail}>{insight.detail}</Text>
          </View>
        ))
      )}

      {error && !isLoading && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loader: {
    marginTop: spacing.xl,
  },
  insightCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  "insight-positive": {
    borderColor: "#34D399",
  },
  "insight-warning": {
    borderColor: "#F97316",
  },
  "insight-info": {
    borderColor: colors.border,
  },
  insightTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  insightDetail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.caption,
    color: "#DC2626",
    marginTop: spacing.md,
  },
});

export default NotificationsScreen;
