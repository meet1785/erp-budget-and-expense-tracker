#!/usr/bin/env node
/**
 * Manual test script for recurring expense scheduler
 * This script creates test data and triggers the scheduler to verify functionality
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Set test database if not already set
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/erp_test_manual';
}

const User = require('../server/models/User');
const Category = require('../server/models/Category');
const Budget = require('../server/models/Budget');
const Expense = require('../server/models/Expense');
const recurringExpenseScheduler = require('../server/services/recurringExpenseScheduler');

async function runManualTest() {
  console.log('🧪 Starting Manual Recurring Expense Test\n');
  console.log('📊 Database:', process.env.MONGODB_URI);
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to database\n');

    // Clean up old test data
    console.log('🧹 Cleaning up old test data...');
    await User.deleteMany({ email: /test.*@manual\.test/ });
    await Category.deleteMany({ name: /Test.*Manual/ });
    await Budget.deleteMany({ name: /Test.*Manual/ });
    await Expense.deleteMany({ title: /Test.*Manual/ });
    console.log('✅ Cleanup complete\n');

    // Create test user
    console.log('👤 Creating test user...');
    const testUser = await User.create({
      name: 'Test Manual User',
      email: 'testuser@manual.test',
      password: 'passwordword123',
      role: 'user',
      department: 'Testing'
    });
    console.log(`✅ Created user: ${testUser.name} (${testUser.email})\n`);

    // Create test category
    console.log('📁 Creating test category...');
    const testCategory = await Category.create({
      name: 'Test Manual Category',
      description: 'Category for manual testing',
      createdBy: testUser._id
    });
    console.log(`✅ Created category: ${testCategory.name}\n`);

    // Create test budget
    console.log('💰 Creating test budget...');
    const testBudget = await Budget.create({
      name: 'Test Manual Budget',
      description: 'Budget for manual testing',
      amount: 50000,
      period: 'monthly',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      category: testCategory._id,
      owner: testUser._id,
      status: 'active'
    });
    console.log(`✅ Created budget: ${testBudget.name} ($${testBudget.amount})\n`);

    // Create recurring expenses with different periods
    console.log('🔄 Creating recurring expenses...\n');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recurringExpenses = [
      {
        title: 'Test Manual Monthly Subscription',
        description: 'Monthly recurring test expense',
        amount: 99.99,
        recurringPeriod: 'monthly',
        nextRecurringDate: yesterday
      },
      {
        title: 'Test Manual Weekly Service',
        description: 'Weekly recurring test expense',
        amount: 25.00,
        recurringPeriod: 'weekly',
        nextRecurringDate: yesterday
      },
      {
        title: 'Test Manual Quarterly Payment',
        description: 'Quarterly recurring test expense',
        amount: 500.00,
        recurringPeriod: 'quarterly',
        nextRecurringDate: yesterday
      }
    ];

    for (const expenseData of recurringExpenses) {
      const expense = await Expense.create({
        ...expenseData,
        date: yesterday,
        category: testCategory._id,
        budget: testBudget._id,
        submittedBy: testUser._id,
        status: 'approved',
        isRecurring: true,
        department: 'Testing'
      });
      console.log(`   ✔️  Created: ${expense.title} (${expense.recurringPeriod})`);
    }

    console.log('\n✅ All test data created successfully!\n');

    // Display scheduler status before processing
    console.log('📊 Scheduler Status (Before Processing):');
    const statusBefore = recurringExpenseScheduler.getStatus();
    console.log(JSON.stringify(statusBefore, null, 2));
    console.log();

    // Count expenses before processing
    const expensesBefore = await Expense.find({
      title: /Test.*Manual/
    });
    console.log(`📋 Total expenses before processing: ${expensesBefore.length}`);
    console.log(`   - Recurring templates: ${expensesBefore.filter(e => e.isRecurring).length}`);
    console.log(`   - Generated instances: ${expensesBefore.filter(e => !e.isRecurring).length}\n`);

    // Trigger manual processing
    console.log('⚡ Triggering manual recurring expense processing...\n');
    await recurringExpenseScheduler.triggerManualRun();
    console.log();

    // Wait a moment for processing to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Display scheduler status after processing
    console.log('📊 Scheduler Status (After Processing):');
    const statusAfter = recurringExpenseScheduler.getStatus();
    console.log(JSON.stringify(statusAfter, null, 2));
    console.log();

    // Count expenses after processing
    const expensesAfter = await Expense.find({
      title: /Test.*Manual/
    });
    console.log(`📋 Total expenses after processing: ${expensesAfter.length}`);
    console.log(`   - Recurring templates: ${expensesAfter.filter(e => e.isRecurring).length}`);
    console.log(`   - Generated instances: ${expensesAfter.filter(e => !e.isRecurring).length}\n`);

    // Show generated expenses
    const generatedExpenses = expensesAfter.filter(e => !e.isRecurring);
    if (generatedExpenses.length > 0) {
      console.log('📝 Generated Expenses:');
      for (const expense of generatedExpenses) {
        console.log(`   ✔️  ${expense.title}`);
        console.log(`      Amount: $${expense.amount}`);
        console.log(`      Status: ${expense.status}`);
        console.log(`      Date: ${expense.date.toISOString()}`);
        console.log(`      Parent ID: ${expense.parentExpenseId}`);
        console.log();
      }
    }

    // Verify next recurring dates were updated
    console.log('📅 Updated Next Recurring Dates:');
    const recurringTemplates = await Expense.find({
      title: /Test.*Manual/,
      isRecurring: true
    });
    for (const template of recurringTemplates) {
      console.log(`   ${template.title}:`);
      console.log(`      Next occurrence: ${template.nextRecurringDate.toISOString()}`);
      console.log(`      Period: ${template.recurringPeriod}`);
    }
    console.log();

    // Test summary
    console.log('═'.repeat(60));
    console.log('🎉 MANUAL TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Test user created: ${testUser.email}`);
    console.log(`✅ Test category created: ${testCategory.name}`);
    console.log(`✅ Test budget created: ${testBudget.name}`);
    console.log(`✅ Recurring templates created: ${recurringExpenses.length}`);
    console.log(`✅ Expenses generated: ${generatedExpenses.length}`);
    console.log(`✅ Scheduler processed: ${statusAfter.processedCount} expenses`);
    console.log('═'.repeat(60));
    
    if (generatedExpenses.length === recurringExpenses.length) {
      console.log('✅ SUCCESS: All recurring expenses were processed correctly!\n');
    } else {
      console.log('⚠️  WARNING: Expected and actual counts do not match\n');
    }

    console.log('💡 TIP: Check the database to verify the data:');
    console.log(`   Database: ${process.env.MONGODB_URI}`);
    console.log(`   Collection: expenses`);
    console.log(`   Filter: { title: /Test.*Manual/ }\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    console.log('✅ Manual test completed\n');
  }
}

// Run the test
runManualTest().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
