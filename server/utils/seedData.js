const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed database...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Budget.deleteMany({});
    await Expense.deleteMany({});

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@erpbudget.com',
      password: 'password123',
      role: 'admin',
      department: 'Management'
    });

    // Create manager user
    const managerUser = await User.create({
      name: 'John Manager',
      email: 'manager@erpbudget.com',
      password: 'password123',
      role: 'manager',
      department: 'Finance'
    });

    // Create regular user
    const regularUser = await User.create({
      name: 'Jane Employee',
      email: 'user@erpbudget.com',
      password: 'password123',
      role: 'user',
      department: 'Marketing'
    });

    console.log('✅ Users created');

    // Create categories
    const categories = await Category.create([
      {
        name: 'Office Supplies',
        description: 'General office supplies and stationery',
        color: '#2196F3',
        icon: 'inventory',
        createdBy: adminUser._id
      },
      {
        name: 'Travel & Transportation',
        description: 'Business travel expenses',
        color: '#FF9800',
        icon: 'flight',
        createdBy: adminUser._id
      },
      {
        name: 'Marketing',
        description: 'Marketing and advertising expenses',
        color: '#4CAF50',
        icon: 'campaign',
        createdBy: adminUser._id
      },
      {
        name: 'Technology',
        description: 'Software, hardware, and IT expenses',
        color: '#9C27B0',
        icon: 'computer',
        createdBy: adminUser._id
      },
      {
        name: 'Training & Education',
        description: 'Employee training and development',
        color: '#F44336',
        icon: 'school',
        createdBy: adminUser._id
      },
      {
        name: 'Meals & Entertainment',
        description: 'Business meals and client entertainment',
        color: '#607D8B',
        icon: 'restaurant',
        createdBy: adminUser._id
      }
    ]);

    console.log('✅ Categories created');

    // Create budgets
    const budgets = await Budget.create([
      {
        name: 'Q4 2024 Marketing Budget',
        description: 'Fourth quarter marketing expenses',
        amount: 25000,
        period: 'quarterly',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-31'),
        category: categories.find(c => c.name === 'Marketing')._id,
        department: 'Marketing',
        owner: managerUser._id,
        status: 'active',
        alertThreshold: 80
      },
      {
        name: 'Office Supplies - Monthly',
        description: 'Monthly office supplies budget',
        amount: 2000,
        period: 'monthly',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-30'),
        category: categories.find(c => c.name === 'Office Supplies')._id,
        department: 'Finance',
        owner: managerUser._id,
        status: 'active',
        alertThreshold: 75
      },
      {
        name: 'Technology Infrastructure',
        description: 'Annual technology and software budget',
        amount: 50000,
        period: 'yearly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        category: categories.find(c => c.name === 'Technology')._id,
        department: 'IT',
        owner: adminUser._id,
        status: 'active',
        alertThreshold: 85
      }
    ]);

    console.log('✅ Budgets created');

    // Create sample expenses
    const expenses = await Expense.create([
      {
        title: 'Online Ad Campaign - Google Ads',
        description: 'Monthly Google Ads campaign for product promotion',
        amount: 3500,
        date: new Date('2024-09-10'),
        category: categories.find(c => c.name === 'Marketing')._id,
        budget: budgets.find(b => b.name === 'Q4 2024 Marketing Budget')._id,
        paymentMethod: 'credit_card',
        vendor: 'Google LLC',
        status: 'approved',
        submittedBy: regularUser._id,
        approvedBy: managerUser._id,
        department: 'Marketing',
        tags: ['advertising', 'google', 'online']
      },
      {
        title: 'Office Printer Paper',
        description: 'A4 printer paper - 10 reams',
        amount: 85,
        date: new Date('2024-09-05'),
        category: categories.find(c => c.name === 'Office Supplies')._id,
        budget: budgets.find(b => b.name === 'Office Supplies - Monthly')._id,
        paymentMethod: 'company_card',
        vendor: 'Office Depot',
        status: 'approved',
        submittedBy: regularUser._id,
        approvedBy: managerUser._id,
        department: 'Finance',
        tags: ['supplies', 'paper']
      },
      {
        title: 'Software License - Adobe Creative Suite',
        description: 'Annual Adobe Creative Suite license for design team',
        amount: 2400,
        date: new Date('2024-09-01'),
        category: categories.find(c => c.name === 'Technology')._id,
        budget: budgets.find(b => b.name === 'Technology Infrastructure')._id,
        paymentMethod: 'bank_transfer',
        vendor: 'Adobe Inc.',
        status: 'approved',
        submittedBy: adminUser._id,
        approvedBy: adminUser._id,
        department: 'IT',
        tags: ['software', 'license', 'design']
      },
      {
        title: 'Business Lunch - Client Meeting',
        description: 'Lunch meeting with potential client',
        amount: 125,
        date: new Date('2024-09-08'),
        category: categories.find(c => c.name === 'Meals & Entertainment')._id,
        paymentMethod: 'cash',
        vendor: 'The Business Bistro',
        status: 'pending',
        submittedBy: regularUser._id,
        department: 'Marketing',
        tags: ['meals', 'client', 'business']
      },
      {
        title: 'Conference Registration - Marketing Summit',
        description: 'Registration for annual marketing conference',
        amount: 850,
        date: new Date('2024-09-12'),
        category: categories.find(c => c.name === 'Training & Education')._id,
        paymentMethod: 'credit_card',
        vendor: 'Marketing Summit Organization',
        status: 'pending',
        submittedBy: regularUser._id,
        department: 'Marketing',
        tags: ['conference', 'training', 'professional development']
      }
    ]);

    console.log('✅ Expenses created');

    console.log(`
🎉 Database seeded successfully!

👥 Users created:
   - Admin: admin@erpbudget.com (password123)
   - Manager: manager@erpbudget.com (password123)
   - User: user@erpbudget.com (password123)

📊 Sample data:
   - ${categories.length} categories
   - ${budgets.length} budgets
   - ${expenses.length} expenses

🚀 You can now start the server and test the application!
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

module.exports = seedData;