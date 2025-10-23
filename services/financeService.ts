/**
 * Finance Service
 *
 * Handles financial transaction operations and analytics
 * Integrates with backend API for income and expense management
 * Provides React-friendly interfaces for financial data
 */

import { storeData, getData } from './LocalStorage';

const STORAGE_KEY = 'financeEntries';

type DateRange = {
  startDate?: string;
  endDate?: string;
};

interface SummaryResult {
  summary: FinancialSummary;
  transactions: Transaction[];
}

/**
 * Transaction interface
 */
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Financial summary interface
 */
export interface FinancialSummary {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: string;
}

/**
 * Category breakdown interface
 */
export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: string;
}

/**
 * Monthly trend data interface
 */
export interface MonthlyTrend {
  month: number;
  year: number;
  income: number;
  expenses: number;
  savings: number;
}

export interface TrendPoint {
  startDate: string;
  endDate: string;
  income: number;
  expenses: number;
  savings: number;
}

/**
 * Financial statistics interface
 */
export interface FinancialStats {
  trends: MonthlyTrend[];
  currentMonth: {
    summary: FinancialSummary;
    expenseBreakdown: CategoryBreakdown[];
    incomeBreakdown: CategoryBreakdown[];
  };
  averages: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
  };
  metadata: {
    months: number;
    totalTransactions: number;
    categories: {
      income: string[];
      expenses: string[];
    };
  };
}

/**
 * Pagination interface for transaction lists
 */
export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Transactions list response interface
 */
export interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    pagination: TransactionPagination;
  };
}

/**
 * Finance service class
 * Manages all financial operations
 */
class FinanceService {
  /**
   * Get all transactions
   */
  async getTransactions(): Promise<Transaction[]> {
    const stored = await this.ensureSeedData();
    return stored.map(item => this.normalizeTransaction(item));
  }

