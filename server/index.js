const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { testEmailConnection } = require('./utils/emailService');
const { initializeCurrencyService } = require('./utils/currencyService');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware with increased limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('X-Powered-By', 'ERP Budget Tracker');
  next();
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Static file serving for temporary PDF files
app.use('/temp', express.static(path.join(__dirname, '../temp')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/expenses', require('./routes/expenses'));

// Add new routes
app.use('/api/reports', require('./routes/reports'));
app.use('/api/currency', require('./routes/currency'));
app.use('/api/uploads', require('./routes/uploads'));

// Health check endpoint with enhanced information
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Test email service
    const emailStatus = await testEmailConnection();
    
    res.json({
      success: true,
      message: 'ERP Budget Tracker API is running',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      status: {
        database: dbStatus,
        email: emailStatus ? 'Connected' : 'Error',
        server: 'Running'
      },
      features: {
        fileUpload: 'Enabled',
        multiCurrency: 'Enabled',
        pdfReports: 'Enabled',
        emailNotifications: 'Enabled',
        auditTrail: 'Enabled'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// System info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    message: 'Welcome to ERP Budget and Expense Tracker API',
    version: '2.0.0',
    features: [
      'Multi-currency support',
      'File upload for receipts',
      'PDF report generation',
      'Advanced email notifications',
      'Audit trail and logging',
      'Recurring expense automation',
      'Advanced approval workflows'
    ],
    endpoints: {
      authentication: '/api/auth',
      categories: '/api/categories',
      budgets: '/api/budgets',
      expenses: '/api/expenses',
      reports: '/api/reports',
      currency: '/api/currency',
      uploads: '/api/uploads',
      health: '/api/health'
    },
    documentation: {
      postman: '/api/docs/postman',
      swagger: '/api/docs/swagger'
    }
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: '💰 Welcome to ERP Budget and Expense Tracker API v2.0',
    description: 'Advanced ERP system for budget management and expense tracking',
    version: '2.0.0',
    newFeatures: [
      '🌍 Multi-currency support',
      '📎 File upload for receipts',
      '📊 PDF report generation',
      '📧 Enhanced email notifications',
      '📋 Audit trail and logging',
      '🔄 Recurring expense automation',
      '⚡ Advanced approval workflows'
    ],
    quickStart: {
      health: '/api/health',
      info: '/api/info',
      login: '/api/auth/login',
      expenses: '/api/expenses',
      budgets: '/api/budgets'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/auth',
      '/api/categories', 
      '/api/budgets',
      '/api/expenses',
      '/api/reports',
      '/api/currency',
      '/api/uploads',
      '/api/health'
    ]
  });
});

// Error handler middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`
  🚀 ERP Budget Tracker Server v2.0 is running!
  📡 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📊 Database: Connected
  🔗 API Endpoints: http://localhost:${PORT}/api
  📖 Health Check: http://localhost:${PORT}/api/health
  📋 System Info: http://localhost:${PORT}/api/info
  `);

  // Initialize services
  try {
    console.log('🔧 Initializing services...');
    
    // Test email connection
    await testEmailConnection();
    
    // Initialize currency service
    await initializeCurrencyService();
    
    console.log('✅ All services initialized successfully!');
  } catch (error) {
    console.warn('⚠️  Some services failed to initialize:', error.message);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Promise Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  console.log('Shutting down due to uncaught exception');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated gracefully');
  });
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated gracefully');
  });
});

module.exports = app;