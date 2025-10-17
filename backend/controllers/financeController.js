/**
 * Finance Controller
 *
 * Handles financial transaction management (income and expenses)
 * Provides CRUD operations for financial data with analytics
 *
 * Features:
 * - Income and expense tracking
 * - Category-based organization
 * - Financial summary calculations
 * - Expense and income breakdown analytics
 * - Monthly trend analysis
 * - Transaction filtering and pagination
 */

const { Finance, INCOME_SOURCES, EXPENSE_CATEGORIES } = require('../models/Finance');
const { createError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Add new financial transaction (income or expense)
 * POST /api/finance
 *
 * @route POST /api/finance
 * @access Private (requires authentication)
 * @body {type, amount, category, notes, date}
 */
const addTransaction = asyncHandler(async (req, res) => {
  const { type, amount, category, customCategory, notes, date } = req.body;

  // Validate required fields
  if (!type || !amount || !category) {
    throw createError('Please provide type, amount, and category', 400);
  }

  // Validate transaction type
  if (!['income', 'expense'].includes(type)) {
    throw createError('Type must be either "income" or "expense"', 400);
  }

  // Validate amount
  if (amount <= 0) {
    throw createError('Amount must be greater than 0', 400);
  }

  // Validate category based on type
  const validCategories = type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;
  if (!validCategories.includes(category)) {
    throw createError(`Invalid category for ${type}. Must be one of: ${validCategories.join(', ')}`, 400);
  }

  // If "Other" ensure customCategory is provided
  if (category === 'Other' && (!customCategory || !String(customCategory).trim())) {
    throw createError('Please specify a name for "Other" in customCategory', 400);
  }

  // Create new transaction
  const transaction = new Finance({
    userId: req.user._id,
    type,
    amount: parseFloat(amount),
    category,
    customCategory: category === 'Other' ? String(customCategory).trim() : undefined,
    notes: notes?.trim() || '',
    date: date ? new Date(date) : new Date()
  });

  // Save transaction to database
  await transaction.save();

  res.status(201).json({
    success: true,
    message: `${type === 'income' ? 'Income' : 'Expense'} added successfully`,
    data: {
      transaction: transaction.summary
    }
  });
});

/**
 * Get all financial transactions for current user
 * GET /api/finance
 *
 * @route GET /api/finance
 * @access Private (requires authentication)
 * @query {type, category, startDate, endDate, page, limit, sort}
 */
const getTransactions = asyncHandler(async (req, res) => {
  // Pagination options
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Sorting options
  const sortBy = req.query.sort || '-date'; // Default: newest first

  // Build filter object
  const filter = { userId: req.user._id };

  // Add type filter if provided
  if (req.query.type) {
    filter.type = req.query.type;
  }

  // Add category filter if provided
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Add date range filter if provided
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) {
      filter.date.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.date.$lte = new Date(req.query.endDate);
    }
  }

  // Get transactions with pagination
  const transactions = await Finance.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination info
  const total = await Finance.countDocuments(filter);

  res.json({
    success: true,
    data: {
      transactions: transactions.map(transaction => transaction.summary),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Get financial summary with income, expenses, and savings
 * GET /api/finance/summary
 *
 * @route GET /api/finance/summary
 * @access Private (requires authentication)
 * @query {startDate, endDate} - Date range for summary
 */
const getFinancialSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Set default date range to current month if not provided
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const summaryStartDate = startDate ? new Date(startDate) : startOfMonth;
  const summaryEndDate = endDate ? new Date(endDate) : endOfMonth;

  // Get financial summary for the period
  const summary = await Finance.getFinancialSummary(
    req.user._id,
    summaryStartDate,
    summaryEndDate
  );

  res.json({
    success: true,
    data: {
      summary,
      period: {
        startDate: summaryStartDate,
        endDate: summaryEndDate
      }
    }
  });
});

/**
 * Get expense breakdown by category
 * GET /api/finance/breakdown/expenses
 *
 * @route GET /api/finance/breakdown/expenses
 * @access Private (requires authentication)
 * @query {startDate, endDate} - Date range for breakdown
 */
const getExpenseBreakdown = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Set default date range to current month if not provided
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const breakdownStartDate = startDate ? new Date(startDate) : startOfMonth;
  const breakdownEndDate = endDate ? new Date(endDate) : endOfMonth;

  // Get expense breakdown for the period
  const breakdown = await Finance.getExpenseBreakdown(
    req.user._id,
    breakdownStartDate,
    breakdownEndDate
  );

  res.json({
    success: true,
    data: {
      breakdown,
      period: {
        startDate: breakdownStartDate,
        endDate: breakdownEndDate
      }
    }
  });
});

/**
 * Get income breakdown by source
 * GET /api/finance/breakdown/income
 *
 * @route GET /api/finance/breakdown/income
 * @access Private (requires authentication)
 * @query {startDate, endDate} - Date range for breakdown
 */
