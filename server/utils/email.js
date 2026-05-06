import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  // Validate required environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
    secure: (process.env.SMTP_PORT || process.env.EMAIL_PORT) == '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS
    },
    // Add timeout and connection settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });
};

// Send verification email
export const sendVerificationEmail = async (email, token, otp) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'ClipForge AI'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
          .divider { text-align: center; margin: 30px 0; color: #999; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${process.env.APP_NAME || 'ClipForge AI'}!</h1>
          </div>
          <div class="content">
            <p>Thank you for signing up! Please verify your email address to get started.</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your verification code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This code expires in 60 minutes</p>
            </div>

            <div class="divider">
              <p>────── OR ──────</p>
            </div>

            <p>Click the button below to verify your email:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 12px;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'ClipForge AI'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('   Attempting to send email via SMTP...');
    console.log('   SMTP Host:', process.env.SMTP_HOST || process.env.EMAIL_HOST);
    console.log('   SMTP Port:', process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
    console.log('   SMTP User:', process.env.SMTP_USER || process.env.EMAIL_USER);
    
    await transporter.sendMail(mailOptions);
    console.log('✓ Verification email sent to:', email);
  } catch (error) {
    console.error('✗ Error sending verification email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, linkToken, otpToken) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${linkToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'ClipForge AI'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
          .divider { text-align: center; margin: 30px 0; color: #999; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password for your ${process.env.APP_NAME || 'ClipForge AI'} account.</p>
            <p>You can reset your password using either method below:</p>
            
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #666; font-weight: bold;">🔑 Your Reset Code</p>
              <div class="otp-code">${otpToken}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">⏰ Expires in 15 minutes</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #667eea;">
                <strong>Go to:</strong> ${process.env.FRONTEND_URL}/reset-password
              </p>
            </div>

            <div class="divider">
              <p>────── OR ──────</p>
            </div>

            <p><strong>Option 2:</strong> Or click the button below for direct reset:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 12px;">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>Reset code expires in 15 minutes</li>
                <li>Reset link expires in 1 hour</li>
                <li>You will be logged out from all devices after resetting</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'ClipForge AI'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
    
    // Development logging (server-side only - secure)
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Development Mode - Email Content Summary:');
      console.log('   - OTP Code:', otpToken);
      console.log('   - Reset Link:', resetUrl);
      console.log('   - Both options included in email');
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send contact form email
// Send video processing complete notification
export const sendProcessingCompleteEmail = async (email, userName, videoTitle, clipCount) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'ClipForge AI'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Your Video Processing is Complete!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-item { text-align: center; padding: 15px; background: white; border-radius: 10px; flex: 1; margin: 0 5px; }
          .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
          .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Processing Complete!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Great news! Your video has been processed successfully and your clips are ready.</p>
            
            <div class="success-box">
              <p style="margin: 0; font-size: 18px;"><strong>📹 ${videoTitle}</strong></p>
            </div>

            <div class="stats">
              <div class="stat-item">
                <div class="stat-number">${clipCount}</div>
                <div class="stat-label">Clips Generated</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">✓</div>
                <div class="stat-label">Ready to Post</div>
              </div>
            </div>

            <p><strong>What's next?</strong></p>
            <ul>
              <li>Review your AI-generated clips</li>
              <li>Check viral scores and recommendations</li>
              <li>Post directly to YouTube or Instagram</li>
              <li>Download clips for manual posting</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard/clips" class="button">View Your Clips</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              💡 <strong>Pro Tip:</strong> Clips with higher viral scores tend to perform better on social media!
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'ClipForge AI'}. All rights reserved.</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.FRONTEND_URL}/dashboard/settings?tab=notifications" style="color: #667eea; text-decoration: none;">Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✓ Processing complete email sent to:', email);
  } catch (error) {
    console.error('✗ Error sending processing complete email:', error.message);
    throw error;
  }
};

