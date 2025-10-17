/**
 * Finance Model for Income and Expense Tracking
 *
 * Defines the Finance schema for tracking user's financial transactions
 * Handles income sources and expense categories with analytics support
 * Provides methods for calculating financial summaries and trends
 *
 * Features:
 * - Income and expense categorization
 * - Predefined categories for consistency
 * - Amount validation and formatting
 * - Date-based filtering and aggregation
 * - Financial analytics and statistics
 */

const mongoose = require('mongoose');

/**
 * Predefined categories for income and expenses
 * These ensure consistency and make analytics easier
 */
const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Other'
];

const EXPENSE_CATEGORIES = [
  'Rent',
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Bills',
  'Healthcare',
  'Education',
  'Other'
];

/**
 * Finance Schema Definition
 * Defines the structure of financial transaction documents
 */
const financeSchema = new mongoose.Schema({
  // Reference to the user who owns this transaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for faster queries by user
  },

  // Transaction type - income or expense
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required'],
    index: true // Index for filtering by type
  },

  // Transaction amount in rupees (INR)
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
    validate: {
      validator: function(value) {
        // Ensure amount has at most 2 decimal places
        return Number(value.toFixed(2)) === value;
      },
      message: 'Amount can have at most 2 decimal places'
    }
  },

  // Category for the transaction (depends on type)
  category: {
    type: String,
    required: [true, 'Category is required'],
    validate: {
      // Validate category based on transaction type
      validator: function(value) {
        if (this.type === 'income') {
          return INCOME_SOURCES.includes(value);
        } else if (this.type === 'expense') {
          return EXPENSE_CATEGORIES.includes(value);
        }
        return false;
      },
      message: 'Invalid category for transaction type'
    }
  },

  // Optional custom category/source text when user selects 'Other'
  customCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Custom category cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        if (this.category === 'Other') {
          return typeof value === 'string' && value.trim().length > 0;
        }
        return true;
      },
      message: 'Custom category is required when category is Other'
    }
  },

  // Optional notes about the transaction
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },

  // Date of the transaction
  date: {
    type: Date,
    default: Date.now,
    index: true // Index for date-based queries and sorting
  },

  // Timestamps for creation and updates
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Pre-save middleware to update the updatedAt timestamp
 */
financeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Static method to get financial summary for a user
 * Calculates total income, expenses, and savings for a given period
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @param {Date} startDate - Start date for the period
 * @param {Date} endDate - End date for the period
 * @returns {Promise<Object>} Summary object with totals and percentages
 */
financeSchema.statics.getFinancialSummary = async function(userId, startDate, endDate) {
  try {
    // Build date range filter
    const dateFilter = {
      userId,
      date: { $gte: startDate, $lte: endDate }
    };

    // Aggregate income and expenses
    const summary = await this.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate totals
    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expenses = summary.find(s => s._id === 'expense')?.total || 0;
    const savings = income - expenses;

    return {
      income,
      expenses,
      savings,
      savingsRate: income > 0 ? ((savings / income) * 100).toFixed(2) : 0
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Static method to get expense breakdown by category
 * Returns expenses grouped by category with percentages
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @param {Date} startDate - Start date for the period
 * @param {Date} endDate - End date for the period
 * @returns {Promise<Array>} Array of category objects with amounts and percentages
 */
financeSchema.statics.getExpenseBreakdown = async function(userId, startDate, endDate) {
  try {
    const dateFilter = {
      userId,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    };

    const breakdown = await this.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $cond: [
              { $and: [ { $eq: ['$category', 'Other'] }, { $ne: ['$customCategory', null] }, { $ne: ['$customCategory', ''] } ] },
              '$customCategory',
              '$category'
            ]
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalExpenses = breakdown.reduce((sum, item) => sum + item.total, 0);

    return breakdown.map(item => ({
      category: item._id,
      amount: item.total,
      count: item.count,
      percentage: totalExpenses > 0 ? ((item.total / totalExpenses) * 100).toFixed(2) : 0
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Static method to get income breakdown by source
 * Returns income grouped by source with percentages
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @param {Date} startDate - Start date for the period
 * @param {Date} endDate - End date for the period
 * @returns {Promise<Array>} Array of source objects with amounts and percentages
 */
financeSchema.statics.getIncomeBreakdown = async function(userId, startDate, endDate) {
  try {
    const dateFilter = {
      userId,
      type: 'income',
      date: { $gte: startDate, $lte: endDate }
    };

    const breakdown = await this.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $cond: [
              { $and: [ { $eq: ['$category', 'Other'] }, { $ne: ['$customCategory', null] }, { $ne: ['$customCategory', ''] } ] },
              '$customCategory',
              { $ifNull: ['$category', '$source'] }
            ]
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalIncome = breakdown.reduce((sum, item) => sum + item.total, 0);

    return breakdown.map(item => ({
      category: item._id || 'Other',
      amount: item.total,
      count: item.count,
      percentage: totalIncome > 0 ? ((item.total / totalIncome) * 100).toFixed(2) : 0
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Static method to get monthly trends
 * Returns income and expense totals for each month in a given period
 *
 * @param {mongoose.Types.ObjectId} userId - The user's ID
 * @param {number} months - Number of months to look back
 * @returns {Promise<Array>} Array of monthly data points
 */
financeSchema.statics.getMonthlyTrends = async function(userId, months = 6) {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trends = await this.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: { year: '$_id.year', month: '$_id.month' },
          income: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] }
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] }
          }
        }
      },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          income: 1,
          expenses: 1,
          savings: { $subtract: ['$income', '$expenses'] }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    return trends;
  } catch (error) {
    throw error;
  }
};

/**
 * Virtual for transaction summary
 * Returns transaction data in a clean format
 */
financeSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    type: this.type,
    amount: this.amount,
    category: this.category,
    notes: this.notes,
    date: this.date,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Create indexes for better query performance
financeSchema.index({ userId: 1, type: 1, date: -1 }); // For filtering and sorting
financeSchema.index({ userId: 1, date: -1 }); // For date-based queries
financeSchema.index({ category: 1 }); // For category-based queries

// Create and export Finance model
const Finance = mongoose.model('Finance', financeSchema);

// Export categories for use in controllers and frontend
module.exports = {
  Finance,
  INCOME_SOURCES,
  EXPENSE_CATEGORIES
};
