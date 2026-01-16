// Simple logger compatible with Vercel serverless environment
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Helper to stringify messages (handles objects, errors, etc.)
const stringify = (message) => {
  if (message === null || message === undefined) {
    return String(message);
  }
  if (typeof message === 'string') {
    return message;
  }
  if (message instanceof Error) {
    return `${message.message}\nStack: ${message.stack}`;
  }
  if (typeof message === 'object') {
    try {
      return JSON.stringify(message, null, 2);
    } catch (e) {
      return String(message);
    }
  }
  return String(message);
};

// Simple logging functions
const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${level}]: ${stringify(message)}`;
};

export const logger = {
  info: (message) => {
    console.log(formatMessage('INFO', message));
  },

  error: (message) => {
    console.error(formatMessage('ERROR', message));
  },

  warn: (message) => {
    console.warn(formatMessage('WARN', message));
  },

  debug: (message) => {
    if (!isProduction) {
      console.log(formatMessage('DEBUG', message));
    }
  },

  // Stream object for Morgan HTTP logger
  stream: {
    write: (message) => {
      console.log(formatMessage('INFO', message.trim()));
    },
  },
};

export default logger;
