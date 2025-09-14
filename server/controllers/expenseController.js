const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const User = require('../models/User');
const { sendBudgetAlert, sendExpenseNotification } = require('../utils/emailService');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by user role
    if (req.user.role === 'user') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'manager') {
      query.$or = [
        { submittedBy: req.user._id },
        { department: req.user.department }
      ];
    }
    // Admin can see all expenses

    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.budget) {
      query.budget = req.query.budget;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email department')
      .populate('approvedBy', 'name email')
      .populate('category', 'name color')
      .populate('budget', 'name amount')
      .sort({ date: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      count: expenses.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'name email department')
      .populate('approvedBy', 'name email')
      .populate('category', 'name color description')
      .populate('budget', 'name amount owner');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'user' && expense.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this expense'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add user as submitter
    req.body.submittedBy = req.user._id;
    req.body.department = req.body.department || req.user.department;

    // Check if budget exists and is active
    if (req.body.budget) {
      const budget = await Budget.findById(req.body.budget);
      
      if (!budget) {
        return res.status(400).json({
          success: false,
          message: 'Budget not found'
        });
      }

      if (budget.status !== 'active' && budget.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Budget is not active'
        });
      }

      // Check if expense date is within budget period
      const expenseDate = new Date(req.body.date || Date.now());
      if (expenseDate < budget.startDate || expenseDate > budget.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Expense date is outside budget period'
        });
      }
    }

    const expense = await Expense.create(req.body);

    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('category', 'name color')
      .populate('budget', 'name amount');

    // Check for budget alerts if expense is approved
    if (expense.status === 'approved' && expense.budget) {
      await checkBudgetAlert(expense.budget);
    }

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: populatedExpense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check ownership or admin/manager role
    if (req.user.role === 'user' && expense.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }

    // Users can only edit pending expenses
    if (req.user.role === 'user' && expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit expense that is not pending'
      });
    }

    const oldStatus = expense.status;
    
    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('submittedBy', 'name email')
      .populate('category', 'name color')
      .populate('budget', 'name amount');

    // Send notification if status changed
    if (oldStatus !== expense.status && (expense.status === 'approved' || expense.status === 'rejected')) {
      const user = await User.findById(expense.submittedBy._id);
      await sendExpenseNotification(user, expense, expense.status);
    }

    // Check for budget alerts if expense was approved
    if (expense.status === 'approved' && expense.budget) {
      await checkBudgetAlert(expense.budget._id);
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check ownership or admin role
    if (req.user.role !== 'admin' && expense.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }

    // Users can only delete pending expenses
    if (req.user.role === 'user' && expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete expense that is not pending'
      });
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject expense
// @route   PUT /api/expenses/:id/review
// @access  Private (Manager/Admin)
const reviewExpense = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting an expense'
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Expense is not pending review'
      });
    }

    // Update expense
    expense.status = status;
    expense.approvedBy = req.user._id;
    expense.approvalDate = new Date();
    if (rejectionReason) {
      expense.rejectionReason = rejectionReason;
    }

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('category', 'name color')
      .populate('budget', 'name amount');

    // Send notification to expense submitter
    const user = await User.findById(expense.submittedBy);
    await sendExpenseNotification(user, expense, status);

    // Check for budget alerts if approved
    if (status === 'approved' && expense.budget) {
      await checkBudgetAlert(expense.budget);
    }

    res.json({
      success: true,
      message: `Expense ${status} successfully`,
      data: populatedExpense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense analytics
// @route   GET /api/expenses/analytics
// @access  Private
const getExpenseAnalytics = async (req, res, next) => {
  try {
    // Build query based on user role
    let query = {};
    if (req.user.role === 'user') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'manager') {
      query.$or = [
        { submittedBy: req.user._id },
        { department: req.user.department }
      ];
    }

    const expenses = await Expense.find(query).populate('category', 'name');
    
    // Calculate analytics
    let totalExpenses = expenses.length;
    let totalAmount = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    let rejectedAmount = 0;
    let categoryBreakdown = {};
    let statusBreakdown = {
      pending: 0,
      approved: 0,
      rejected: 0,
      reimbursed: 0
    };
    let monthlyTrend = {};

    expenses.forEach(expense => {
      totalAmount += expense.amount;
      statusBreakdown[expense.status]++;

      if (expense.status === 'approved') {
        approvedAmount += expense.amount;
      } else if (expense.status === 'pending') {
        pendingAmount += expense.amount;
      } else if (expense.status === 'rejected') {
        rejectedAmount += expense.amount;
      }

      // Category breakdown
      const categoryName = expense.category?.name || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {
          amount: 0,
          count: 0
        };
      }
      categoryBreakdown[categoryName].amount += expense.amount;
      categoryBreakdown[categoryName].count++;

      // Monthly trend
      const monthKey = expense.date.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = 0;
      }
      monthlyTrend[monthKey] += expense.amount;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalExpenses,
          totalAmount,
          approvedAmount,
          pendingAmount,
          rejectedAmount
        },
        statusBreakdown,
        categoryBreakdown,
        monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to check budget alerts
const checkBudgetAlert = async (budgetId) => {
  try {
    const budget = await Budget.findById(budgetId).populate('owner', 'name email');
    
    if (!budget) return;

    const expenses = await Expense.find({
      budget: budgetId,
      status: 'approved'
    });

    const spentAmount = expenses.reduce((total, expense) => total + expense.amount, 0);
    const percentage = budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0;

    // Send alert if threshold is exceeded
    if (percentage >= budget.alertThreshold) {
      await sendBudgetAlert(budget.owner, budget, spentAmount, percentage);
    }
  } catch (error) {
    console.error('Error checking budget alert:', error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  reviewExpense,
  getExpenseAnalytics
};