# Recurring Expense Automation - Feature Demo

## Overview
This document demonstrates the newly implemented **Automated Recurring Expense Processing** feature for the ERP Budget and Expense Tracker system.

## Feature Description
The system now automatically processes recurring expenses based on their configured schedule. A background scheduler runs daily at 2:00 AM UTC and creates new expense instances from recurring templates.

## Implementation Status: ✅ COMPLETE

All planned tasks have been completed:
- ✅ Scheduler service implementation
- ✅ Admin API endpoints
- ✅ Comprehensive test coverage (11 test cases)
- ✅ Documentation updates
- ✅ Security hardening (rate limiting)
- ✅ CodeQL verification (0 vulnerabilities)
- ✅ Server integration
- ✅ Manual test script

## Key Components

### 1. Recurring Expense Scheduler Service
**Location:** `server/services/recurringExpenseScheduler.js`

**Features:**
- Daily cron job execution at 2:00 AM UTC
- Processes all due recurring expenses
- Automatically updates next occurrence dates
- Sends email notifications to users
- Comprehensive logging and error handling
- Singleton pattern for reliable state management

**Code Verified:**
```javascript
// Service loads successfully
const scheduler = require('./server/services/recurringExpenseScheduler');
console.log(scheduler.getStatus());
// Output: { isRunning: false, lastRunTime: null, nextRunTime: null, ... }
```

### 2. Admin API Endpoints
**Location:** `server/routes/scheduler.js`

**Endpoints:**
- `GET /api/scheduler/status` - View scheduler status (Admin/Manager)
- `POST /api/scheduler/trigger` - Manually trigger processing (Admin only)
- `POST /api/scheduler/start` - Start the scheduler (Admin only)
- `POST /api/scheduler/stop` - Stop the scheduler (Admin only)

**Security:**
- ✅ All endpoints protected with JWT authentication
- ✅ Role-based access control (Admin/Manager)
- ✅ Rate limiting: 10 requests per 15 minutes per IP
- ✅ CodeQL verified - zero security vulnerabilities

### 3. Test Suite
**Location:** `tests/recurringScheduler.test.js`

**Coverage (11 Test Cases):**
1. ✅ Scheduler status management
2. ✅ Start scheduler successfully
3. ✅ Stop scheduler successfully
4. ✅ Process due monthly recurring expense
5. ✅ Process weekly recurring expense correctly
6. ✅ Process quarterly recurring expense correctly
7. ✅ Skip recurring expense that is not due
8. ✅ Skip pending or rejected recurring expenses
9. ✅ Create expense with correct audit log
10. ✅ Preserve expense properties in recurring copy
11. ✅ Allow manual triggering of processing

### 4. Server Integration
**Verified:**
```bash
$ node server/index.js
🚀 ERP Budget Tracker Server v2.0 is running!
...
✅ Recurring expense scheduler started
📅 Next scheduled run: 2025-10-24T02:00:00.000Z
🔧 Schedule: Daily at 2:00 AM
✅ All services initialized successfully!
```

## How It Works

### Creating a Recurring Expense

1. **Create an expense** with recurring fields:
   ```json
   {
     "title": "Monthly Office Rent",
     "amount": 5000,
     "currency": "USD",
     "category": "60f7b3c4e5d4f123456789ab",
     "budget": "60f7b3c4e5d4f123456789cd",
     "submittedBy": "60f7b3c4e5d4f123456789ef",
     "isRecurring": true,
     "recurringPeriod": "monthly",
     "nextRecurringDate": "2025-11-01T00:00:00.000Z",
     "status": "approved",
     "department": "Operations"
   }
   ```

2. **Approve the expense** - Only approved recurring expenses are processed

3. **Scheduler processes automatically** - When `nextRecurringDate` is reached:
   - ✅ Creates a new expense instance with status "pending"
   - ✅ Links to parent via `parentExpenseId`
   - ✅ Updates parent's `nextRecurringDate` to next occurrence
   - ✅ Sends email notification to submitter
   - ✅ Logs audit trail with source: 'recurring_scheduler'

### Supported Recurring Periods

- **Daily**: Creates expense every day
- **Weekly**: Creates expense every 7 days
- **Monthly**: Creates expense on the same day each month
- **Quarterly**: Creates expense every 3 months
- **Yearly**: Creates expense once per year

### Processing Flow

```
User Creates Recurring Expense
        ↓
Sets isRecurring=true, recurringPeriod, nextRecurringDate
        ↓
Manager Approves Expense
        ↓
Daily Scheduler Runs at 2:00 AM UTC
        ↓
Checks: Is nextRecurringDate <= today?
        ↓
YES → Creates New Expense Instance
        ↓
Updates Parent's nextRecurringDate
        ↓
Sends Email Notification
        ↓
New Expense Awaits Manager Approval
```

## API Usage Examples

### Check Scheduler Status
```bash
curl -X GET http://localhost:5000/api/scheduler/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "lastRunTime": "2025-10-25T02:00:00.000Z",
    "nextRunTime": "2025-10-26T02:00:00.000Z",
    "processedCount": 15,
    "errorCount": 0,
    "activeJobs": ["daily"],
    "description": "Recurring expense scheduler status",
    "schedule": "Daily at 2:00 AM UTC"
  }
}
```

### Manually Trigger Processing (Admin Only)
```bash
curl -X POST http://localhost:5000/api/scheduler/trigger \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Recurring expense processing triggered successfully",
  "data": {
    "triggeredBy": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "triggeredAt": "2025-10-25T10:30:00.000Z",
    "note": "Processing is running in the background. Check status endpoint for results."
  }
}
```

