/**
 * Finance Routes
 *
 * Defines API endpoints for financial transaction management
 * Provides CRUD operations for income and expenses with analytics
 * All routes are protected and require user authentication
 */

const express = require('express');
const {
  addTransaction,
  getTransactions,
  getFinancialSummary,
  getExpenseBreakdown,
  getIncomeBreakdown,
  getMonthlyTrends,
  updateTransaction,
  deleteTransaction,
  getFinancialStats
} = require('../controllers/financeController');
const { auth, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// All finance routes require authentication
router.use(auth);

/**
 * @route POST /api/finance
 * @desc Add new financial transaction (income or expense)
 * @access Private
 */
router.post('/', addTransaction);

/**
 * @route GET /api/finance
 * @desc Get all financial transactions with filters and pagination
 * @access Private
 */
router.get('/', getTransactions);

/**
 * @route GET /api/finance/summary
 * @desc Get financial summary (income, expenses, savings)
 * @access Private
 */
router.get('/summary', getFinancialSummary);

/**
 * @route GET /api/finance/breakdown/expenses
 * @desc Get expense breakdown by category
 * @access Private
 */
router.get('/breakdown/expenses', getExpenseBreakdown);

/**
 * @route GET /api/finance/breakdown/income
 * @desc Get income breakdown by source
 * @access Private
 */
router.get('/breakdown/income', getIncomeBreakdown);

/**
 * @route GET /api/finance/trends
 * @desc Get monthly financial trends
 * @access Private
 */
router.get('/trends', getMonthlyTrends);

/**
 * @route GET /api/finance/stats
 * @desc Get comprehensive financial statistics
 * @access Private
 */
router.get('/stats', getFinancialStats);

/**
 * @route PUT /api/finance/:id
 * @desc Update a financial transaction
 * @access Private
 */
router.put('/:id', checkOwnership(), updateTransaction);

/**
 * @route DELETE /api/finance/:id
 * @desc Delete a financial transaction
 * @access Private
 */
router.delete('/:id', checkOwnership(), deleteTransaction);

module.exports = router;
