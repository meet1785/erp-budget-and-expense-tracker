import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Categories: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'user') {
    return (
      <Box>
        <Alert severity="warning">
          You don't have permission to access category management. This feature is only available to managers and administrators.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Category Management
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This is a demo implementation. The full category management interface would include:
        <ul>
          <li>Create, edit, and delete expense categories</li>
          <li>Set category colors and icons</li>
          <li>Manage category hierarchies</li>
          <li>Category-based reporting</li>
          <li>Category budget allocations</li>
        </ul>
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Category Features
          </Typography>
          <Typography variant="body1" paragraph>
            The category management system enables:
          </Typography>
          <ul>
            <li><strong>Organization:</strong> Categorize expenses and budgets for better tracking</li>
            <li><strong>Visual Management:</strong> Custom colors and icons for easy identification</li>
            <li><strong>Hierarchical Structure:</strong> Create parent-child category relationships</li>
            <li><strong>Reporting:</strong> Category-based analytics and insights</li>
            <li><strong>Budget Integration:</strong> Link budgets to specific categories</li>
            <li><strong>Access Control:</strong> Manager and admin only access</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Categories;