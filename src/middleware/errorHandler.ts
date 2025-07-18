import { NextFunction, Request, Response } from "express";
import { 
  BaseError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ServiceUnavailableError,
  ErrorResponse
} from "./errors";
import { isProduction } from "../shared/infra/config";
import { logger } from "@logging/logger";

// Augment Express types to include our custom error handling
declare global {
  namespace Express {
    interface Response {
      sendError: (error: BaseError) => void;
    }
  }
}

export function errorHandler(
  err: Error | BaseError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Default to 500 if status code isn't set
  const statusCode = (err as BaseError).statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Prepare error response
  const errorResponse: ErrorResponse = {
    status: 'error',
    message: err.message || 'Internal Server Error',
  };

  // Add additional details in development
  if (!isProduction) {
    errorResponse.stack = err.stack;

    if (err instanceof BaseError) {
      errorResponse.details = err.details;
      errorResponse.code = err.constructor.name;
    }
  }

  // Handle specific error types
  if (err instanceof ValidationError) {
    errorResponse.details = err.details || [];
  } else if (err instanceof DatabaseError) {
    // Don't expose database errors in production
    if (isProduction) {
      errorResponse.message = 'Database operation failed';
    }
  }

  // Log the error
  logError(err, req);

  // Set response status and send error
  res.status(statusCode).json(errorResponse);
}

// Add custom response method
export function extendResponseWithErrorHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  res.sendError = (error: BaseError) => {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(!isProduction && { details: error.details })
    });
  };
  next();
}

// Error logging function
function logError(error: Error, req: Request) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...(error instanceof BaseError && { details: error.details }),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };

  // Use proper logging service in production
  if (process.env.NODE_ENV === 'production') {
    logger.error(JSON.stringify(logEntry));
  } else {
    console.error(logEntry);
  }
}

// Utility function to handle async errors
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Export all errors for convenience
export * from './errors';