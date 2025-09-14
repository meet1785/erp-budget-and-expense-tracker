const { validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { sendBudgetAlert } = require('../utils/emailService');

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by user role
    if (req.user.role === 'user') {
      query.owner = req.user._id;
    } else if (req.user.role === 'manager') {
      query.$or = [
        { owner: req.user._id },
        { department: req.user.department }
      ];
    }
    // Admin can see all budgets

    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }

    const budgets = await Budget.find(query)
      .populate('owner', 'name email')
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const expenses = await Expense.find({
          budget: budget._id,
          status: 'approved'
        });
        
        const spentAmount = expenses.reduce((total, expense) => total + expense.amount, 0);
        const remainingAmount = budget.amount - spentAmount;
        const usagePercentage = budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0;

        return {
          ...budget.toObject(),
          spentAmount,
          remainingAmount,
          usagePercentage
        };
      })
    );

    const total = await Budget.countDocuments(query);

    res.json({
      success: true,
      count: budgets.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: budgetsWithSpent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
const getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('owner', 'name email department')
      .populate('category', 'name color description')
      .populate('approvers', 'name email');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'user' && budget.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this budget'
      });
    }

    // Calculate spent amount
    const expenses = await Expense.find({
      budget: budget._id,
      status: 'approved'
    });

    const spentAmount = expenses.reduce((total, expense) => total + expense.amount, 0);
    const remainingAmount = budget.amount - spentAmount;
    const usagePercentage = budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0;

    res.json({
      success: true,
      data: {
        ...budget.toObject(),
        spentAmount,
        remainingAmount,
        usagePercentage,
        expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res, next) => {
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

    // Add user as owner
    req.body.owner = req.user._id;
    req.body.department = req.body.department || req.user.department;

    const budget = await Budget.create(req.body);

    const populatedBudget = await Budget.findById(budget._id)
      .populate('owner', 'name email')
      .populate('category', 'name color');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: populatedBudget
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
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

    let budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check ownership or admin/manager role
    if (req.user.role === 'user' && budget.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget'
      });
    }

    budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('owner', 'name email').populate('category', 'name color');

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Check ownership or admin role
    if (req.user.role !== 'admin' && budget.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this budget'
      });
    }

    // Check if there are associated expenses
    const expenseCount = await Expense.countDocuments({ budget: budget._id });
    if (expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete budget with associated expenses'
      });
    }

    await budget.deleteOne();

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get budget analytics
// @route   GET /api/budgets/analytics
// @access  Private
const getBudgetAnalytics = async (req, res, next) => {
  try {
    // Build query based on user role
    let query = {};
    if (req.user.role === 'user') {
      query.owner = req.user._id;
    } else if (req.user.role === 'manager') {
      query.$or = [
        { owner: req.user._id },
        { department: req.user.department }
      ];
    }

    const budgets = await Budget.find(query).populate('category', 'name');
    
    // Calculate analytics
    let totalBudgets = budgets.length;
    let totalAllocated = 0;
    let totalSpent = 0;
    let categoryBreakdown = {};
    let statusBreakdown = {
      draft: 0,
      pending: 0,
      approved: 0,
      active: 0,
      expired: 0
    };

    for (const budget of budgets) {
      totalAllocated += budget.amount;
      statusBreakdown[budget.status]++;

      // Get expenses for this budget
      const expenses = await Expense.find({
        budget: budget._id,
        status: 'approved'
      });

      const spentAmount = expenses.reduce((total, expense) => total + expense.amount, 0);
      totalSpent += spentAmount;

      // Category breakdown
      const categoryName = budget.category?.name || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {
          allocated: 0,
          spent: 0,
          count: 0
        };
      }
      categoryBreakdown[categoryName].allocated += budget.amount;
      categoryBreakdown[categoryName].spent += spentAmount;
      categoryBreakdown[categoryName].count++;
    }

    const totalRemaining = totalAllocated - totalSpent;
    const overallUsage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalBudgets,
          totalAllocated,
          totalSpent,
          totalRemaining,
          overallUsage
        },
        statusBreakdown,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics
};