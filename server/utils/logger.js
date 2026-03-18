import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY'
};

// Format log message with IST timestamp
const formatLog = (level, message, metadata = {}) => {
  const istTime = new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  return JSON.stringify({
    timestamp: istTime + ' IST',
    level,
    message,
    ...metadata
  }) + '\n';
};

// Write to log file
const writeLog = (filename, content) => {
  const logPath = path.join(logsDir, filename);
  fs.appendFileSync(logPath, content);
};

// Logger functions
const logger = {
  info: (message, metadata = {}) => {
    const log = formatLog(LOG_LEVELS.INFO, message, metadata);
    console.log(log);
    writeLog('app.log', log);
  },

  warn: (message, metadata = {}) => {
    const log = formatLog(LOG_LEVELS.WARN, message, metadata);
    console.warn(log);
    writeLog('app.log', log);
  },

  error: (message, metadata = {}) => {
    const log = formatLog(LOG_LEVELS.ERROR, message, metadata);
    console.error(log);
    writeLog('error.log', log);
  },

  security: (message, metadata = {}) => {
    const log = formatLog(LOG_LEVELS.SECURITY, message, metadata);
    console.log(log);
    writeLog('security.log', log);
  },

  // Log authentication events
  authEvent: (event, userId, metadata = {}) => {
    logger.security(`Auth Event: ${event}`, {
      userId,
      ...metadata
    });
  }
};

export default logger;
