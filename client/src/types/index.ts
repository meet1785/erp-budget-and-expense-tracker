export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  category: Category | string;
  department?: string;
  owner: User | string;
  approvers?: (User | string)[];
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  alertThreshold: number;
  isActive: boolean;
  notes?: string;
  spentAmount?: number;
  remainingAmount?: number;
  usagePercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  date: string;
  category: Category | string;
  budget?: Budget | string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other';
  vendor?: string;
  receipt?: {
    fileName: string;
    fileUrl: string;
    uploadDate: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  submittedBy: User | string;
  approvedBy?: User | string;
  approvalDate?: string;
  rejectionReason?: string;
  tags?: string[];
  department?: string;
  isRecurring: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRecurringDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  errors?: any[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  department?: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface BudgetAnalytics {
  overview: {
    totalBudgets: number;
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    overallUsage: number;
  };
  statusBreakdown: {
    [key: string]: number;
  };
  categoryBreakdown: {
    [key: string]: {
      allocated: number;
      spent: number;
      count: number;
    };
  };
}

export interface ExpenseAnalytics {
  overview: {
    totalExpenses: number;
    totalAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
  };
  statusBreakdown: {
    [key: string]: number;
  };
  categoryBreakdown: {
    [key: string]: {
      amount: number;
      count: number;
    };
  };
  monthlyTrend: {
    [key: string]: number;
  };
}