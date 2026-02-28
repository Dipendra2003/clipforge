import crypto from 'crypto';

// Simple CSRF token store (use Redis in production)
const csrfTokens = new Map();

// Generate CSRF token
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from header
  const token = req.headers['x-csrf-token'];
  const sessionId = req.cookies.sessionId;

  if (!token || !sessionId) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }

  // Verify token
  const storedToken = csrfTokens.get(sessionId);
  if (!storedToken || storedToken !== token) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
};

// Generate and send CSRF token
const getCsrfToken = (req, res) => {
  const sessionId = req.cookies.sessionId || crypto.randomBytes(16).toString('hex');
  const token = generateCsrfToken();
  
  csrfTokens.set(sessionId, token);
  
  // Set session cookie
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({ csrfToken: token });
};

// Cleanup old tokens every hour
setInterval(() => {
  if (csrfTokens.size > 10000) {
    csrfTokens.clear();
  }
}, 60 * 60 * 1000);

export { csrfProtection, getCsrfToken };
