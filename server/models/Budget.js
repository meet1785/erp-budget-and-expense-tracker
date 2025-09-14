const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    required: [true, 'Budget period is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot be more than 50 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Budget owner is required']
  },
  approvers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'active', 'expired'],
    default: 'draft'
  },
  alertThreshold: {
    type: Number,
    min: [0, 'Alert threshold cannot be negative'],
    max: [100, 'Alert threshold cannot exceed 100%'],
    default: 80
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Virtual for spent amount (calculated from expenses)
budgetSchema.virtual('spentAmount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'budget',
  justOne: false
});

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function() {
  return this.amount - (this.spentAmount || 0);
});

// Virtual for usage percentage
budgetSchema.virtual('usagePercentage').get(function() {
  if (this.amount === 0) return 0;
  return Math.round(((this.spentAmount || 0) / this.amount) * 100);
});

// Validate that end date is after start date
budgetSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    const error = new Error('End date must be after start date');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

// Create indexes for better query performance
budgetSchema.index({ owner: 1, startDate: -1 });
budgetSchema.index({ category: 1, status: 1 });
budgetSchema.index({ department: 1, period: 1 });

module.exports = mongoose.model('Budget', budgetSchema);