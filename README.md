# ERP Budget and Expense Tracker

A comprehensive ERP-based budgeting and expense tracking system built with Node.js, Express, MongoDB, React, and TypeScript.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role authentication (Admin, Manager, User)
- **Budget Management**: Create, update, and monitor budgets with periods and thresholds
- **Expense Tracking**: Submit, approve, and track expenses against budgets
- **Recurring Expenses**: ✨ **NEW** Automated processing of recurring expenses (subscriptions, salaries, etc.)
- **Real-time Alerts**: Automated budget overrun notifications via email
- **Reporting & Analytics**: Comprehensive reports and visualizations
- **Category Management**: Organize expenses and budgets by categories
- **Role-based Access Control**: Different permissions for different user roles

### Technical Features
- **RESTful API**: Well-structured API with proper validation
- **Database Relations**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication system
- **Email Notifications**: Automated alerts and notifications
- **Scheduled Jobs**: ✨ **NEW** Daily background scheduler for recurring expenses
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Proper error handling and logging
- **Responsive Design**: Mobile-friendly React interface

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Express Validator** - Input validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/meet1785/erp-budget-and-expense-tracker.git
cd erp-budget-and-expense-tracker
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd client
npm install
cd ..
```

### 4. Environment Configuration
Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your configurations:
```env
MONGODB_URI=mongodb://localhost:27017/erp_budget_tracker
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:3000
```

### 5. Start MongoDB
Make sure MongoDB is running on your system.

### 6. Seed the database (optional)
```bash
npm run seed
```

This creates sample users, categories, budgets, and expenses:
- **Admin**: admin@erpbudget.com (password123)
- **Manager**: manager@erpbudget.com (password123)  
- **User**: user@erpbudget.com (password123)

### 7. Start the application

#### Development (both backend and frontend)
```bash
npm run dev
```

#### Backend only
```bash
npm run server
```

#### Frontend only
```bash
npm run client
```

### 8. Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Category Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Manager/Admin)
- `PUT /api/categories/:id` - Update category (Manager/Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Budget Endpoints
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get single budget
- `GET /api/budgets/analytics` - Get budget analytics
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Expense Endpoints
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get single expense
- `GET /api/expenses/analytics` - Get expense analytics
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `PUT /api/expenses/:id/review` - Approve/Reject expense (Manager/Admin)
- `DELETE /api/expenses/:id` - Delete expense

### Scheduler Endpoints (Admin/Manager)
- `GET /api/scheduler/status` - Get recurring expense scheduler status
- `POST /api/scheduler/trigger` - Manually trigger recurring expense processing (Admin only)
- `POST /api/scheduler/start` - Start the scheduler (Admin only)
- `POST /api/scheduler/stop` - Stop the scheduler (Admin only)

## 🔐 User Roles & Permissions

### Admin
- Full access to all features
- Manage users, categories, budgets, and expenses
- View all data across departments
- Delete any resource

### Manager
- Manage budgets and expenses in their department
- Approve/reject expense submissions
- Create and manage categories
- View departmental analytics

### User
- Submit and manage their own expenses
- View their budgets and expense history
- Update personal profile
- View assigned budgets

## 📊 Budget Management

### Budget Creation
- Set budget amounts and periods (monthly/quarterly/yearly/custom)
- Define alert thresholds (default 80%)
- Assign to categories and departments
- Set approval workflows

### Budget Monitoring
- Real-time spending tracking
- Usage percentage calculations
- Automated alerts when thresholds are exceeded
- Remaining budget calculations

## 💸 Expense Tracking

### Expense Submission
- Link expenses to specific budgets
- Categorize expenses
- Add receipts and documentation
- Set payment methods and vendors

### Approval Workflow
- Pending → Approved/Rejected flow
- Manager/Admin approval required
- Automatic notifications to submitters
- Rejection reasons and feedback

### Recurring Expenses
- **Automated Processing**: Daily scheduler automatically creates recurring expenses
- **Multiple Frequencies**: Support for daily, weekly, monthly, quarterly, and yearly recurrence
- **Smart Scheduling**: Expenses created only when due based on `nextRecurringDate`
- **Status Management**: New recurring expenses created with 'pending' status for approval
- **Email Notifications**: Users automatically notified when recurring expenses are created
- **Audit Trail**: Full audit logging of auto-generated expenses
- **Admin Control**: Admins can monitor, start, stop, and manually trigger the scheduler

#### Setting Up Recurring Expenses
1. Create an expense with the normal flow
2. Mark `isRecurring: true`
3. Set `recurringPeriod` (daily/weekly/monthly/quarterly/yearly)
4. Set `nextRecurringDate` to the first occurrence date
5. Approve the expense (only approved recurring expenses are processed)
6. The scheduler will automatically create new expenses on the recurring dates

#### Scheduler Configuration
- **Schedule**: Runs daily at 2:00 AM UTC (configurable via TZ environment variable)
- **Automatic Start**: Starts automatically when server starts
- **Graceful Shutdown**: Stops cleanly when server shuts down
- **Status Monitoring**: Check scheduler status via `/api/scheduler/status`
- **Manual Trigger**: Admins can manually trigger processing via `/api/scheduler/trigger`

## 📈 Reporting & Analytics

### Budget Analytics
- Total allocated vs spent amounts
- Usage percentages by category
- Status breakdowns
- Trend analysis

### Expense Analytics
- Monthly spending trends
- Category-wise breakdowns
- Status distributions
- Department comparisons

## 🧪 Testing

### Run tests
```bash
npm test
```

### Test coverage
The project includes comprehensive tests for:
- Authentication endpoints
- CRUD operations
- Input validation
- Authorization checks

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
EMAIL_HOST=your_smtp_host
EMAIL_USER=your_production_email
EMAIL_PASS=your_production_email_password
CLIENT_URL=your_production_frontend_url
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Email notifications require proper SMTP configuration
- MongoDB connection required for all operations

## ✅ Recent Enhancements

### Recurring Expense Automation (v2.1.0)
- ✅ **Automated Scheduler**: Daily background job processes recurring expenses at 2:00 AM
- ✅ **Multiple Frequencies**: Support for daily, weekly, monthly, quarterly, and yearly recurrence
- ✅ **Email Notifications**: Automatic notifications when recurring expenses are created
- ✅ **Admin Management**: API endpoints for scheduler control and monitoring
- ✅ **Comprehensive Testing**: Full test coverage for recurring expense logic

## 🔮 Future Enhancements

- [x] Receipt file upload and storage (Implemented)
- [x] Advanced reporting with PDF export (Implemented)
- [x] Multi-currency support (Implemented)
- [x] Recurring expense automation (Implemented ✨ NEW)
- [x] Advanced approval workflows (Implemented)
- [x] Audit trail and logging (Implemented)
- [ ] Mobile app development
- [ ] Integration with accounting systems
- [ ] Data export/import functionality
- [ ] Dashboard customization
- [ ] Scheduled budget reports

## 📞 Support

For support, email meet1785@example.com or create an issue in the GitHub repository.

---

**Built with ❤️ for modern ERP expense management**