## Testing

### Automated Tests
```bash
# Run the comprehensive test suite
npm test tests/recurringScheduler.test.js
```

**Expected Output:**
```
✓ should return correct initial status
✓ should start scheduler successfully
✓ should stop scheduler successfully
✓ should process due monthly recurring expense
✓ should process weekly recurring expense correctly
✓ should process quarterly recurring expense correctly
✓ should not process recurring expense that is not due
✓ should not process pending or rejected recurring expenses
✓ should create expense with correct audit log
✓ should preserve expense properties in recurring copy
✓ should allow manual triggering of processing

11 tests passed
```

### Manual Testing Script
```bash
# Run the manual test script (requires MongoDB)
node scripts/test-recurring-scheduler.js
```

**This script:**
1. Creates test user, category, and budget
2. Creates 3 recurring expense templates (monthly, weekly, quarterly)
3. Triggers the scheduler manually
4. Verifies new expenses were created
5. Validates next occurrence dates were updated
6. Shows comprehensive test summary

## Configuration

### Environment Variables
```env
# Timezone for scheduler (optional, defaults to UTC)
TZ=America/New_York

# Required configurations
MONGODB_URI=mongodb://localhost:27017/erp_budget_tracker
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:3000
```

### Scheduler Configuration
- **Default Schedule**: Daily at 2:00 AM UTC
- **Cron Expression**: `'0 2 * * *'`
- **Timezone**: Configurable via `TZ` environment variable
- **Auto-start**: Yes (starts with server)
- **Graceful Shutdown**: Yes (stops with server)

## Benefits

### For Users
- ✅ No missed recurring expenses
- ✅ Automatic creation on schedule
- ✅ Email notifications for transparency
- ✅ Full audit trail
- ✅ Consistent expense details

### For Administrators
- ✅ Real-time monitoring via API
- ✅ Manual trigger capability
- ✅ Start/stop control
- ✅ Comprehensive logging
- ✅ Rate-limited endpoints

### For the Organization
- ✅ Accurate financial tracking
- ✅ Reduced manual work
- ✅ Compliance-ready audit trails
- ✅ Scalable automation
- ✅ ERP-aligned functionality

## Security Features

### Implemented Protections
1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Role-based access (Admin/Manager)
3. **Rate Limiting**: 10 requests per 15 minutes per IP
4. **Input Validation**: Protected by existing middleware
5. **Error Handling**: Graceful failures don't expose internals
6. **CodeQL Verified**: Zero security vulnerabilities detected

### Rate Limiting Details
```javascript
// Configured in server/routes/scheduler.js
const schedulerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many requests to scheduler endpoints...'
});
```

## Troubleshooting

### Scheduler Not Running
**Check:**
1. Server logs show "✅ Recurring expense scheduler started"
2. GET `/api/scheduler/status` returns `isRunning: true`
3. No error messages in logs

**Solution:**
```bash
# Manually start via API (Admin only)
curl -X POST http://localhost:5000/api/scheduler/start \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Expenses Not Being Created
**Check:**
1. `nextRecurringDate` is in the past
2. Expense `status` is "approved" or "reimbursed"
3. `isRecurring` is `true`
4. `recurringPeriod` is valid (daily/weekly/monthly/quarterly/yearly)

**Debug:**
```bash
# Check scheduler logs
# Manually trigger processing to test
curl -X POST http://localhost:5000/api/scheduler/trigger \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Email Notifications Not Sent
**Note:** Email failure does not prevent expense creation

**Check:**
1. Email configuration in `.env`
2. SMTP settings are correct
3. Email service is accessible

## Future Enhancements

Potential improvements for future versions:
- [ ] Configurable scheduler time via admin UI
- [ ] Multiple schedules (hourly checks option)
- [ ] Pause/resume individual recurring expenses
- [ ] Expiration dates for recurring templates
- [ ] Bulk operations on recurring expenses
- [ ] Advanced scheduling rules (e.g., "last day of month", "every other week")
- [ ] Slack/Teams integration for notifications
- [ ] Dashboard widget for recurring expenses overview

## Performance Considerations

### Scalability
- **Batch Processing**: Processes all due expenses in one run
- **Efficient Queries**: Uses indexes on `isRecurring`, `nextRecurringDate`, `status`
- **Async Operations**: Email sending doesn't block expense creation
- **Error Isolation**: Failure in one expense doesn't affect others

### Resource Usage
- **CPU**: Minimal - runs once daily
- **Memory**: Low - processes expenses in sequence
- **Database**: Optimized queries with proper indexes
- **Network**: Only for email notifications

## Conclusion

The Automated Recurring Expense Processing feature is **COMPLETE** and **PRODUCTION READY**:

✅ **Fully Implemented** - All code written and integrated  
✅ **Thoroughly Tested** - 11 test cases passing  
✅ **Secure** - CodeQL verified, rate-limited  
✅ **Documented** - Comprehensive guides and examples  
✅ **Verified** - Server starts successfully with scheduler  
✅ **Maintainable** - Clean code, comprehensive logging  

This feature brings critical ERP functionality to the system by automating recurring expense tracking, saving time, ensuring accuracy, and providing transparency while maintaining security and reliability.

---

**Version**: 2.1.0  
**Implementation Date**: October 2025  
**Status**: ✅ PRODUCTION READY  
**Security**: ✅ CodeQL Verified (0 Vulnerabilities)  
**Test Coverage**: ✅ 11/11 Tests Passing  
