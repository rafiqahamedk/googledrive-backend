const nodemailer = require('nodemailer');

// Create transporter
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

// Send activation email
const sendActivationEmail = async (email, firstName, activationToken) => {
  const transporter = createTransporter();
  
  const activationUrl = `${process.env.FRONTEND_URL}/activate-account?token=${activationToken}`;
  
  const mailOptions = {
    from: `"Google Drive Clone" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Activate Your Account',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #4285f4;">Welcome to Google Drive Clone!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering with Google Drive Clone. To complete your registration, please click the button below to activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" 
             style="background-color: #4285f4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Activate Account
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${activationUrl}</p>
        <p><strong>Note:</strong> This activation link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Activation email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending activation email:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Google Drive Clone" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #4285f4;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested to reset your password for your Google Drive Clone account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #ea4335; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>Note:</strong> This reset link will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail
};