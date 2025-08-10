const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for sending emails
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // false for 587, true for 465
    requireTLS: true, // Use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      ciphers: 'SSLv3' // Support older SSL versions if needed
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000 // 60 seconds
  };
  
  return nodemailer.createTransport(config);
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetToken) => {
  // Check if we should use mock email service for testing
  const useMockEmail = process.env.USE_MOCK_EMAIL === 'true';
  
  if (useMockEmail) {
    console.log('\n=== MOCK EMAIL SERVICE ===');
    console.log('Password reset email would be sent to:', email);
    console.log('Recipient name:', name);
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    console.log('\n🔗 PASSWORD RESET LINK:');
    console.log(resetUrl);
    console.log('\n📧 Email Content:');
    console.log(`Subject: Reset Your Password - Updates Admin Portal`);
    console.log(`To: ${email}`);
    console.log(`Hi ${name}, click the link above to reset your password.`);
    console.log('Token expires in 30 minutes.');
    console.log('=========================\n');
    
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }
  
  try {
    const transporter = createTransporter();
    
    // Test the connection first
    await transporter.verify();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Updates Admin Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password - Updates Admin Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          
          <p>Hi ${name},</p>
          
          <p>You requested a password reset for your Updates admin account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #FFC107; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Your Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> This link expires in 30 minutes for security reasons.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Updates Admin Portal<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send church enrollment notification email to admin
const sendChurchEnrollmentNotification = async (userEmail, name, churchName) => {
  // Check if we should use mock email service for testing
  const useMockEmail = process.env.USE_MOCK_EMAIL === 'true';
  
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail && !useMockEmail) {
    console.error('ADMIN_EMAIL environment variable not set');
    return { success: false, error: 'Admin email not configured' };
  }
  
  if (useMockEmail) {
    console.log('\n=== MOCK EMAIL SERVICE ===');
    console.log('Church enrollment notification would be sent to admin:', adminEmail || 'ADMIN_EMAIL_NOT_SET');
    console.log('\n📧 Email Content:');
    console.log(`Subject: New Church Enrollment Submission`);
    console.log(`To: ${adminEmail || 'ADMIN_EMAIL_NOT_SET'}`);
    console.log(`User Email: ${userEmail}`);
    console.log(`Church Name: ${churchName}`);
    console.log('=========================\n');
    
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Updates Admin Portal" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: 'New Church Enrollment Submission',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h4 style="color: #333; text-align: center;">Church enrollment submitted by ${name}</h4>
          
          <p>A new church enrollment has been submitted through the Updates Admin Portal.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Enrollment Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Church Name:</strong> ${churchName}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Please review this enrollment submission and take appropriate action in the admin portal.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://churchupdates.netlify.app/login" 
               style="background-color: rgba(255, 184, 0, 1); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Admin Portal
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Updates Admin Portal<br>
            This is an automated notification.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending church enrollment notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send church assignment notification email to user
const sendChurchAssignmentNotification = async (userEmail, userName, churchName) => {
  // Check if we should use mock email service for testing
  const useMockEmail = process.env.USE_MOCK_EMAIL === 'true';
  
  if (useMockEmail) {
    console.log('\n=== MOCK EMAIL SERVICE ===');
    console.log('Church assignment notification would be sent to user:', userEmail);
    console.log('\n📧 Email Content:');
    console.log(`Subject: Church Assignment Confirmed - Welcome to ${churchName}`);
    console.log(`To: ${userEmail}`);
    console.log(`User Name: ${userName}`);
    console.log(`Church Name: ${churchName}`);
    console.log('=========================\n');
    
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Updates Admin Portal" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Church Assignment Confirmed - Welcome to ${churchName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">🎉 Church Assignment Confirmed!</h2>
          
          <p>Hi ${userName},</p>
          
          <p>Great news! You have been successfully assigned to your enrolled church.</p>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="color: #333; margin-top: 0;">Assignment Details:</h3>
            <p><strong>Church Name:</strong> ${churchName}</p>
            <p><strong>Your Role:</strong> Church Administrator</p>
            <p><strong>Status:</strong> Active</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Next Steps:</strong> Please refresh the page or log in again to access your church administration features.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            You now have full access to manage your church's updates and communications through the Updates Admin Portal.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://churchupdates.netlify.app/login" 
               style="background-color: rgba(255, 184, 0, 1); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Admin Portal
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Updates Admin Portal<br>
            This is an automated notification.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending church assignment notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send admin account creation notification email to new admin
const sendAdminAccountCreationNotification = async (adminEmail, adminName, password) => {
  // Check if we should use mock email service for testing
  const useMockEmail = process.env.USE_MOCK_EMAIL === 'true';
  
  if (useMockEmail) {
    console.log('\n=== MOCK EMAIL SERVICE ===');
    console.log('Admin account creation notification would be sent to:', adminEmail);
    console.log('\n📧 Email Content:');
    console.log(`Subject: Welcome to Updates Admin Portal - Account Created`);
    console.log(`To: ${adminEmail}`);
    console.log(`Admin Name: ${adminName}`);
    console.log('Login Link: https://churchupdates.netlify.app/login');
    console.log('=========================\n');
    
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Updates Admin Portal" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: 'Welcome to Updates Admin Portal - Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">🎉 Welcome to Updates Admin Portal!</h2>
          
          <p>Hi ${adminName},</p>
          
          <p>Great news! Your admin account has been successfully created for the Updates Admin Portal.</p>
          
          <p>For your first login, please use the following temporary credentials:</p>
          <p><strong>Username:</strong> ${adminEmail}</p>
          <p><strong>Password:</strong> ${password}</p>

          <p>After logging in, you are highly encouraged to change your password to something more secure.</p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #333; margin-top: 0;">Account Details:</h3>
            <p><strong>Email:</strong> ${adminEmail}</p>
            <p><strong>Role:</strong> Church Administrator</p>
            <p><strong>Status:</strong> Active</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Next Step:</strong> Please submit your church enrollment as your first action in the portal.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://churchupdates.netlify.app/login" 
               style="background-color: rgba(255, 184, 0, 1); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Admin Portal
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Once you log in, you'll be able to submit your church enrollment and start managing your church's updates and communications after you have been assigned to your church.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Updates Admin Portal<br>
            This is an automated notification.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending admin account creation notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send account deletion notification email to user
const sendAccountDeletionNotification = async (userEmail, userName) => {
  // Check if we should use mock email service for testing
  const useMockEmail = process.env.USE_MOCK_EMAIL === 'true';
  
  if (useMockEmail) {
    console.log('\n=== MOCK EMAIL SERVICE ===');
    console.log('Account deletion notification would be sent to:', userEmail);
    console.log('\n📧 Email Content:');
    console.log(`Subject: Account Deletion Confirmation - Updates Admin Portal`);
    console.log(`To: ${userEmail}`);
    console.log(`User Name: ${userName}`);
    console.log('=========================\n');
    
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Updates Admin Portal" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Account Deletion Confirmation - Updates Admin Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Account Deletion Confirmation</h2>
          
          <p>Dear ${userName},</p>
          
          <p>We are writing to formally confirm that your account with the Updates Admin Portal has been successfully deleted from our system.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3 style="color: #333; margin-top: 0;">Account Details:</h3>
            <p><strong>Email Address:</strong> ${userEmail}</p>
            <p><strong>Account Name:</strong> ${userName}</p>
            <p><strong>Deletion Date:</strong> ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}</p>
          </div>
          
          <p>Please be advised that:</p>
          <ul style="color: #666; line-height: 1.6;">
            <li>All personal data associated with your account has been permanently removed from our servers</li>
            <li>You will no longer have access to the Updates Admin Portal</li>
            <li>Any church assignments and administrative privileges have been revoked</li>
            <li>This action cannot be undone</li>
          </ul>
          
          <p>If you believe this deletion was made in error or if you have any questions regarding this action, please contact our support team immediately.</p>
          
          <p>We thank you for your time with the Updates Admin Portal and wish you well in your future endeavors.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Updates Admin Portal<br>
            This is an automated notification regarding your account status.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending account deletion notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password change confirmation email to user
const sendPasswordChangeNotification = async (userEmail, userName) => {
  // Check if we should use mock email service for testing
  const useMockEmail = process.env.USE_MOCK_EMAIL === 'true';
  
  if (useMockEmail) {
    console.log('\n=== MOCK EMAIL SERVICE ===');
    console.log('Password change notification would be sent to:', userEmail);
    console.log('\n📧 Email Content:');
    console.log(`Subject: Password Changed Successfully - Updates Admin Portal`);
    console.log(`To: ${userEmail}`);
    console.log(`User Name: ${userName}`);
    console.log('=========================\n');
    
    return { success: true, messageId: 'mock-email-' + Date.now() };
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Updates Admin Portal" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Password Changed Successfully - Updates Admin Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">🔒 Password Changed Successfully</h2>
          
          <p>Hi ${userName},</p>
          
          <p>This email confirms that your password for the Updates Admin Portal has been successfully changed.</p>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="color: #333; margin-top: 0;">Security Update:</h3>
            <p><strong>Account:</strong> ${userEmail}</p>
            <p><strong>Change Date:</strong> ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>Status:</strong> Password updated successfully</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Security Notice:</strong> If you did not make this change, please contact support immediately and consider changing your password again.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Your account security is important to us. We recommend using a strong, unique password and keeping your login credentials secure.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Updates Admin Portal<br>
            This is an automated security notification.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password change notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendChurchEnrollmentNotification,
  sendChurchAssignmentNotification,
  sendAdminAccountCreationNotification,
  sendAccountDeletionNotification,
  sendPasswordChangeNotification
};
