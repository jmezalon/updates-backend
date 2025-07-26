const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for sending emails
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
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
    console.log('Email service configuration:');
    console.log('- SMTP_HOST:', process.env.SMTP_HOST);
    console.log('- SMTP_PORT:', process.env.SMTP_PORT);
    console.log('- SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('- SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
    
    const transporter = createTransporter();
    
    // Test the connection first
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
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
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail
};
