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
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'],
    uppercase: true
  },
  convertedAmount: {
    type: Number, // Amount in base currency (USD)
    default: function() { return this.amount; }
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
  },
  // Approval workflow
  approvalWorkflow: {
    isRequired: {
      type: Boolean,
      default: false
    },
    steps: [{
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      order: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedAt: Date,
      comments: String
    }]
  },
  // Budget allocation rules
  allocationRules: {
    autoApprovalLimit: {
      type: Number,
      default: 0 // Expenses below this amount are auto-approved
    },
    requireReceiptAbove: {
      type: Number,
      default: 25 // Require receipt for expenses above this amount
    },
    multipleApprovalAbove: {
      type: Number,
      default: 1000 // Require multiple approvals above this amount
    }
  },
  // Recurring budget settings
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly']
    },
    nextRenewalDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  // Audit trail
  auditLog: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'approved', 'rejected', 'activated', 'expired', 'deleted'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    },
    reason: String
  }]
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

// Virtual to check if budget is over threshold
budgetSchema.virtual('isOverThreshold').get(function() {
  return this.usagePercentage >= this.alertThreshold;
});

// Virtual to check if budget is expired
budgetSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual for formatted amount with currency
budgetSchema.virtual('formattedAmount').get(function() {
  const symbols = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', 
    AUD: 'A$', CHF: 'CHF', CNY: '¥', INR: '₹', BRL: 'R$'
  };
  const symbol = symbols[this.currency] || this.currency;
  return `${symbol}${this.amount.toFixed(2)}`;
});

// Pre-save middleware
budgetSchema.pre('save', function(next) {
  // Validate that end date is after start date
  if (this.endDate <= this.startDate) {
    const error = new Error('End date must be after start date');
    error.statusCode = 400;
    return next(error);
  }

  // Set next renewal date for recurring budgets
  if (this.recurring.isRecurring && !this.recurring.nextRenewalDate) {
    const nextRenewal = new Date(this.endDate);
    switch (this.recurring.frequency) {
      case 'monthly':
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        break;
      case 'quarterly':
        nextRenewal.setMonth(nextRenewal.getMonth() + 3);
        break;
      case 'yearly':
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        break;
    }
    this.recurring.nextRenewalDate = nextRenewal;
  }

  // Update status based on dates
  const now = new Date();
  if (this.status === 'approved' && now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  } else if (this.status === 'active' && now > this.endDate) {
    this.status = 'expired';
  }

  next();
});

// Methods
budgetSchema.methods.addAuditLog = function(action, performedBy, changes = null, reason = null) {
  this.auditLog.push({
    action,
    performedBy,
    timestamp: new Date(),
    changes,
    reason
  });
};

budgetSchema.methods.calculateSpentAmount = async function() {
  const Expense = mongoose.model('Expense');
  const expenses = await Expense.find({ 
    budget: this._id, 
    status: { $in: ['approved', 'reimbursed'] }
  });
  
  return expenses.reduce((total, expense) => total + (expense.convertedAmount || expense.amount), 0);
};

budgetSchema.methods.isApprovalRequired = function(expenseAmount) {
  return expenseAmount > this.allocationRules.autoApprovalLimit;
};

budgetSchema.methods.requiresReceipt = function(expenseAmount) {
  return expenseAmount > this.allocationRules.requireReceiptAbove;
};

budgetSchema.methods.requiresMultipleApproval = function(expenseAmount) {
  return expenseAmount > this.allocationRules.multipleApprovalAbove;
};

// Static methods
budgetSchema.statics.getActiveBudgets = function() {
  return this.find({ 
    status: 'active',
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).populate('owner category approvers');
};

budgetSchema.statics.getBudgetsNearingThreshold = function(threshold = 80) {
  // This would require aggregation to calculate spent amounts
  return this.aggregate([
    {
      $lookup: {
        from: 'expenses',
        localField: '_id',
        foreignField: 'budget',
        as: 'expenses'
      }
    },
    {
      $addFields: {
        spentAmount: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$expenses',
                  cond: { $in: ['$$this.status', ['approved', 'reimbursed']] }
                }
              },
              as: 'expense',
              in: { $ifNull: ['$$expense.convertedAmount', '$$expense.amount'] }
            }
          }
        }
      }
    },
    {
      $addFields: {
        usagePercentage: {
          $cond: {
            if: { $eq: ['$amount', 0] },
            then: 0,
            else: { $multiply: [{ $divide: ['$spentAmount', '$amount'] }, 100] }
          }
        }
      }
    },
    {
      $match: {
        usagePercentage: { $gte: threshold },
        status: 'active',
        isActive: true
      }
    }
  ]);
};

budgetSchema.statics.getExpiredBudgets = function() {
  return this.find({
    endDate: { $lt: new Date() },
    status: { $ne: 'expired' }
  });
};

budgetSchema.statics.getBudgetsForRenewal = function() {
  return this.find({
    'recurring.isRecurring': true,
    'recurring.nextRenewalDate': { $lte: new Date() },
    'recurring.autoRenew': true
  });
};

// Create indexes for better query performance
budgetSchema.index({ owner: 1, startDate: -1 });
budgetSchema.index({ category: 1, status: 1 });
budgetSchema.index({ department: 1, period: 1 });
budgetSchema.index({ status: 1, isActive: 1 });
budgetSchema.index({ startDate: 1, endDate: 1 });
budgetSchema.index({ currency: 1 });
budgetSchema.index({ 'recurring.nextRenewalDate': 1 });

// Ensure virtual fields are included in JSON output
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);