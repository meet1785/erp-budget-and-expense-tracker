const express = require('express');
const { body } = require('express-validator');
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics
} = require('../controllers/budgetController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const budgetValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Budget name must be between 2 and 100 characters'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Budget amount must be a positive number'),
  body('period')
    .isIn(['monthly', 'quarterly', 'yearly', 'custom'])
    .withMessage('Period must be monthly, quarterly, yearly, or custom'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid ID'),
  body('alertThreshold')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Alert threshold must be between 0 and 100'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department cannot be more than 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot be more than 1000 characters')
];

const updateBudgetValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Budget name must be between 2 and 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget amount must be a positive number'),
  body('period')
    .optional()
    .isIn(['monthly', 'quarterly', 'yearly', 'custom'])
    .withMessage('Period must be monthly, quarterly, yearly, or custom'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid ID'),
  body('alertThreshold')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Alert threshold must be between 0 and 100'),
  body('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'expired'])
    .withMessage('Invalid status'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department cannot be more than 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot be more than 1000 characters')
];

// Routes
router.get('/analytics', protect, getBudgetAnalytics);
router.get('/', protect, getBudgets);
router.get('/:id', protect, getBudget);
router.post('/', protect, budgetValidation, createBudget);
router.put('/:id', protect, updateBudgetValidation, updateBudget);
router.delete('/:id', protect, deleteBudget);

module.exports = router;