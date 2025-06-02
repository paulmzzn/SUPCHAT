/**
 * Production-ready logging utility
 * Replaces console.log with environment-aware logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Get log level from environment or default to INFO in production, DEBUG in development
const currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
  : (isProduction ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

class Logger {
  constructor(context = '') {
    this.context = context;
  }

  error(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR]${this.context ? ` [${this.context}]` : ''} ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`[WARN]${this.context ? ` [${this.context}]` : ''} ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(`[INFO]${this.context ? ` [${this.context}]` : ''} ${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG]${this.context ? ` [${this.context}]` : ''} ${message}`, ...args);
    }
  }

  // Development-only logging - completely disabled in production
  dev(message, ...args) {
    if (isDevelopment && currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(`[DEV]${this.context ? ` [${this.context}]` : ''} ${message}`, ...args);
    }
  }
}

// Create default logger
const logger = new Logger();

// Override console.log in production to use logger.info
if (isProduction) {
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Only log in production if it's explicitly allowed
    if (process.env.ALLOW_CONSOLE_LOG === 'true') {
      originalConsoleLog(...args);
    }
    // Otherwise, redirect to logger.info
    logger.info(...args);
  };
}

export { Logger, logger };
export default logger;
