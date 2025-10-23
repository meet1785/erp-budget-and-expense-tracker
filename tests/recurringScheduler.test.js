const mongoose = require('mongoose');
const Expense = require('../server/models/Expense');
const Category = require('../server/models/Category');
const Budget = require('../server/models/Budget');
const User = require('../server/models/User');
const recurringExpenseScheduler = require('../server/services/recurringExpenseScheduler');

// Mock environment variables
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_test';
process.env.JWT_SECRET = 'test_secret';
process.env.CLIENT_URL = 'http://localhost:3000';

describe('Recurring Expense Scheduler', () => {
  let testUser;
  let testCategory;
  let testBudget;
  let recurringExpense;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    // Stop scheduler if running
    if (recurringExpenseScheduler.getStatus().isRunning) {
      recurringExpenseScheduler.stop();
    }
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Category.deleteMany({});
    await Budget.deleteMany({});
    await Expense.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Category.deleteMany({});
    await Budget.deleteMany({});
    await Expense.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      department: 'IT'
    });

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      description: 'Category for testing',
      createdBy: testUser._id
    });

    // Create test budget
    testBudget = await Budget.create({
      name: 'Test Budget',
      description: 'Budget for testing',
      amount: 10000,
      period: 'monthly',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      category: testCategory._id,
      owner: testUser._id,
      status: 'active'
    });
  });

  describe('Scheduler Status', () => {
    test('should return correct initial status', () => {
      const status = recurringExpenseScheduler.getStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('lastRunTime');
      expect(status).toHaveProperty('nextRunTime');
      expect(status).toHaveProperty('processedCount');
      expect(status).toHaveProperty('errorCount');
    });

    test('should start scheduler successfully', () => {
      recurringExpenseScheduler.start();
      const status = recurringExpenseScheduler.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.activeJobs).toContain('daily');
      recurringExpenseScheduler.stop();
    });

    test('should stop scheduler successfully', () => {
      recurringExpenseScheduler.start();
      recurringExpenseScheduler.stop();
      const status = recurringExpenseScheduler.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.activeJobs).toHaveLength(0);
    });
  });

  describe('Recurring Expense Processing', () => {
    test('should process due monthly recurring expense', async () => {
      // Create a recurring expense that's due
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      recurringExpense = await Expense.create({
        title: 'Monthly Subscription',
        description: 'Test monthly subscription',
        amount: 100,
        date: yesterday,
        category: testCategory._id,
        budget: testBudget._id,
        submittedBy: testUser._id,
        status: 'approved',
        isRecurring: true,
        recurringPeriod: 'monthly',
        nextRecurringDate: yesterday
      });

      // Process recurring expenses
      await recurringExpenseScheduler.processRecurringExpenses();

      // Check that a new expense was created
      const expenses = await Expense.find({
        parentExpenseId: recurringExpense._id
      });

      expect(expenses).toHaveLength(1);
      expect(expenses[0].title).toBe('Monthly Subscription');
      expect(expenses[0].status).toBe('pending');
      expect(expenses[0].isRecurring).toBe(false);
      expect(expenses[0].parentExpenseId.toString()).toBe(recurringExpense._id.toString());

      // Check that parent's next recurring date was updated
      const updatedParent = await Expense.findById(recurringExpense._id);
      expect(updatedParent.nextRecurringDate).not.toEqual(yesterday);
      expect(updatedParent.nextRecurringDate.getTime()).toBeGreaterThan(yesterday.getTime());
    });

    test('should process weekly recurring expense correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      recurringExpense = await Expense.create({
        title: 'Weekly Expense',
        description: 'Test weekly expense',
        amount: 50,
        date: yesterday,
        category: testCategory._id,
        submittedBy: testUser._id,
        status: 'approved',
        isRecurring: true,
        recurringPeriod: 'weekly',
        nextRecurringDate: yesterday
      });

      await recurringExpenseScheduler.processRecurringExpenses();

      const updatedParent = await Expense.findById(recurringExpense._id);
      const expectedNextDate = new Date(yesterday);
      expectedNextDate.setDate(expectedNextDate.getDate() + 7);
      
      expect(updatedParent.nextRecurringDate.toDateString()).toBe(expectedNextDate.toDateString());
    });

    test('should process quarterly recurring expense correctly', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      recurringExpense = await Expense.create({
        title: 'Quarterly Expense',
        description: 'Test quarterly expense',
        amount: 500,
        date: yesterday,
        category: testCategory._id,
        submittedBy: testUser._id,
        status: 'approved',
        isRecurring: true,
        recurringPeriod: 'quarterly',
        nextRecurringDate: yesterday
      });

      await recurringExpenseScheduler.processRecurringExpenses();

      const updatedParent = await Expense.findById(recurringExpense._id);
      const expectedMonth = (yesterday.getMonth() + 3) % 12;
      
      expect(updatedParent.nextRecurringDate.getMonth()).toBe(expectedMonth);
    });

    test('should not process recurring expense that is not due', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      recurringExpense = await Expense.create({
        title: 'Future Recurring Expense',
        description: 'Not due yet',
        amount: 100,
        date: new Date(),
        category: testCategory._id,
        submittedBy: testUser._id,
        status: 'approved',
        isRecurring: true,
        recurringPeriod: 'monthly',
        nextRecurringDate: tomorrow
      });

      await recurringExpenseScheduler.processRecurringExpenses();

      const expenses = await Expense.find({
        parentExpenseId: recurringExpense._id
      });

      expect(expenses).toHaveLength(0);
    });

    test('should not process pending or rejected recurring expenses', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const pendingExpense = await Expense.create({
        title: 'Pending Recurring',
        description: 'Should not process',
        amount: 100,
        date: yesterday,
        category: testCategory._id,
        submittedBy: testUser._id,
        status: 'pending',
        isRecurring: true,
        recurringPeriod: 'monthly',
        nextRecurringDate: yesterday
      });

      await recurringExpenseScheduler.processRecurringExpenses();

      const expenses = await Expense.find({
        parentExpenseId: pendingExpense._id
      });

      expect(expenses).toHaveLength(0);
    });

    test('should create expense with correct audit log', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      recurringExpense = await Expense.create({
        title: 'Audit Test',
        description: 'Test audit logging',
        amount: 100,
        date: yesterday,
        category: testCategory._id,
        submittedBy: testUser._id,
        status: 'approved',
        isRecurring: true,
        recurringPeriod: 'monthly',
        nextRecurringDate: yesterday
      });

      await recurringExpenseScheduler.processRecurringExpenses();

      const newExpense = await Expense.findOne({
        parentExpenseId: recurringExpense._id
      });

      expect(newExpense.auditLog).toBeDefined();
      expect(newExpense.auditLog.length).toBeGreaterThan(0);
      expect(newExpense.auditLog[0].action).toBe('created');
      expect(newExpense.auditLog[0].changes.source).toBe('recurring_scheduler');
    });

    test('should preserve expense properties in recurring copy', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      recurringExpense = await Expense.create({
        title: 'Property Test',
        description: 'Test property preservation',
        amount: 200,
        currency: 'EUR',
        date: yesterday,
        category: testCategory._id,
        budget: testBudget._id,
        submittedBy: testUser._id,
        status: 'approved',
        paymentMethod: 'credit_card',
        vendor: 'Test Vendor',
        tags: ['test', 'recurring'],
        department: 'IT',
        isRecurring: true,
        recurringPeriod: 'monthly',
        nextRecurringDate: yesterday
      });

      await recurringExpenseScheduler.processRecurringExpenses();

      const newExpense = await Expense.findOne({
        parentExpenseId: recurringExpense._id
      });

      expect(newExpense.title).toBe(recurringExpense.title);
      expect(newExpense.amount).toBe(recurringExpense.amount);
      expect(newExpense.currency).toBe(recurringExpense.currency);
      expect(newExpense.paymentMethod).toBe(recurringExpense.paymentMethod);
      expect(newExpense.vendor).toBe(recurringExpense.vendor);
      expect(newExpense.department).toBe(recurringExpense.department);
      expect(newExpense.tags).toEqual(recurringExpense.tags);
    });
  });

  describe('Manual Trigger', () => {
    test('should allow manual triggering of processing', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      recurringExpense = await Expense.create({
        title: 'Manual Trigger Test',
        description: 'Test manual trigger',
        amount: 150,
        date: yesterday,
        category: testCategory._id,
        submittedBy: testUser._id,
        status: 'approved',
        isRecurring: true,
        recurringPeriod: 'monthly',
        nextRecurringDate: yesterday
      });

      await recurringExpenseScheduler.triggerManualRun();

      const expenses = await Expense.find({
        parentExpenseId: recurringExpense._id
      });

      expect(expenses).toHaveLength(1);
      
      const status = recurringExpenseScheduler.getStatus();
      expect(status.lastRunTime).toBeDefined();
    });
  });
});
