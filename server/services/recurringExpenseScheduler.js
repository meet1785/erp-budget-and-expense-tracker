const cron = require('node-cron');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { sendEmail } = require('../utils/emailService');

/**
 * Recurring Expense Scheduler Service
 * Automatically processes and creates recurring expenses based on their schedule
 */
class RecurringExpenseScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.lastRunTime = null;
    this.nextRunTime = null;
    this.processedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Initialize the scheduler - runs daily at 2 AM
   */
  start() {
    if (this.isRunning) {
      console.log('⏰ Recurring expense scheduler is already running');
      return;
    }

    // Schedule daily job at 2:00 AM
    const dailyJob = cron.schedule('0 2 * * *', async () => {
      await this.processRecurringExpenses();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    this.jobs.set('daily', dailyJob);
    this.isRunning = true;
    
    // Calculate next run time
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + (now.getHours() >= 2 ? 1 : 0));
    nextRun.setHours(2, 0, 0, 0);
    this.nextRunTime = nextRun;

    console.log('✅ Recurring expense scheduler started');
    console.log(`📅 Next scheduled run: ${this.nextRunTime.toISOString()}`);
    console.log('🔧 Schedule: Daily at 2:00 AM');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️  Stopped scheduler job: ${name}`);
    });
    this.jobs.clear();
    this.isRunning = false;
    console.log('❌ Recurring expense scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      activeJobs: Array.from(this.jobs.keys())
    };
  }

  /**
   * Process all due recurring expenses
   */
  async processRecurringExpenses() {
    const startTime = new Date();
    this.lastRunTime = startTime;
    
    console.log('\n🔄 Starting recurring expense processing...');
    console.log(`⏰ Run time: ${startTime.toISOString()}`);

    try {
      // Find all recurring expenses that are due
      const dueExpenses = await Expense.find({
        isRecurring: true,
        nextRecurringDate: { $lte: new Date() },
        status: { $in: ['approved', 'reimbursed'] } // Only process approved recurring expenses
      })
        .populate('submittedBy', 'name email')
        .populate('category', 'name')
        .populate('budget', 'name amount')
        .lean();

      console.log(`📋 Found ${dueExpenses.length} due recurring expense(s)`);

      if (dueExpenses.length === 0) {
        console.log('✅ No recurring expenses to process');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Process each recurring expense
      for (const expense of dueExpenses) {
        try {
          await this.createRecurringExpense(expense);
          successCount++;
          this.processedCount++;
        } catch (error) {
          console.error(`❌ Failed to create recurring expense for: ${expense.title}`, error.message);
          failCount++;
          this.errorCount++;
        }
      }

      const duration = ((new Date() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Recurring expense processing completed in ${duration}s`);
      console.log(`   ✔️  Successfully created: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   📊 Total processed (lifetime): ${this.processedCount}`);

      // Calculate next run time
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(2, 0, 0, 0);
      this.nextRunTime = nextRun;

    } catch (error) {
      console.error('❌ Error in recurring expense processing:', error);
      this.errorCount++;
    }
  }

  /**
   * Create a new expense from a recurring template
   */
  async createRecurringExpense(templateExpense) {
    const now = new Date();

    // Create new expense based on template
    const newExpenseData = {
      title: templateExpense.title,
      description: templateExpense.description,
      amount: templateExpense.amount,
      currency: templateExpense.currency,
      exchangeRate: templateExpense.exchangeRate,
      convertedAmount: templateExpense.convertedAmount,
      date: now,
      category: templateExpense.category._id || templateExpense.category,
      budget: templateExpense.budget ? (templateExpense.budget._id || templateExpense.budget) : undefined,
      paymentMethod: templateExpense.paymentMethod,
      vendor: templateExpense.vendor,
      status: 'pending', // New recurring expense needs approval
      submittedBy: templateExpense.submittedBy._id || templateExpense.submittedBy,
      tags: templateExpense.tags || [],
      department: templateExpense.department,
      isRecurring: false, // The new expense is not recurring itself
      parentExpenseId: templateExpense._id, // Link to parent recurring expense
      notes: `Auto-generated from recurring expense: ${templateExpense.title}`
    };

    // Create the new expense
    const newExpense = await Expense.create(newExpenseData);

    // Add audit log to new expense
    newExpense.addAuditLog(
      'created',
      templateExpense.submittedBy._id || templateExpense.submittedBy,
      { source: 'recurring_scheduler' },
      'Auto-generated from recurring expense template'
    );
    await newExpense.save();

    console.log(`   ✔️  Created recurring expense: ${newExpense.title} (ID: ${newExpense._id})`);

    // Update the parent recurring expense with next occurrence date
    await this.updateNextRecurringDate(templateExpense);

    // Send notification email
    await this.sendNotificationEmail(templateExpense, newExpense);

    return newExpense;
  }

  /**
   * Calculate and update the next recurring date
   */
  async updateNextRecurringDate(expense) {
    const currentDate = expense.nextRecurringDate || new Date();
    let nextDate = new Date(currentDate);

    switch (expense.recurringPeriod) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        console.warn(`Unknown recurring period: ${expense.recurringPeriod}`);
        nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
    }

    // Update the original recurring expense
    await Expense.findByIdAndUpdate(expense._id, {
      nextRecurringDate: nextDate
    });

    console.log(`   📅 Updated next occurrence date to: ${nextDate.toISOString()}`);
  }

  /**
   * Send email notification about created recurring expense
   */
  async sendNotificationEmail(templateExpense, newExpense) {
    try {
      const user = templateExpense.submittedBy;
      if (!user || !user.email) {
        return;
      }

      const emailData = {
        to: user.email,
        subject: `Recurring Expense Created: ${newExpense.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">Recurring Expense Created</h2>
            <p>Hello ${user.name},</p>
            <p>A recurring expense has been automatically created based on your recurring expense template:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Expense Details</h3>
              <p><strong>Title:</strong> ${newExpense.title}</p>
              <p><strong>Amount:</strong> ${newExpense.currency} ${newExpense.amount.toFixed(2)}</p>
              <p><strong>Date:</strong> ${newExpense.date.toLocaleDateString()}</p>
              <p><strong>Category:</strong> ${templateExpense.category?.name || 'N/A'}</p>
              <p><strong>Status:</strong> ${newExpense.status}</p>
              ${newExpense.budget ? `<p><strong>Budget:</strong> ${templateExpense.budget?.name || 'N/A'}</p>` : ''}
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Action Required:</strong> This expense is pending approval.</p>
            </div>

            <p>This expense was automatically created from your recurring expense template scheduled for <strong>${templateExpense.recurringPeriod}</strong> recurrence.</p>
            
            <p style="margin-top: 30px;">
              <a href="${process.env.CLIENT_URL}/expenses/${newExpense._id}" 
                 style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Expense Details
              </a>
            </p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px;">
              This is an automated notification from ERP Budget & Expense Tracker.<br>
              Next occurrence: ${templateExpense.recurringPeriod === 'daily' ? 'Tomorrow' : 
                templateExpense.recurringPeriod === 'weekly' ? 'Next week' :
                templateExpense.recurringPeriod === 'monthly' ? 'Next month' :
                templateExpense.recurringPeriod === 'quarterly' ? 'Next quarter' : 'Next year'}
            </p>
          </div>
        `
      };

      await sendEmail(emailData);
    } catch (error) {
      console.warn('Failed to send notification email:', error.message);
      // Don't throw - email failure shouldn't stop expense creation
    }
  }

  /**
   * Manually trigger recurring expense processing (for testing or admin use)
   */
  async triggerManualRun() {
    console.log('🔧 Manual trigger of recurring expense processing');
    await this.processRecurringExpenses();
  }
}

// Create singleton instance
const scheduler = new RecurringExpenseScheduler();

module.exports = scheduler;
