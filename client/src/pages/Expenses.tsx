import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
} from '@mui/material';

const Expenses: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Expense Tracking
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This is a demo implementation. The full expense tracking interface would include:
        <ul>
          <li>Submit expense reports with receipts</li>
          <li>Link expenses to specific budgets</li>
          <li>Approval workflow for managers</li>
          <li>Real-time expense tracking</li>
          <li>Expense analytics and reporting</li>
        </ul>
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expense Features
          </Typography>
          <Typography variant="body1" paragraph>
            The expense tracking system provides:
          </Typography>
          <ul>
            <li><strong>Easy Submission:</strong> Quick expense entry with receipt upload</li>
            <li><strong>Budget Integration:</strong> Automatic linking to relevant budgets</li>
            <li><strong>Approval Process:</strong> Manager approval workflow with notifications</li>
            <li><strong>Real-time Tracking:</strong> Instant budget impact calculations</li>
            <li><strong>Mobile Support:</strong> Submit expenses on-the-go</li>
            <li><strong>Reporting:</strong> Detailed expense reports and analytics</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Expenses;