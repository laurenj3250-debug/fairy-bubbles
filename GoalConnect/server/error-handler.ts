/**
 * Centralized error handling middleware
 * Defense-in-depth: Final layer to catch and format all errors
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { log } from "./lib/logger";
import {
  ApiError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  isApiError,
  getErrorMessage,
  getErrorStatusCode,
  formatErrorForLogging,
} from "./errors";

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  statusCode: number;
  field?: string;
  fields?: string[];
  invalidValue?: unknown;
  allowedValues?: unknown[];
  details?: unknown;
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): ErrorResponse {
  const firstError = error.errors[0];
  const field = firstError.path.join('.');

  return {
    error: `Validation failed for ${field}: ${firstError.message}`,
    statusCode: 400,
    field,
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Handle database errors
 */
function handleDatabaseError(error: Error): ErrorResponse {
  // PostgreSQL error codes
  const pgError = error as any;

  // Unique constraint violation
  if (pgError.code === '23505') {
    return {
      error: 'This record already exists',
      statusCode: 409,
      details: pgError.detail,
    };
  }

  // Foreign key violation
  if (pgError.code === '23503') {
    return {
      error: 'Referenced record does not exist',
      statusCode: 400,
      details: pgError.detail,
    };
  }

  // Not null violation
  if (pgError.code === '23502') {
    return {
      error: 'Required field is missing',
      statusCode: 400,
      field: pgError.column,
    };
  }

  // Generic database error
  return {
    error: 'Database operation failed',
    statusCode: 500,
  };
}

/**
 * Central error handling middleware
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log all errors
  const errorLog = formatErrorForLogging(error);
  log.error('[ErrorHandler]', errorLog);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle different error types
  let response: ErrorResponse;

  if (error instanceof ZodError) {
    response = handleZodError(error);
  } else if (error instanceof ValidationError) {
    response = {
      error: error.message,
      statusCode: error.statusCode,
      field: error.field,
      invalidValue: isDevelopment ? error.invalidValue : undefined,
    };
  } else if (error instanceof NotFoundError) {
    response = {
      error: error.message,
      statusCode: error.statusCode,
      details: isDevelopment ? {
        resourceType: error.resourceType,
        resourceId: error.resourceId,
      } : undefined,
    };
  } else if (error instanceof AuthenticationError) {
    response = {
      error: error.message,
      statusCode: error.statusCode,
    };
  } else if (error instanceof AuthorizationError) {
    response = {
      error: error.message,
      statusCode: error.statusCode,
    };
  } else if (error instanceof ApiError) {
    response = {
      error: error.message,
      statusCode: error.statusCode,
    };
  } else if (error instanceof Error && error.message.includes('database')) {
    response = handleDatabaseError(error);
  } else {
    // Unknown error - don't expose details in production
    response = {
      error: isDevelopment ? getErrorMessage(error) : 'An unexpected error occurred',
      statusCode: getErrorStatusCode(error),
      details: isDevelopment && error instanceof Error ? error.stack : undefined,
    };
  }

  res.status(response.statusCode).json(response);
}

/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Type-safe error response helper
 */
export function sendError(
  res: Response,
  error: unknown,
  defaultMessage: string = 'An error occurred'
): void {
  if (isApiError(error)) {
    res.status(error.statusCode).json({
      error: error.message,
      ...(error instanceof ValidationError && {
        field: error.field,
      }),
      ...(error instanceof NotFoundError && {
        resourceType: error.resourceType,
        resourceId: error.resourceId,
      }),
    });
  } else if (error instanceof ZodError) {
    const response = handleZodError(error);
    res.status(response.statusCode).json(response);
  } else {
    res.status(500).json({
      error: error instanceof Error ? error.message : defaultMessage,
    });
  }
}