  /**
   * Add new financial transaction
   */
  async addTransaction(transactionData: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    customCategory?: string;
    notes?: string;
    date?: string;
  }): Promise<Transaction> {
    const entries = await this.getTransactions();
    const timestamp = new Date().toISOString();
    const category = (transactionData.customCategory?.trim() || transactionData.category).trim();
    const dateValue = transactionData.date ? new Date(transactionData.date).toISOString() : timestamp;
    const newEntry: Transaction = {
      id: this.generateId(),
      type: transactionData.type,
      amount: Number(transactionData.amount) || 0,
      category,
      notes: transactionData.notes ?? '',
      date: dateValue,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await storeData(STORAGE_KEY, [...entries, newEntry]);
    return newEntry;
  }

  /**
   * Update a transaction
   */
  async updateTransaction(transactionId: string, transactionData: {
    amount?: number;
    category?: string;
    notes?: string;
    date?: string;
  }): Promise<Transaction | null> {
    const entries = await this.getTransactions();
    const index = entries.findIndex(e => e.id === transactionId);
    if (index !== -1) {
      const updated: Transaction = {
        ...entries[index],
        ...transactionData,
        date: transactionData.date ? new Date(transactionData.date).toISOString() : entries[index].date,
        amount: transactionData.amount !== undefined ? Number(transactionData.amount) : entries[index].amount,
        category: transactionData.category ? transactionData.category.trim() : entries[index].category,
        updatedAt: new Date().toISOString(),
      };
      entries[index] = updated;
      await storeData(STORAGE_KEY, entries);
      return updated;
    }
    return null;
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    const entries = await this.getTransactions();
    const filtered = entries.filter(e => e.id !== transactionId);
    await storeData(STORAGE_KEY, filtered);
  }

  /**
   * Format currency amount for display
   */
  formatCurrency(amount: number, currency: string = '₹'): string {
    return `${currency}${amount.toFixed(2)}`;
  }

  /**
   * Calculate percentage of total
   */
  calculatePercentage(amount: number, total: number): number {
    if (total === 0) return 0;
    return (amount / total) * 100;
  }

  /**
   * Get predefined categories for UI
   */
  getCategories(): { income: string[]; expenses: string[] } {
    return {
      income: [
        'Salary',
        'Freelance',
        'Investment',
        'Business',
        'Other'
      ],
      expenses: [
        'Rent',
        'Food',
        'Transport',
        'Entertainment',
        'Shopping',
        'Bills',
        'Healthcare',
        'Education',
        'Other'
      ]
    };
  }

  /**
   * Validate transaction data before submission
   */
  validateTransaction(data: {
    type: string;
    amount: number;
    category: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push('Type must be either income or expense');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get transactions for current month
   */
  async getCurrentMonthTransactions(): Promise<Transaction[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const transactions = await this.getTransactions();
    return transactions.filter(t => t.date >= startOfMonth && t.date <= endOfMonth);
  }

  /**
   * Calculate total for transactions by type
   */
  calculateTotalByType(transactions: Transaction[], type: 'income' | 'expense'): number {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  async getSummary(range: DateRange): Promise<SummaryResult> {
    const transactions = await this.getTransactions();
    const filtered = this.filterTransactionsByRange(transactions, range);
    const income = this.calculateTotalByType(filtered, 'income');
    const expenses = this.calculateTotalByType(filtered, 'expense');
    const savings = income - expenses;
    const summary: FinancialSummary = {
      income,
      expenses,
      savings,
      savingsRate: this.calculateSavingsRate(income, savings),
    };
    return { summary, transactions: filtered };
  }

  async getExpenseBreakdown(range: DateRange): Promise<CategoryBreakdown[]> {
    const { transactions } = await this.getSummary(range);
    return this.buildCategoryBreakdown(transactions, 'expense');
  }

  async getIncomeBreakdown(range: DateRange): Promise<CategoryBreakdown[]> {
    const { transactions } = await this.getSummary(range);
    return this.buildCategoryBreakdown(transactions, 'income');
  }

  async getTrends(months: number = 6): Promise<MonthlyTrend[]> {
    const count = Math.max(1, months);
    const transactions = await this.getTransactions();
    const results: MonthlyTrend[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const anchor = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const range = this.getMonthRange(anchor);
      const monthly = this.filterTransactionsByRange(transactions, range);
      const income = this.calculateTotalByType(monthly, 'income');
      const expenses = this.calculateTotalByType(monthly, 'expense');
      const savings = income - expenses;
      results.push({
        month: anchor.getMonth() + 1,
        year: anchor.getFullYear(),
        income,
        expenses,
        savings,
      });
    }
    return results;
  }

  async getTrendSeries(period: 'day' | 'month' | 'year', count?: number): Promise<TrendPoint[]> {
    const transactions = await this.getTransactions();
    if (period === 'day') {
      const days = Math.max(1, count ?? 7);
      const now = new Date();
      const series: TrendPoint[] = [];
      for (let i = days - 1; i >= 0; i -= 1) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
        const range: DateRange = { startDate: start.toISOString(), endDate: end.toISOString() };
        const filtered = this.filterTransactionsByRange(transactions, range);
        const income = this.calculateTotalByType(filtered, 'income');
        const expenses = this.calculateTotalByType(filtered, 'expense');
        series.push({
          startDate: range.startDate!,
          endDate: range.endDate!,
          income,
          expenses,
          savings: income - expenses,
        });
      }
      return series;
    }

    if (period === 'year') {
      const years = Math.max(1, count ?? 5);
      const now = new Date();
      const series: TrendPoint[] = [];
      for (let i = years - 1; i >= 0; i -= 1) {
        const year = now.getFullYear() - i;
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        const range: DateRange = { startDate: start.toISOString(), endDate: end.toISOString() };
        const filtered = this.filterTransactionsByRange(transactions, range);
        const income = this.calculateTotalByType(filtered, 'income');
        const expenses = this.calculateTotalByType(filtered, 'expense');
        series.push({
          startDate: range.startDate!,
          endDate: range.endDate!,
          income,
          expenses,
          savings: income - expenses,
        });
      }
      return series;
    }

    // Default to monthly
    const months = Math.max(1, count ?? 6);
    const series: TrendPoint[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const range: DateRange = { startDate: start.toISOString(), endDate: end.toISOString() };
      const filtered = this.filterTransactionsByRange(transactions, range);
      const income = this.calculateTotalByType(filtered, 'income');
      const expenses = this.calculateTotalByType(filtered, 'expense');
      series.push({
        startDate: range.startDate!,
        endDate: range.endDate!,
        income,
        expenses,
        savings: income - expenses,
      });
    }
    return series;
  }

  async getStats(monthLookback: number = 6): Promise<FinancialStats> {
    const trends = await this.getTrends(monthLookback);
    const currentRange = this.getMonthRange(new Date());
    const current = await this.getSummary(currentRange);
    const expenseBreakdown = this.buildCategoryBreakdown(current.transactions, 'expense');
    const incomeBreakdown = this.buildCategoryBreakdown(current.transactions, 'income');
    const averages = this.calculateAverages(trends);
    const metadata = await this.buildMetadata(trends);
    return {
      trends,
      currentMonth: {
        summary: current.summary,
        expenseBreakdown,
        incomeBreakdown,
      },
      averages,
      metadata,
    };
  }

  private calculateSavingsRate(income: number, savings: number): string {
    if (income === 0) {
      return '0%';
    }
    const rate = (savings / income) * 100;
    return `${rate.toFixed(1)}%`;
  }

  private buildCategoryBreakdown(transactions: Transaction[], type: 'income' | 'expense'): CategoryBreakdown[] {
    const filtered = transactions.filter(t => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    const grouped = new Map<string, { amount: number; count: number }>();
    filtered.forEach(item => {
      const key = item.category || 'Other';
      const existing = grouped.get(key) || { amount: 0, count: 0 };
      grouped.set(key, {
        amount: existing.amount + item.amount,
        count: existing.count + 1,
      });
    });
    const result = Array.from(grouped.entries()).map(([category, value]) => ({
      category,
      amount: Number(value.amount.toFixed(2)),
      count: value.count,
      percentage: total === 0 ? '0%' : `${((value.amount / total) * 100).toFixed(2)}%`,
    }));
    return result.sort((a, b) => b.amount - a.amount);
  }

  private async ensureSeedData(): Promise<Transaction[]> {
    const existing = await getData(STORAGE_KEY);
    if (Array.isArray(existing) && existing.length > 0) {
      return existing as Transaction[];
    }
    const now = new Date();
    const base = now.getMonth();
    const year = now.getFullYear();
    const seed: Transaction[] = [
      {
        id: this.generateId(),
        type: 'income',
        amount: 75000,
        category: 'Salary',
        notes: 'Monthly salary',
        date: new Date(year, base, 2).toISOString(),
        createdAt: new Date(year, base, 2).toISOString(),
        updatedAt: new Date(year, base, 2).toISOString(),
      },
      {
        id: this.generateId(),
        type: 'income',
        amount: 12000,
        category: 'Freelance',
        notes: 'Side project payment',
        date: new Date(year, base - 1, 18).toISOString(),
        createdAt: new Date(year, base - 1, 18).toISOString(),
        updatedAt: new Date(year, base - 1, 18).toISOString(),
      },
      {
        id: this.generateId(),
        type: 'expense',
        amount: 18000,
        category: 'Rent',
        notes: 'Monthly apartment rent',
        date: new Date(year, base, 5).toISOString(),
        createdAt: new Date(year, base, 5).toISOString(),
        updatedAt: new Date(year, base, 5).toISOString(),
      },
      {
        id: this.generateId(),
        type: 'expense',
        amount: 5200,
        category: 'Food',
        notes: 'Groceries and eating out',
        date: new Date(year, base, 12).toISOString(),
        createdAt: new Date(year, base, 12).toISOString(),
        updatedAt: new Date(year, base, 12).toISOString(),
      },
      {
        id: this.generateId(),
        type: 'expense',
        amount: 3200,
        category: 'Transport',
        notes: 'Fuel and cab rides',
        date: new Date(year, base, 15).toISOString(),
        createdAt: new Date(year, base, 15).toISOString(),
        updatedAt: new Date(year, base, 15).toISOString(),
      },
      {
        id: this.generateId(),
        type: 'expense',
        amount: 2600,
        category: 'Entertainment',
        notes: 'Movies and subscriptions',
        date: new Date(year, base - 1, 22).toISOString(),
        createdAt: new Date(year, base - 1, 22).toISOString(),
        updatedAt: new Date(year, base - 1, 22).toISOString(),
      },
    ];
    await storeData(STORAGE_KEY, seed);
    return seed;
  }

  private normalizeTransaction(raw: any): Transaction {
    const fallbackDate = raw?.date ? new Date(raw.date).toISOString() : new Date().toISOString();
    return {
      id: raw?.id ?? this.generateId(),
      type: raw?.type === 'expense' ? 'expense' : 'income',
      amount: Number(raw?.amount) || 0,
      category: typeof raw?.category === 'string' && raw.category.trim().length > 0 ? raw.category.trim() : 'Other',
      notes: typeof raw?.notes === 'string' ? raw.notes : '',
      date: fallbackDate,
      createdAt: raw?.createdAt ? new Date(raw.createdAt).toISOString() : fallbackDate,
      updatedAt: raw?.updatedAt ? new Date(raw.updatedAt).toISOString() : fallbackDate,
    };
  }

  private filterTransactionsByRange(transactions: Transaction[], range?: DateRange): Transaction[] {
    if (!range || (!range.startDate && !range.endDate)) {
      return transactions;
    }
    const start = range.startDate ? new Date(range.startDate).getTime() : Number.NEGATIVE_INFINITY;
    const end = range.endDate ? new Date(range.endDate).getTime() : Number.POSITIVE_INFINITY;
    return transactions.filter(item => {
      const time = new Date(item.date).getTime();
      return time >= start && time <= end;
    });
  }

  private getMonthRange(date: Date): DateRange {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  private calculateAverages(trends: MonthlyTrend[]) {
    if (trends.length === 0) {
      return {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlySavings: 0,
      };
    }
    const income = trends.reduce((sum, t) => sum + t.income, 0) / trends.length;
    const expenses = trends.reduce((sum, t) => sum + t.expenses, 0) / trends.length;
    const savings = trends.reduce((sum, t) => sum + t.savings, 0) / trends.length;
    return {
      monthlyIncome: Number(income.toFixed(2)),
      monthlyExpenses: Number(expenses.toFixed(2)),
      monthlySavings: Number(savings.toFixed(2)),
    };
  }

  private async buildMetadata(trends: MonthlyTrend[]) {
    const transactions = await this.getTransactions();
    const categories = this.getCategories();
    return {
      months: trends.length,
      totalTransactions: transactions.length,
      categories,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// Create and export singleton instance
const financeService = new FinanceService();

export default financeService;
export { financeService };
