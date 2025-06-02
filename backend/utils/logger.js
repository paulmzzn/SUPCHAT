/**
 * Production-ready logging utility for Backend
 * Environment-aware logging with file output support
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Log file configuration
const logDir = path.join(__dirname, '..', '..', 'logs');
const logFile = process.env.LOG_FILE || path.join(logDir, 'supchat.log');

// Ensure log directory exists
if (isProduction && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
  constructor(context = '') {
    this.context = context;
  }
  formatMessage(level, message, args) {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? ` [${this.context}]` : '';
    const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `${timestamp} [${level}]${contextStr} ${message}${argsStr}`;
  }

  writeToFile(level, message, args) {
    if (isProduction && logFile) {
      try {
        const logMessage = this.formatMessage(level, message, args) + '\n';
        fs.appendFileSync(logFile, logMessage);
      } catch (err) {
        // Fallback to console if file writing fails
        console.error('Failed to write to log file:', err);
      }
    }
  }

  error(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR]${this.context ? ` [${this.context}]` : ''} ${message}`, ...args);
      this.writeToFile('ERROR', message, args);
    }
  }

  warn(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`[WARN]${this.context ? ` [${this.context}]` : ''} ${message}`, ...args);
      this.writeToFile('WARN', message, args);
    }
  }

  info(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
    }
  }

  debug(message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    }
  }

  // Development-only logging - completely disabled in production
  dev(message, ...args) {
    if (isDevelopment && currentLogLevel >= LOG_LEVELS.DEBUG) {

// Override console.log in production
if (isProduction) {
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Only log in production if it's explicitly allowed
    if (process.env.ALLOW_CONSOLE_LOG === 'true') {
      originalConsoleLog(...args);
    } else {
      // Redirect to logger.info for production logging
      logger.info(...args);
    }
  };
}

export { Logger, logger };
export default logger;