// Send scheduled post reminder notification
export const sendScheduledPostReminderEmail = async (email, userName, posts) => {
  const transporter = createTransporter();

  const postsList = posts.map(post => `
    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold;">${post.title}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
        📅 ${new Date(post.scheduled_for).toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })} • ${post.platform.toUpperCase()}
      </p>
    </div>
  `).join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'ClipForge AI'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: email,
    subject: `⏰ Reminder: ${posts.length} Scheduled Post${posts.length > 1 ? 's' : ''} Coming Up`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Scheduled Posts Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>This is a friendly reminder about your upcoming scheduled posts:</p>
            
            <div class="reminder-box">
              <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>📋 Your Scheduled Posts:</strong></p>
              ${postsList}
            </div>

            <p><strong>Quick Actions:</strong></p>
            <ul>
              <li>Review and edit scheduled posts</li>
              <li>Reschedule if needed</li>
              <li>Cancel posts you no longer want</li>
              <li>Add more scheduled posts</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard/scheduled" class="button">Manage Scheduled Posts</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              💡 <strong>Tip:</strong> Posting consistently at optimal times increases engagement!
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'ClipForge AI'}. All rights reserved.</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.FRONTEND_URL}/dashboard/settings?tab=notifications" style="color: #667eea; text-decoration: none;">Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✓ Scheduled post reminder email sent to:', email);
  } catch (error) {
    console.error('✗ Error sending scheduled post reminder email:', error.message);
    throw error;
  }
};

// Send marketing/tips email
export const sendMarketingEmail = async (email, userName, subject, content) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'ClipForge AI'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 ${subject}</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            ${content}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'ClipForge AI'}. All rights reserved.</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.FRONTEND_URL}/dashboard/settings?tab=notifications" style="color: #667eea; text-decoration: none;">Unsubscribe from marketing emails</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✓ Marketing email sent to:', email);
  } catch (error) {
    console.error('✗ Error sending marketing email:', error.message);
    throw error;
  }
};

// Send contact form email
export const sendContactEmail = async ({ name, email, subject, message }) => {
  const transporter = createTransporter();
  
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER;

  // Email to support team
  const mailOptions = {
    from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'ClipForge AI'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: supportEmail,
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
          .message-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd; }
          .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="info-box">
              <p class="label">From:</p>
              <p>${name} &lt;${email}&gt;</p>
            </div>

            <div class="info-box">
              <p class="label">Subject:</p>
              <p>${subject}</p>
            </div>

            <div class="message-box">
              <p class="label">Message:</p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>

            <div class="info-box">
              <p class="label">Submitted:</p>
              <p>${new Date().toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'long' 
              })}</p>
            </div>

            <p style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px; font-size: 14px;">
              <strong>💡 Quick Reply:</strong> Simply reply to this email to respond directly to ${name}.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'ClipForge AI'} - Contact Form System</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  // Auto-reply to user
  const autoReplyOptions = {
    from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'ClipForge AI'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: email,
    subject: `Re: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting Us!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for reaching out to ${process.env.APP_NAME || 'ClipForge AI'}! We've received your message and our team will get back to you as soon as possible.</p>
            
            <div class="highlight">
              <p><strong>Your Message:</strong></p>
              <p><em>"${subject}"</em></p>
            </div>

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our support team will review your message</li>
              <li>You'll receive a response within 24-48 hours</li>
              <li>For urgent matters, we prioritize based on severity</li>
            </ul>

            <p>In the meantime, you might find these resources helpful:</p>
            <ul>
              <li><a href="${process.env.FRONTEND_URL}/about" style="color: #667eea;">About Us</a></li>
              <li><a href="${process.env.FRONTEND_URL}/pricing" style="color: #667eea;">Pricing Plans</a></li>
              <li><a href="${process.env.FRONTEND_URL}/demo" style="color: #667eea;">Try Demo</a></li>
            </ul>

            <p>Best regards,<br>The ${process.env.APP_NAME || 'ClipForge AI'} Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'ClipForge AI'}. All rights reserved.</p>
            <p>This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    // Test connection first
    await transporter.verify();
    console.log('✓ SMTP connection verified');
    
    // Send both emails
    await Promise.all([
      transporter.sendMail(mailOptions),
      transporter.sendMail(autoReplyOptions)
    ]);
    
    console.log('✓ Contact form emails sent successfully');
    console.log('   - Notification sent to:', supportEmail);
    console.log('   - Auto-reply sent to:', email);
  } catch (error) {
    console.error('✗ Error sending contact form email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      secure: (process.env.SMTP_PORT || process.env.EMAIL_PORT) == '465'
    });
    throw error;
  }
};
