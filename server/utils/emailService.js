const nodemailer = require('nodemailer');

// Create reusable transporter object with enhanced configuration
const createTransporter = () => {
  // Support for multiple email providers
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // For development/testing
    }
  };

  // Enhanced configuration for different providers
  if (process.env.EMAIL_SERVICE) {
    emailConfig.service = process.env.EMAIL_SERVICE; // 'gmail', 'outlook', etc.
    delete emailConfig.host;
    delete emailConfig.port;
  }

  return nodemailer.createTransporter(emailConfig);
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email configuration not provided - email features will be disabled');
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error.message);
    return false;
  }
};

// Common email template
const getEmailTemplate = (title, content, color = '#1976d2') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">
        💰 ERP Budget Tracker
      </h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; color: #6c757d; font-size: 14px;">
        This email was sent by ERP Budget Tracker System<br>
        © ${new Date().getFullYear()} ERP Budget Tracker. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

// Send budget alert email
const sendBudgetAlert = async (user, budget, spentAmount, percentage) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email not configured - skipping budget alert email');
      return false;
    }

    const transporter = createTransporter();

    const content = `
      <h2 style="color: #dc3545; margin-top: 0;">🚨 Budget Alert</h2>
      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Your budget <strong>"${budget.name}"</strong> has reached <strong style="color: #dc3545;">${percentage}%</strong> of its allocated amount.</p>
      
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #dc3545;">
        <h3 style="color: #495057; margin-top: 0;">📊 Budget Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Budget Name:</strong></td><td style="padding: 8px 0; text-align: right;">${budget.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Total Amount:</strong></td><td style="padding: 8px 0; text-align: right; color: #28a745;"><strong>$${budget.amount.toFixed(2)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Spent Amount:</strong></td><td style="padding: 8px 0; text-align: right; color: #dc3545;"><strong>$${spentAmount.toFixed(2)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Remaining:</strong></td><td style="padding: 8px 0; text-align: right; color: ${budget.amount - spentAmount > 0 ? '#28a745' : '#dc3545'};"><strong>$${(budget.amount - spentAmount).toFixed(2)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Usage:</strong></td><td style="padding: 8px 0; text-align: right;">
            <div style="background-color: #e9ecef; border-radius: 10px; height: 20px; position: relative;">
              <div style="background: linear-gradient(90deg, ${percentage > 90 ? '#dc3545' : percentage > 70 ? '#ffc107' : '#28a745'} 0%, ${percentage > 90 ? '#dc3545' : percentage > 70 ? '#ffc107' : '#28a745'}dd 100%); height: 20px; border-radius: 10px; width: ${Math.min(percentage, 100)}%;"></div>
              <span style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); line-height: 20px; color: white; font-weight: bold; font-size: 12px;">${percentage}%</span>
            </div>
          </td></tr>
        </table>
      </div>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;">
          <strong>💡 Recommendation:</strong> Please review your expenses and consider adjusting your spending to stay within budget limits.
        </p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6;">Best regards,<br><strong>ERP Budget Tracker Team</strong></p>
    `;

    const mailOptions = {
      from: `"ERP Budget Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🚨 Budget Alert: ${budget.name} (${percentage}% used)`,
      html: getEmailTemplate('Budget Alert', content, '#dc3545')
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Budget alert email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending budget alert email:', error);
    return false;
  }
};

