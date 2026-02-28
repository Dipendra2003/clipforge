import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Token from '../models/Token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { OAuth2Client } from 'google-auth-library';
import logger from '../utils/logger.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Account lockout tracking (use Redis in production)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Generate JWT tokens
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      logger.security('Signup attempt with existing email', { email, ip: req.ip });
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({ name, email, password });
    logger.authEvent('USER_SIGNUP', user.id, { email, ip: req.ip });

    // Generate verification token (for link)
    const verificationToken = await Token.create(user.id, 'verify', 24 * 60); // 24 hours
    
    // Generate OTP (for manual entry)
    const otpToken = await Token.createOTP(user.id, 'verify', 60); // 60 minutes

    console.log('📧 Sending verification email...');
    console.log('   Email:', email);
    console.log('   OTP:', otpToken.token);
    console.log('   Link Token:', verificationToken.token.substring(0, 20) + '...');

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken.token, otpToken.token);
      console.log('✓ Verification email sent successfully');
    } catch (emailError) {
      console.error('✗ Error sending verification email:', emailError.message);
      console.error('   Full error:', emailError);
      // Continue with signup even if email fails
    }

    res.status(201).json({
      message: 'Account created successfully! Please check your email to verify your account.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    logger.error('Signup error', { error: error.message, ip: req.ip });
    res.status(500).json({ message: 'Error creating account' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip;

    // Check if account is locked
    const attempts = loginAttempts.get(email);
    if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const timeLeft = attempts.lockedUntil - Date.now();
      if (timeLeft > 0) {
        logger.security('Login attempt on locked account', { email, ip: clientIp });
        return res.status(429).json({ 
          message: `Account temporarily locked. Try again in ${Math.ceil(timeLeft / 60000)} minutes` 
        });
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(email);
      }
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      // Track failed attempt
      trackFailedLogin(email);
      logger.security('Login attempt with non-existent email', { email, ip: clientIp });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Track failed attempt
      trackFailedLogin(email);
      logger.security('Failed login attempt', { email, userId: user.id, ip: clientIp });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Reset failed attempts on successful login
    loginAttempts.delete(email);

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in. Check your inbox for the verification code.',
        emailVerified: false 
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token in database
    const device = req.headers['user-agent'] || 'unknown';
    await Session.create(user.id, refreshToken, device);

    logger.authEvent('USER_LOGIN', user.id, { email, ip: clientIp, device });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, ip: req.ip });
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Track failed login attempts
const trackFailedLogin = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  attempts.count++;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
    logger.security('Account locked due to failed attempts', { email, attempts: attempts.count });
  }
  
  loginAttempts.set(email, attempts);
};

// Google OAuth
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    // Check if user exists by Google ID
    let user = await User.findByGoogleId(googleId);

    if (!user) {
      // Check if email is already registered
      user = await User.findByEmail(email);
      
      if (user) {
        // Link Google account to existing user
        await User.linkGoogleAccount(user.id, googleId);
        logger.authEvent('GOOGLE_ACCOUNT_LINKED', user.id, { email, ip: req.ip });
      } else {
        // Create new user with Google account
        user = await User.create({ name, email, googleId });
        logger.authEvent('GOOGLE_SIGNUP', user.id, { email, ip: req.ip });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    const device = req.headers['user-agent'] || 'unknown';
    await Session.create(user.id, refreshToken, device);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Google login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Error with Google authentication' });
  }
};

// Logout (single device)
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await Session.delete(refreshToken);
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
};

// Logout all devices
export const logoutAll = async (req, res) => {
  try {
    await Session.deleteAllByUserId(req.user.id);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if session exists
    const session = await Session.findByToken(refreshToken);
    if (!session) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId);

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    console.log('🔍 Verifying token:', token);

    // Find token
    const tokenRecord = await Token.findByToken(token, 'verify');
    
    console.log('📝 Token record found:', tokenRecord);
    
    if (!tokenRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    // Verify email
    await User.verifyEmail(tokenRecord.user_id);

    // Delete token
    await Token.delete(token);

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Delete old verification tokens
    await Token.deleteByUserIdAndType(user.id, 'verify');

    // Generate new verification token and OTP
    const verificationToken = await Token.create(user.id, 'verify', 24 * 60);
    const otpToken = await Token.createOTP(user.id, 'verify', 60); // 60 minutes

    console.log('📧 Resending verification email...');
    console.log('   Email:', email);
    console.log('   New OTP:', otpToken.token);

    // Send verification email
    await sendVerificationEmail(email, verificationToken.token, otpToken.token);
    
    console.log('✓ Verification email resent successfully');

    res.json({ message: 'Verification email sent!' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Error sending verification email' });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If that email exists, a password reset link has been sent' });
    }

    // Delete old reset tokens
    await Token.deleteByUserIdAndType(user.id, 'reset');

    // Generate reset token
    const resetToken = await Token.create(user.id, 'reset', 60); // 1 hour

    // Send reset email
    await sendPasswordResetEmail(email, resetToken.token);

    res.json({ message: 'If that email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find token
    const tokenRecord = await Token.findByToken(token, 'reset');
    if (!tokenRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    await User.updatePassword(tokenRecord.user_id, password);

    // Delete token
    await Token.delete(token);

    // Delete all sessions (logout from all devices)
    await Session.deleteAllByUserId(tokenRecord.user_id);

    res.json({ message: 'Password reset successfully!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        emailVerified: req.user.email_verified
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};
