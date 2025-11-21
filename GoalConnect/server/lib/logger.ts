/**
 * Centralized logging utility using Winston
 * Replaces console.log statements for better production logging
 */

import winston from 'winston';
import { LOGGING } from '../../shared/constants';

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return 'info'; // Only info, warn, and error in production
    case 'test':
      return 'error'; // Minimal logging in tests
    default:
      return 'debug'; // Verbose logging in development
  }
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    return msg;
  })
);

// File format (JSON for easier parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create winston logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: fileFormat,
  defaultMeta: { service: 'goal-connect' },
  transports: [
    // Console output for all environments
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: LOGGING.MAX_FILE_SIZE,
      maxFiles: LOGGING.MAX_FILES,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: LOGGING.MAX_FILE_SIZE,
      maxFiles: LOGGING.MAX_FILES,
    })
  );
}

// Add custom logging methods for better developer experience
export const log = {
  /**
   * Debug level - detailed information for diagnosing problems
   * Only logged in development mode
   */
  debug: (message: string, ...meta: any[]) => {
    logger.debug(message, ...meta);
  },

  /**
   * Info level - general informational messages
   * Logged in development and production
   */
  info: (message: string, ...meta: any[]) => {
    logger.info(message, ...meta);
  },

  /**
   * Warn level - warning messages for potentially harmful situations
   * Always logged
   */
  warn: (message: string, ...meta: any[]) => {
    logger.warn(message, ...meta);
  },

  /**
   * Error level - error events that might still allow the application to continue
   * Always logged
   */
  error: (message: string, error?: Error | unknown, ...meta: any[]) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, { error, ...meta });
    }
  },

  /**
   * HTTP request logging
   */
  http: (method: string, path: string, statusCode: number, duration?: number) => {
    const message = `${method} ${path} ${statusCode}`;
    const meta = duration !== undefined ? { duration: `${duration}ms` } : {};

    if (statusCode >= 500) {
      logger.error(message, meta);
    } else if (statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.debug(message, meta);
    }
  },

  /**
   * Database operation logging
   */
  db: (operation: string, table: string, duration?: number) => {
    const message = `DB: ${operation} ${table}`;
    const meta = duration !== undefined ? { duration: `${duration}ms` } : {};
    logger.debug(message, meta);
  },

  /**
   * Authentication event logging
   */
  auth: (event: string, userId?: number, metadata?: Record<string, any>) => {
    logger.info(`Auth: ${event}`, { userId, ...metadata });
  },

  /**
   * Performance timing
   */
  performance: (operation: string, duration: number, threshold?: number) => {
    const message = `Performance: ${operation} took ${duration}ms`;

    if (threshold && duration > threshold) {
      logger.warn(message, { operation, duration, threshold });
    } else {
      logger.debug(message, { operation, duration });
    }
  },
};

// Export the raw logger for advanced use cases
export { logger };

// Helper to create a logger with context
export const createContextLogger = (context: string) => ({
  debug: (message: string, ...meta: any[]) => log.debug(`[${context}] ${message}`, ...meta),
  info: (message: string, ...meta: any[]) => log.info(`[${context}] ${message}`, ...meta),
  warn: (message: string, ...meta: any[]) => log.warn(`[${context}] ${message}`, ...meta),
  error: (message: string, error?: Error | unknown, ...meta: any[]) =>
    log.error(`[${context}] ${message}`, error, ...meta),
});

// Middleware for Express to log requests
export const requestLoggerMiddleware = (
  req: any,
  res: any,
  next: any
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    log.http(req.method, req.path, res.statusCode, duration);
  });

  next();
};

export default log;
