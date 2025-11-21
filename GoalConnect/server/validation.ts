/**
 * Validation middleware for route parameters
 * Defense-in-depth: validate at entry points
 */

import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "./errors";

/**
 * Validates that a route parameter is a valid positive integer
 */
export function validateNumericId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];

    if (!value) {
      return res.status(400).json({
        error: `Missing required parameter: ${paramName}`,
        field: paramName,
      });
    }

    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be a number`,
        field: paramName,
        invalidValue: value,
      });
    }

    if (numValue <= 0) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be a positive number`,
        field: paramName,
        invalidValue: value,
      });
    }

    if (!Number.isInteger(numValue)) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be an integer`,
        field: paramName,
        invalidValue: value,
      });
    }

    // Add the validated number to req for type safety
    (req as any)[`validated${paramName.charAt(0).toUpperCase() + paramName.slice(1)}`] = numValue;

    next();
  };
}

/**
 * Validates multiple numeric IDs in route params
 */
export function validateNumericIds(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];

      if (!value) {
        return res.status(400).json({
          error: `Missing required parameter: ${paramName}`,
          field: paramName,
        });
      }

      const numValue = parseInt(value, 10);

      if (isNaN(numValue) || numValue <= 0 || !Number.isInteger(numValue)) {
        return res.status(400).json({
          error: `Invalid ${paramName}: must be a positive integer`,
          field: paramName,
          invalidValue: value,
        });
      }
    }

    next();
  };
}

/**
 * Validates that required fields exist in request body
 */
export function validateRequiredFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = fields.filter(field => !(field in req.body));

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        fields: missingFields,
      });
    }

    next();
  };
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export function validateDateFormat(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName] || req.body[paramName];

    if (!value) {
      return res.status(400).json({
        error: `Missing required parameter: ${paramName}`,
        field: paramName,
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be in YYYY-MM-DD format`,
        field: paramName,
        invalidValue: value,
      });
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: `Invalid ${paramName}: not a valid date`,
        field: paramName,
        invalidValue: value,
      });
    }

    next();
  };
}

/**
 * Validates enum values
 */
export function validateEnum<T extends string>(paramName: string, allowedValues: T[], source: 'params' | 'body' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = source === 'params' ? req.params[paramName] : req.body[paramName];

    if (!value) {
      return res.status(400).json({
        error: `Missing required parameter: ${paramName}`,
        field: paramName,
      });
    }

    if (!allowedValues.includes(value as T)) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be one of ${allowedValues.join(', ')}`,
        field: paramName,
        invalidValue: value,
        allowedValues,
      });
    }

    next();
  };
}

/**
 * Type-safe helper to validate and parse numeric ID from request params
 */
export function parseNumericId(value: string | undefined, fieldName: string = 'id'): number {
  if (!value) {
    throw new ValidationError(`Missing ${fieldName}`, fieldName);
  }

  const numValue = parseInt(value, 10);

  if (isNaN(numValue)) {
    throw new ValidationError(`Invalid ${fieldName}: must be a number`, fieldName, value);
  }

  if (numValue <= 0) {
    throw new ValidationError(`Invalid ${fieldName}: must be positive`, fieldName, value);
  }

  if (!Number.isInteger(numValue)) {
    throw new ValidationError(`Invalid ${fieldName}: must be an integer`, fieldName, value);
  }

  return numValue;
}

/**
 * Safely parse JSON body with validation
 */
export function safeParseJson<T>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid request body: must be a JSON object');
  }
  return body as T;
}
