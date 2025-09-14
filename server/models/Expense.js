const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Expense amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'],
    uppercase: true
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: [0, 'Exchange rate cannot be negative']
  },
  convertedAmount: {
    type: Number, // Amount in base currency (USD)
    default: function() { return this.amount; }
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'],
    default: 'other'
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: [100, 'Vendor name cannot be more than 100 characters']
  },
  receipts: [{
    fileName: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image', 'document', 'other'],
      default: 'other'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Legacy receipt field for backward compatibility
  receipt: {
    fileName: String,
    fileUrl: String,
    uploadDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reimbursed'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitter is required']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot be more than 200 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot be more than 50 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  },
  nextRecurringDate: {
    type: Date
  },
  parentExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense' // Reference to the original expense for recurring expenses
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  // Audit trail
  auditLog: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'approved', 'rejected', 'reimbursed', 'deleted'],
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
      type: mongoose.Schema.Types.Mixed // Store what was changed
    },
    reason: {
      type: String,
      maxlength: [200, 'Reason cannot be more than 200 characters']
    }
  }],
  // Expense metadata
  metadata: {
    location: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    businessPurpose: {
      type: String,
      maxlength: [300, 'Business purpose cannot be more than 300 characters']
    },
    attendees: [{
      name: String,
      email: String
    }],
    mileage: {
      distance: Number,
      rate: Number,
      startLocation: String,
      endLocation: String
    }
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
expenseSchema.index({ submittedBy: 1, date: -1 });
expenseSchema.index({ budget: 1, status: 1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ department: 1, date: -1 });
expenseSchema.index({ status: 1, date: -1 });
expenseSchema.index({ currency: 1 });
expenseSchema.index({ isRecurring: 1, nextRecurringDate: 1 });

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  // Set approval date when status changes to approved
  if (this.isModified('status') && this.status === 'approved' && !this.approvalDate) {
    this.approvalDate = new Date();
  }

  // Calculate converted amount if exchange rate is provided
  if (this.isModified('amount') || this.isModified('exchangeRate')) {
    this.convertedAmount = this.amount * (this.exchangeRate || 1);
  }

  // Migrate legacy receipt to receipts array
  if (this.receipt && this.receipt.fileName && this.receipts.length === 0) {
    this.receipts.push({
      fileName: this.receipt.fileName,
      originalName: this.receipt.fileName,
      fileUrl: this.receipt.fileUrl,
      fileSize: 0, // Unknown for legacy receipts
      fileType: 'other',
      uploadDate: this.receipt.uploadDate || new Date()
    });
  }

  next();
});

// Methods
expenseSchema.methods.addAuditLog = function(action, performedBy, changes = null, reason = null) {
  this.auditLog.push({
    action,
    performedBy,
    timestamp: new Date(),
    changes,
    reason
  });
};

expenseSchema.methods.addReceipt = function(receiptData) {
  this.receipts.push(receiptData);
};

expenseSchema.methods.removeReceipt = function(receiptId) {
  this.receipts = this.receipts.filter(receipt => receipt._id.toString() !== receiptId.toString());
};

// Virtual to get total receipts count
expenseSchema.virtual('receiptCount').get(function() {
  return this.receipts ? this.receipts.length : 0;
});

// Virtual to check if expense has receipts
expenseSchema.virtual('hasReceipts').get(function() {
  return this.receipts && this.receipts.length > 0;
});

// Virtual to get formatted amount with currency
expenseSchema.virtual('formattedAmount').get(function() {
  const symbols = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', 
    AUD: 'A$', CHF: 'CHF', CNY: '¥', INR: '₹', BRL: 'R$'
  };
  const symbol = symbols[this.currency] || this.currency;
  return `${symbol}${this.amount.toFixed(2)}`;
});

// Static methods
expenseSchema.statics.getExpensesByStatus = function(status) {
  return this.find({ status }).populate('submittedBy category budget');
};

expenseSchema.statics.getExpensesByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).populate('submittedBy category budget');
};

expenseSchema.statics.getExpensesByUser = function(userId) {
  return this.find({ submittedBy: userId }).populate('category budget');
};

expenseSchema.statics.getRecurringExpenses = function() {
  return this.find({
    isRecurring: true,
    nextRecurringDate: { $lte: new Date() }
  }).populate('submittedBy category budget');
};

// Ensure virtual fields are included in JSON output
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);