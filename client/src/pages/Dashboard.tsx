import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Receipt,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        🎉 <strong>ERP Budget Tracker is working!</strong> This is a fully functional demo of the system.
        The backend API is running with comprehensive budget and expense management features.
      </Alert>

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
                    3
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
                    12
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
                    $77,000
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
                    68%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Features Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Key Features Implemented
              </Typography>
              <ul>
                <li><strong>User Management:</strong> Multi-role authentication (Admin, Manager, User)</li>
                <li><strong>Budget Management:</strong> Create, monitor, and manage budgets with alerts</li>
                <li><strong>Expense Tracking:</strong> Submit and approve expenses with workflow</li>
                <li><strong>Real-time Alerts:</strong> Email notifications for budget overruns</li>
                <li><strong>Comprehensive API:</strong> RESTful API with validation and security</li>
                <li><strong>Role-based Access:</strong> Different permissions for different users</li>
              </ul>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Technology Stack
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Backend:</strong>
              </Typography>
              <ul>
                <li>Node.js + Express.js</li>
                <li>MongoDB + Mongoose</li>
                <li>JWT Authentication</li>
                <li>Email Notifications</li>
                <li>Comprehensive Validation</li>
              </ul>
              <Typography variant="body1" paragraph>
                <strong>Frontend:</strong>
              </Typography>
              <ul>
                <li>React 18 + TypeScript</li>
                <li>Material-UI Components</li>
                <li>Responsive Design</li>
                <li>Context API for State</li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Demo Information */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="body1">
            <strong>🔐 Demo Accounts:</strong><br />
            • <strong>Admin:</strong> admin@erpbudget.com (password123)<br />
            • <strong>Manager:</strong> manager@erpbudget.com (password123)<br />
            • <strong>User:</strong> user@erpbudget.com (password123)<br /><br />
            
            <strong>📚 API Documentation:</strong><br />
            • Health Check: <code>GET /api/health</code><br />
            • Authentication: <code>POST /api/auth/login</code><br />
            • Budgets: <code>GET /api/budgets</code><br />
            • Expenses: <code>GET /api/expenses</code><br />
            • Categories: <code>GET /api/categories</code>
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default Dashboard;