const getIncomeBreakdown = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Set default date range to current month if not provided
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const breakdownStartDate = startDate ? new Date(startDate) : startOfMonth;
  const breakdownEndDate = endDate ? new Date(endDate) : endOfMonth;

  // Get income breakdown for the period
  const breakdown = await Finance.getIncomeBreakdown(
    req.user._id,
    breakdownStartDate,
    breakdownEndDate
  );

  res.json({
    success: true,
    data: {
      breakdown,
      period: {
        startDate: breakdownStartDate,
        endDate: breakdownEndDate
      }
    }
  });
});

/**
 * Get monthly financial trends
 * GET /api/finance/trends
 *
 * @route GET /api/finance/trends
 * @access Private (requires authentication)
 * @query {months} - Number of months to look back (default: 6)
 */
const getMonthlyTrends = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;

  // Get monthly trends
  const trends = await Finance.getMonthlyTrends(req.user._id, months);

  res.json({
    success: true,
    data: {
      trends,
      months
    }
  });
});

/**
 * Update a financial transaction
 * PUT /api/finance/:id
 *
 * @route PUT /api/finance/:id
 * @access Private (requires authentication)
 * @param {string} id - Transaction ID
 * @body {amount, category, notes, date}
 */
const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, category, notes, date } = req.body;

  // Find the transaction
  const transaction = await Finance.findById(id);

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  // Check if user owns this transaction
  if (transaction.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your transaction.', 403);
  }

  // Update fields if provided
  if (amount !== undefined) {
    if (amount <= 0) {
      throw createError('Amount must be greater than 0', 400);
    }
    transaction.amount = parseFloat(amount);
  }

  if (category !== undefined) {
    const validCategories = transaction.type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;
    if (!validCategories.includes(category)) {
      throw createError(`Invalid category for ${transaction.type}`, 400);
    }
    transaction.category = category;
  }

  if (notes !== undefined) {
    transaction.notes = notes.trim();
  }

  if (date !== undefined) {
    transaction.date = new Date(date);
  }

  // Save updated transaction
  await transaction.save();

  res.json({
    success: true,
    message: 'Transaction updated successfully',
    data: {
      transaction: transaction.summary
    }
  });
});

/**
 * Delete a financial transaction
 * DELETE /api/finance/:id
 *
 * @route DELETE /api/finance/:id
 * @access Private (requires authentication)
 * @param {string} id - Transaction ID
 */
const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the transaction
  const transaction = await Finance.findById(id);

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  // Check if user owns this transaction
  if (transaction.userId.toString() !== req.user._id.toString()) {
    throw createError('Access denied. Not your transaction.', 403);
  }

  // Delete the transaction
  await Finance.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Transaction deleted successfully'
  });
});

/**
 * Get comprehensive financial statistics
 * GET /api/finance/stats
 *
 * @route GET /api/finance/stats
 * @access Private (requires authentication)
 * @query {months} - Number of months to analyze (default: 6)
 */
const getFinancialStats = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;

  try {
    // Get monthly trends
    const trends = await Finance.getMonthlyTrends(req.user._id, months);

    // Get current month summary
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthSummary = await Finance.getFinancialSummary(
      req.user._id,
      startOfMonth,
      endOfMonth
    );

    // Get expense breakdown for current month
    const expenseBreakdown = await Finance.getExpenseBreakdown(
      req.user._id,
      startOfMonth,
      endOfMonth
    );

    // Get income breakdown for current month
    const incomeBreakdown = await Finance.getIncomeBreakdown(
      req.user._id,
      startOfMonth,
      endOfMonth
    );

    // Calculate additional metrics
    const totalTransactions = trends.reduce((sum, month) => sum + 1, 0);
    const averageMonthlyIncome = trends.reduce((sum, month) => sum + month.income, 0) / trends.length;
    const averageMonthlyExpenses = trends.reduce((sum, month) => sum + month.expenses, 0) / trends.length;

    res.json({
      success: true,
      data: {
        trends,
        currentMonth: {
          summary: currentMonthSummary,
          expenseBreakdown,
          incomeBreakdown
        },
        averages: {
          monthlyIncome: Math.round(averageMonthlyIncome),
          monthlyExpenses: Math.round(averageMonthlyExpenses),
          monthlySavings: Math.round(averageMonthlyIncome - averageMonthlyExpenses)
        },
        metadata: {
          months,
          totalTransactions,
          categories: {
            income: INCOME_SOURCES,
            expenses: EXPENSE_CATEGORIES
          }
        }
      }
    });
  } catch (error) {
    throw createError('Failed to calculate financial statistics', 500);
  }
});

module.exports = {
  addTransaction,
  getTransactions,
  getFinancialSummary,
  getExpenseBreakdown,
  getIncomeBreakdown,
  getMonthlyTrends,
  updateTransaction,
  deleteTransaction,
  getFinancialStats
};
