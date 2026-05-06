import express from 'express';
import { contactLimiter } from '../middleware/rateLimiter.js';
import { sendContactEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/contact
 * Send contact form submission
 */
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Length validation
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name must be less than 100 characters'
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Subject must be less than 200 characters'
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be less than 5000 characters'
      });
    }

    // Log contact submission
    logger.info('Contact form submission', {
      name,
      email,
      subject,
      messageLength: message.length
    });

    // Send email
    try {
      await sendContactEmail({ name, email, subject, message });
      
      logger.info('Contact form email sent successfully', {
        name,
        email,
        subject,
        messageLength: message.length
      });
      
      res.json({
        success: true,
        message: 'Thank you for contacting us! We\'ll get back to you soon.'
      });
    } catch (emailError) {
      logger.error('Failed to send contact email', {
        error: emailError.message,
        stack: emailError.stack,
        name,
        email,
        subject
      });

      // Return error to user so they know email failed
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later or contact us directly at support@clipforge.ai'
      });
    }
  } catch (error) {
    logger.error('Contact form error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

export default router;
