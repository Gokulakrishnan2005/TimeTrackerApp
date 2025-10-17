import React, { useCallback, useEffect, useRef, useState } from "react";
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

const PAGE_SIZE = 20;
const CACHE_TTL = 60 * 1000; // 60 seconds

type FilterType = "all" | "income" | "expense";

type CacheEntry = {
  transactions: Transaction[];
  page: number;
  hasMore: boolean;
  lastFetched: number;
};

const SpendingHistoryScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  const cacheRef = useRef<Record<FilterType, CacheEntry>>({
    all: { transactions: [], page: 1, hasMore: true, lastFetched: 0 },
    income: { transactions: [], page: 1, hasMore: true, lastFetched: 0 },
    expense: { transactions: [], page: 1, hasMore: true, lastFetched: 0 },
  });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const loadingMapRef = useRef<Record<FilterType, boolean>>({ all: false, income: false, expense: false });

  const loadTransactions = useCallback(
    async (opts?: { reset?: boolean; pageOverride?: number; filterOverride?: FilterType }) => {
      const reset = opts?.reset ?? false;
      const activeFilter = opts?.filterOverride ?? filter;
      const cache = cacheRef.current[activeFilter];
      const targetPage = reset ? 1 : opts?.pageOverride ?? cache.page ?? 1;

      if (loadingMapRef.current[activeFilter]) {
        return;
      }
      loadingMapRef.current[activeFilter] = true;

      try {
        if (reset && filter === activeFilter) {
          setError(null);
        }
        const response = await financeService.getTransactions({
          page: targetPage,
          limit: PAGE_SIZE,
          type: activeFilter === "all" ? undefined : activeFilter,
        });

        const fetched = response.data.transactions ?? [];
        const baseTransactions = reset ? [] : cache.transactions;
        const nextTransactions = reset ? fetched : [...baseTransactions, ...fetched];
        const pagination = response.data.pagination;
        const newPage = pagination?.page ?? targetPage;
        const newHasMore = pagination ? pagination.page < pagination.pages : fetched.length === PAGE_SIZE;

        cacheRef.current[activeFilter] = {
          transactions: nextTransactions,
          page: newPage,
          hasMore: newHasMore,
          lastFetched: Date.now(),
        };

        if (filter === activeFilter) {
          setTransactions(nextTransactions);
          setHasMore(newHasMore);
          setPage(newPage);
          setError(null);
        }
      } catch (err: any) {
        console.error("Failed to load transactions", err);
        const message = err?.message ?? "Unable to load history.";
        const friendly = message.includes("Too many requests")
          ? "You're making requests too quickly. Please wait a moment and try again."
          : message;
        if (filter === activeFilter) {
          setError(friendly);
        }
      } finally {
        loadingMapRef.current[activeFilter] = false;
        if (filter === activeFilter) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsFetchingMore(false);
        }
      }
    },
    [filter]
  );

  useEffect(() => {
    const cache = cacheRef.current[filter];

    if (cache.transactions.length) {
      setTransactions(cache.transactions);
      setHasMore(cache.hasMore);
      setPage(cache.page);
      setIsLoading(false);
      setError(null);
    } else {
      setTransactions([]);
      setHasMore(true);
      setPage(1);
      setIsLoading(true);
    }

    const shouldFetch = Date.now() - cache.lastFetched > CACHE_TTL || cache.transactions.length === 0;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (shouldFetch) {
      debounceRef.current = setTimeout(() => {
        loadTransactions({ reset: true, filterOverride: filter });
      }, 350);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [filter, loadTransactions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions({ reset: true, filterOverride: filter });
  };

  const handleLoadMore = () => {
    if (isFetchingMore || isLoading || isRefreshing || !hasMore) {
      return;
    }
    const currentCache = cacheRef.current[filter];
    const nextPage = (currentCache?.page ?? page) + 1;
    setIsFetchingMore(true);
    loadTransactions({ pageOverride: nextPage, filterOverride: filter });
  };

  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

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
              {financeService.formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Expenses</Text>
            <Text style={[styles.summaryChipValue, { color: "#DC2626" }]}>
              {financeService.formatCurrency(totalExpense)}
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
                const cache = cacheRef.current[type];
                setFilter(type);
                if (cache.transactions.length) {
                  setTransactions(cache.transactions);
                  setHasMore(cache.hasMore);
                  setPage(cache.page);
                  setIsLoading(false);
                  setError(null);
                } else {
                  setTransactions([]);
                  setHasMore(true);
                  setPage(1);
                  setIsLoading(true);
                }
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
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        onEndReachedThreshold={0.3}
        onEndReached={handleLoadMore}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
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
