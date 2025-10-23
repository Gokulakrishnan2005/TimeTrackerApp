import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { colors } from "../constants/colors";
import { spacing, typography, radii } from "../constants/theme";
import financeService, { Transaction } from "../services/financeService";

type FilterType = "all" | "income" | "expense";

const SpendingHistoryScreen: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [visibleTransactions, setVisibleTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const income = visibleTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = visibleTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense };
  }, [visibleTransactions]);

  const computeVisible = useCallback(
    (base: Transaction[], nextFilter: FilterType) => {
      if (nextFilter === "income") {
        return base.filter((tx) => tx.type === "income");
      }
      if (nextFilter === "expense") {
        return base.filter((tx) => tx.type === "expense");
      }
      return base;
    },
    []
  );

  const loadTransactions = useCallback(async () => {
    try {
      setError(null);
      const entries = await financeService.getTransactions();
      const sorted = [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setAllTransactions(sorted);
      setVisibleTransactions(computeVisible(sorted, filter));
    } catch (err: any) {
      console.error("Failed to load transactions", err);
      setError(err?.message ?? "Unable to load history.");
      setAllTransactions([]);
      setVisibleTransactions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [computeVisible, filter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setVisibleTransactions(computeVisible(allTransactions, filter));
  }, [allTransactions, computeVisible, filter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions();
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const amountColor = item.type === "income" ? "#059669" : "#DC2626";
    const amountPrefix = item.type === "income" ? "+" : "-";
    const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionRow}>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {amountPrefix}
            {financeService.formatCurrency(item.amount).replace("₹", "")}
          </Text>
        </View>
        {!!item.notes && <Text style={styles.transactionNotes}>{item.notes}</Text>}
        <Text style={styles.transactionMeta}>{formattedDate}</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No transactions yet</Text>
        <Text style={styles.emptySubtitle}>Add income or expenses to see your spending history.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>This view highlights how you earn and spend.</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Income</Text>
            <Text style={[styles.summaryChipValue, { color: "#059669" }]}>
              {financeService.formatCurrency(totals.income)}
            </Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Expenses</Text>
            <Text style={[styles.summaryChipValue, { color: "#DC2626" }]}>
              {financeService.formatCurrency(totals.expense)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["all", "income", "expense"] as FilterType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterButton, filter === type && styles.filterButtonActive]}
            onPress={() => {
              if (filter !== type) {
                setFilter(type);
              }
            }}
          >
            <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
              {type === "all" ? "All" : type === "income" ? "Income" : "Expense"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && !isLoading && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <FlatList
        data={visibleTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryCard: {
    margin: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  summaryTitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryChip: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  summaryChipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryChipValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  transactionItem: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionCategory: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  transactionAmount: {
    ...typography.body,
    fontWeight: "700",
  },
  transactionNotes: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    ...typography.caption,
    color: "#DC2626",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  footerSpinner: {
    paddingVertical: spacing.md,
  },
});

export default SpendingHistoryScreen;
