const nodemailer = require('nodemailer');

// Create reusable transporter object
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send budget alert email
const sendBudgetAlert = async (user, budget, spentAmount, percentage) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"ERP Budget Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Budget Alert: ${budget.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Budget Alert</h2>
          <p>Dear ${user.name},</p>
          <p>Your budget <strong>${budget.name}</strong> has reached ${percentage}% of its allocated amount.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Budget Details:</h3>
            <ul>
              <li><strong>Budget Name:</strong> ${budget.name}</li>
              <li><strong>Total Amount:</strong> $${budget.amount.toFixed(2)}</li>
              <li><strong>Spent Amount:</strong> $${spentAmount.toFixed(2)}</li>
              <li><strong>Remaining:</strong> $${(budget.amount - spentAmount).toFixed(2)}</li>
              <li><strong>Usage:</strong> ${percentage}%</li>
            </ul>
          </div>
          
          <p>Please review your expenses and consider adjusting your spending to stay within budget.</p>
          
          <p>Best regards,<br>ERP Budget Tracker Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Budget alert email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending budget alert email:', error);
  }
};

// Send expense approval notification
const sendExpenseNotification = async (user, expense, action) => {
  try {
    const transporter = createTransporter();

    const subject = `Expense ${action === 'approved' ? 'Approved' : 'Rejected'}: ${expense.title}`;
    const color = action === 'approved' ? '#28a745' : '#dc3545';

    const mailOptions = {
      from: `"ERP Budget Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${color};">Expense ${action === 'approved' ? 'Approved' : 'Rejected'}</h2>
          <p>Dear ${user.name},</p>
          <p>Your expense submission has been ${action}.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Expense Details:</h3>
            <ul>
              <li><strong>Title:</strong> ${expense.title}</li>
              <li><strong>Amount:</strong> $${expense.amount.toFixed(2)}</li>
              <li><strong>Date:</strong> ${expense.date.toDateString()}</li>
              ${expense.rejectionReason ? `<li><strong>Reason:</strong> ${expense.rejectionReason}</li>` : ''}
            </ul>
          </div>
          
          <p>Best regards,<br>ERP Budget Tracker Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Expense notification email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending expense notification email:', error);
  }
};

module.exports = {
  sendBudgetAlert,
  sendExpenseNotification
};