// Send expense approval notification
const sendExpenseNotification = async (user, expense, action, approver = null) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email not configured - skipping expense notification email');
      return false;
    }

    const transporter = createTransporter();

    const isApproved = action === 'approved';
    const color = isApproved ? '#28a745' : '#dc3545';
    const icon = isApproved ? '✅' : '❌';
    const actionText = isApproved ? 'Approved' : 'Rejected';

    const content = `
      <h2 style="color: ${color}; margin-top: 0;">${icon} Expense ${actionText}</h2>
      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Your expense submission has been <strong style="color: ${color};">${action}</strong>${approver ? ` by ${approver.name}` : ''}.</p>
      
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid ${color};">
        <h3 style="color: #495057; margin-top: 0;">📄 Expense Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Title:</strong></td><td style="padding: 8px 0; text-align: right;">${expense.title}</td></tr>
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Amount:</strong></td><td style="padding: 8px 0; text-align: right; color: ${color}; font-size: 18px;"><strong>$${expense.amount.toFixed(2)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Date:</strong></td><td style="padding: 8px 0; text-align: right;">${new Date(expense.date).toLocaleDateString()}</td></tr>
          <tr><td style="padding: 8px 0; color: #495057;"><strong>Status:</strong></td><td style="padding: 8px 0; text-align: right;">
            <span style="background-color: ${color}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
              ${actionText.toUpperCase()}
            </span>
          </td></tr>
          ${expense.rejectionReason ? `<tr><td style="padding: 8px 0; color: #495057;"><strong>Reason:</strong></td><td style="padding: 8px 0; text-align: right; color: #dc3545;"><em>${expense.rejectionReason}</em></td></tr>` : ''}
          ${approver ? `<tr><td style="padding: 8px 0; color: #495057;"><strong>Approved by:</strong></td><td style="padding: 8px 0; text-align: right;">${approver.name}</td></tr>` : ''}
        </table>
      </div>
      
      ${isApproved 
        ? '<div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #155724;"><strong>🎉 Great!</strong> Your expense has been approved and will be processed for reimbursement.</p></div>'
        : '<div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #721c24;"><strong>📝 Note:</strong> If you have questions about this rejection, please contact your manager or the finance team.</p></div>'
      }
      
      <p style="font-size: 16px; line-height: 1.6;">Best regards,<br><strong>ERP Budget Tracker Team</strong></p>
    `;

    const mailOptions = {
      from: `"ERP Budget Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `${icon} Expense ${actionText}: ${expense.title}`,
      html: getEmailTemplate(`Expense ${actionText}`, content, color)
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Expense notification email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending expense notification email:', error);
    return false;
  }
};

// Send welcome email to new users
const sendWelcomeEmail = async (user, tempPassword = null) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email not configured - skipping welcome email');
      return false;
    }

    const transporter = createTransporter();

    const content = `
      <h2 style="color: #1976d2; margin-top: 0;">🎉 Welcome to ERP Budget Tracker!</h2>
      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">Welcome to our ERP Budget and Expense Tracking System! Your account has been successfully created.</p>
      
      <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #1976d2;">
        <h3 style="color: #1565c0; margin-top: 0;">👤 Your Account Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #1565c0;"><strong>Name:</strong></td><td style="padding: 8px 0; text-align: right;">${user.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #1565c0;"><strong>Email:</strong></td><td style="padding: 8px 0; text-align: right;">${user.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #1565c0;"><strong>Role:</strong></td><td style="padding: 8px 0; text-align: right; text-transform: capitalize;">${user.role}</td></tr>
          ${user.department ? `<tr><td style="padding: 8px 0; color: #1565c0;"><strong>Department:</strong></td><td style="padding: 8px 0; text-align: right;">${user.department}</td></tr>` : ''}
          ${tempPassword ? `<tr><td style="padding: 8px 0; color: #1565c0;"><strong>Temporary Password:</strong></td><td style="padding: 8px 0; text-align: right; font-family: monospace; background-color: #fff; padding: 4px 8px; border-radius: 4px;">${tempPassword}</td></tr>` : ''}
        </table>
      </div>
      
      ${tempPassword 
        ? '<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #856404;"><strong>🔒 Security Note:</strong> Please change your temporary password after your first login for security purposes.</p></div>'
        : ''
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
          🚀 Access Your Dashboard
        </a>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p style="font-size: 16px; line-height: 1.6;">Best regards,<br><strong>ERP Budget Tracker Team</strong></p>
    `;

    const mailOptions = {
      from: `"ERP Budget Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🎉 Welcome to ERP Budget Tracker - Your Account is Ready!',
      html: getEmailTemplate('Welcome!', content, '#1976d2')
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email not configured - skipping password reset email');
      return false;
    }

    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const content = `
      <h2 style="color: #ff9800; margin-top: 0;">🔐 Password Reset Request</h2>
      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password for your ERP Budget Tracker account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
          🔑 Reset Your Password
        </a>
      </div>
      
      <div style="background-color: #fff3e0; border: 1px solid #ffcc02; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;">
          <strong>⏰ Important:</strong> This password reset link will expire in 1 hour for security reasons.
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        If you can't click the button above, copy and paste this link into your browser:<br>
        <span style="font-family: monospace; background-color: #f5f5f5; padding: 4px 8px; border-radius: 4px; word-break: break-all;">${resetUrl}</span>
      </p>
      
      <p style="font-size: 16px; line-height: 1.6;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      <p style="font-size: 16px; line-height: 1.6;">Best regards,<br><strong>ERP Budget Tracker Team</strong></p>
    `;

    const mailOptions = {
      from: `"ERP Budget Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🔐 Password Reset Request - ERP Budget Tracker',
      html: getEmailTemplate('Password Reset', content, '#ff9800')
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

// Send system notification (for admins)
const sendSystemNotification = async (adminUsers, subject, message, priority = 'normal') => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email not configured - skipping system notification email');
      return false;
    }

    const transporter = createTransporter();
    const priorityColors = {
      low: '#17a2b8',
      normal: '#1976d2', 
      high: '#ff9800',
      critical: '#dc3545'
    };
    
    const color = priorityColors[priority] || '#1976d2';
    const icon = priority === 'critical' ? '🚨' : priority === 'high' ? '⚠️' : '📢';

    const content = `
      <h2 style="color: ${color}; margin-top: 0;">${icon} System Notification</h2>
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid ${color};">
        <p style="font-size: 16px; line-height: 1.6; margin: 0;">${message}</p>
      </div>
      <p style="font-size: 14px; color: #666;">
        Priority: <strong style="color: ${color}; text-transform: uppercase;">${priority}</strong><br>
        Time: ${new Date().toLocaleString()}
      </p>
    `;

    const promises = adminUsers.map(admin => 
      transporter.sendMail({
        from: `"ERP Budget Tracker System" <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: `${icon} ${subject}`,
        html: getEmailTemplate('System Notification', content, color)
      })
    );

    await Promise.all(promises);
    console.log(`✅ System notification sent to ${adminUsers.length} administrators`);
    return true;
  } catch (error) {
    console.error('❌ Error sending system notification:', error);
    return false;
  }
};

module.exports = {
  testEmailConnection,
  sendBudgetAlert,
  sendExpenseNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSystemNotification
};