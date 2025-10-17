/**
 * Finance Service
 *
 * Handles financial transaction operations and analytics
 * Integrates with backend API for income and expense management
 * Provides React-friendly interfaces for financial data
 */

import { financeAPI } from './api';

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
    try {
      const response: any = await financeAPI.addTransaction(transactionData);

      if (response.success) {
        return response.data.transaction as Transaction;
      }

      throw new Error(response.error || 'Failed to add transaction');
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  /**
   * Get all transactions with optional filters
   */
  async getTransactions(params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionsResponse> {
    try {
      const response: any = await financeAPI.getTransactions(params);

      if (response.success) {
        return response as TransactionsResponse;
      }

      throw new Error(response.error || 'Failed to fetch transactions');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get financial summary for a period
   */
  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ summary: FinancialSummary; period: { startDate: string; endDate: string } }> {
    try {
      const response: any = await financeAPI.getSummary(params);

      if (response.success) {
        return response.data as { summary: FinancialSummary; period: { startDate: string; endDate: string } };
      }

      throw new Error(response.error || 'Failed to fetch financial summary');
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      throw error;
    }
  }

  /**
   * Get expense breakdown by category
   */
  async getExpenseBreakdown(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CategoryBreakdown[]> {
    try {
      const response: any = await financeAPI.getExpenseBreakdown(params);

      if (response.success) {
        return response.data.breakdown as CategoryBreakdown[];
      }

      throw new Error(response.error || 'Failed to fetch expense breakdown');
    } catch (error) {
      console.error('Error fetching expense breakdown:', error);
      throw error;
    }
  }

  /**
   * Get income breakdown by source
   */
  async getIncomeBreakdown(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CategoryBreakdown[]> {
    try {
      const response: any = await financeAPI.getIncomeBreakdown(params);

      if (response.success) {
        const raw = response.data.breakdown as Array<any>;
        // Backend returns { source, amount, count, percentage } for income; normalize to { category, ... }
        return raw.map((item) => ({
          category: item.category ?? item.source,
          amount: item.amount,
          count: item.count,
          percentage: item.percentage,
        })) as CategoryBreakdown[];
      }

      throw new Error(response.error || 'Failed to fetch income breakdown');
    } catch (error) {
      console.error('Error fetching income breakdown:', error);
      throw error;
    }
  }

  /**
   * Get monthly financial trends
   */
  async getTrends(months: number = 6): Promise<MonthlyTrend[]> {
    try {
      const response: any = await financeAPI.getTrends(months);

      if (response.success) {
        return response.data.trends as MonthlyTrend[];
      }

      throw new Error(response.error || 'Failed to fetch financial trends');
    } catch (error) {
      console.error('Error fetching financial trends:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive financial statistics
   */
  async getStats(months: number = 6): Promise<FinancialStats> {
    try {
      const response: any = await financeAPI.getStats(months);

      if (response.success) {
        const data = response.data as FinancialStats;
        // Normalize income breakdown: map `source` -> `category` if needed (supports older backend)
        const normalizedIncome = (data.currentMonth?.incomeBreakdown || []).map((item: any) => ({
          category: item.category ?? item.source,
          amount: item.amount,
          count: item.count,
          percentage: item.percentage,
        })) as CategoryBreakdown[];

        return {
          ...data,
          currentMonth: {
            ...data.currentMonth,
            incomeBreakdown: normalizedIncome,
          },
        } as FinancialStats;
      }

      throw new Error(response.error || 'Failed to fetch financial statistics');
    } catch (error) {
      console.error('Error fetching financial statistics:', error);
      throw error;
    }
  }

  /**
   * Update a transaction
   */
  async updateTransaction(transactionId: string, transactionData: {
    amount?: number;
    category?: string;
    notes?: string;
    date?: string;
  }): Promise<Transaction> {
    try {
      const response: any = await financeAPI.updateTransaction(transactionId, transactionData);

      if (response.success) {
        return response.data.transaction as Transaction;
      }

      throw new Error(response.error || 'Failed to update transaction');
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const response: any = await financeAPI.deleteTransaction(transactionId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
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
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const response = await this.getTransactions({
        startDate: startOfMonth,
        endDate: endOfMonth
      });

      return response.data.transactions;
    } catch (error) {
      console.error('Error fetching current month transactions:', error);
      return [];
    }
  }

  /**
   * Calculate total for transactions by type
   */
  calculateTotalByType(transactions: Transaction[], type: 'income' | 'expense'): number {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }
}

// Create and export singleton instance
const financeService = new FinanceService();

export default financeService;
export { financeService };
