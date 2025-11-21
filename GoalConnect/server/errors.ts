/**
 * Custom error types for GoalConnect
 * Provides type-safe error handling across the application
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, operation?: string) {
    const fullMessage = operation
      ? `Database operation failed (${operation}): ${message}`
      : `Database operation failed: ${message}`;
    super(fullMessage, 500, true);
  }
}

export class ValidationError extends ApiError {
  public readonly field?: string;
  public readonly invalidValue?: unknown;

  constructor(message: string, field?: string, invalidValue?: unknown) {
    super(message, 400, true);
    this.field = field;
    this.invalidValue = invalidValue;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = "Authentication required") {
    super(message, 401, true);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = "You don't have permission to access this resource") {
    super(message, 403, true);
  }
}

export class NotFoundError extends ApiError {
  public readonly resourceType?: string;
  public readonly resourceId?: number | string;

  constructor(message: string, resourceType?: string, resourceId?: number | string) {
    super(message, 404, true);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = "Network connection lost. Please check your internet.") {
    super(message, 503, true);
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is operational (vs programmer error)
 */
export function isOperationalError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Safely extract error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Extract status code from error, defaulting to 500
 */
export function getErrorStatusCode(error: unknown): number {
  if (isApiError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): {
  message: string;
  stack?: string;
  statusCode?: number;
  field?: string;
  resourceType?: string;
  resourceId?: number | string;
  type: string;
} {
  const baseInfo = {
    message: getErrorMessage(error),
    type: error?.constructor?.name || 'UnknownError',
  };

  if (error instanceof Error) {
    return {
      ...baseInfo,
      stack: error.stack,
      ...(isApiError(error) && {
        statusCode: error.statusCode,
        ...(error instanceof ValidationError && {
          field: error.field,
        }),
        ...(error instanceof NotFoundError && {
          resourceType: error.resourceType,
          resourceId: error.resourceId,
        }),
      }),
    };
  }

  return baseInfo;
}
