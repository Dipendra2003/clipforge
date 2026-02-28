// Input validation middleware

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  // At least 8 characters, with at least one letter and one number
  if (!password || password.length < 8) return false;
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasLetter && hasNumber;
};

const isValidName = (name) => {
  // 2-50 characters, letters, spaces, hyphens, apostrophes only
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name);
};

const validateSignup = (req, res, next) => {
  let { name, email, password } = req.body;
  
  // Sanitize inputs
  name = sanitizeInput(name);
  email = sanitizeInput(email);
  
  if (!name || !isValidName(name)) {
    return res.status(400).json({ 
      message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes' 
    });
  }
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  
  if (!password || !isValidPassword(password)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters with at least one letter and one number' 
    });
  }
  
  // Update sanitized values
  req.body.name = name;
  req.body.email = email.toLowerCase();
  
  next();
};

const validateLogin = (req, res, next) => {
  let { email, password } = req.body;
  
  // Sanitize email
  email = sanitizeInput(email);
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  // Update sanitized email
  req.body.email = email.toLowerCase();
  
  next();
};

const validateEmailOnly = (req, res, next) => {
  let { email } = req.body;
  
  // Sanitize email
  email = sanitizeInput(email);
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  
  // Update sanitized email
  req.body.email = email.toLowerCase();
  
  next();
};

const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Reset token is required' });
  }
  
  if (!password || !isValidPassword(password)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters with at least one letter and one number' 
    });
  }
  
  next();
};

export {
  validateSignup,
  validateLogin,
  validateEmailOnly,
  validateResetPassword,
  sanitizeInput
};
