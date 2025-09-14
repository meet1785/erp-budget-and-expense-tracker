import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Receipt,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { BudgetAnalytics, ExpenseAnalytics, Budget, Expense } from '../types';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard: React.FC = () => {
  const [budgetAnalytics, setBudgetAnalytics] = useState<BudgetAnalytics | null>(null);
  const [expenseAnalytics, setExpenseAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [recentBudgets, setRecentBudgets] = useState<Budget[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [budgetAnalyticsRes, expenseAnalyticsRes, budgetsRes, expensesRes] = await Promise.all([
          api.get('/budgets/analytics'),
          api.get('/expenses/analytics'),
          api.get('/budgets?limit=5'),
          api.get('/expenses?limit=5'),
        ]);

        setBudgetAnalytics(budgetAnalyticsRes.data.data);
        setExpenseAnalytics(expenseAnalyticsRes.data.data);
        setRecentBudgets(budgetsRes.data.data);
        setRecentExpenses(expensesRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const budgetCategoryData = budgetAnalytics
    ? Object.entries(budgetAnalytics.categoryBreakdown).map(([name, data]) => ({
        name,
        value: data.allocated,
        spent: data.spent,
      }))
    : [];

  const expenseCategoryData = expenseAnalytics
    ? Object.entries(expenseAnalytics.categoryBreakdown).map(([name, data]) => ({
        name,
        value: data.amount,
      }))
    : [];

  const monthlyTrendData = expenseAnalytics
    ? Object.entries(expenseAnalytics.monthlyTrend).map(([month, amount]) => ({
        month: month.substring(5), // Remove year, keep MM
        amount,
      }))
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalanceWallet color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Budgets
                  </Typography>
                  <Typography variant="h5">
                    {budgetAnalytics?.overview.totalBudgets || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Receipt color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h5">
                    {expenseAnalytics?.overview.totalExpenses || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Allocated
                  </Typography>
                  <Typography variant="h5">
                    ${budgetAnalytics?.overview.totalAllocated?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Budget Usage
                  </Typography>
                  <Typography variant="h5">
                    {budgetAnalytics?.overview.overallUsage || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Usage Alert */}
      {budgetAnalytics && budgetAnalytics.overview.overallUsage > 80 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Budget Alert:</strong> You have used {budgetAnalytics.overview.overallUsage}% 
            of your total budget allocation. Consider reviewing your expenses.
          </Typography>
        </Alert>
      )}

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget by Category
              </Typography>
              {budgetCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={budgetCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {budgetCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Budget']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No budget data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expenses by Category
              </Typography>
              {expenseCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Expenses']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No expense data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly Trend */}
      {monthlyTrendData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Expense Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Expenses']} />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Budgets
              </Typography>
              {recentBudgets.length > 0 ? (
                recentBudgets.map((budget) => (
                  <Box key={budget._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {budget.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ${budget.amount.toLocaleString()} • {budget.status}
                    </Typography>
                    {budget.usagePercentage !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(budget.usagePercentage, 100)}
                          color={budget.usagePercentage > 80 ? 'error' : 'primary'}
                        />
                        <Typography variant="caption">
                          {budget.usagePercentage}% used
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No budgets found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Expenses
              </Typography>
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <Box key={expense._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {expense.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ${expense.amount.toLocaleString()} • {expense.status}
                    </Typography>
                    <Typography variant="caption">
                      {new Date(expense.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No expenses found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;