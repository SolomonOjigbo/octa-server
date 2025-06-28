export class BaseError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: any,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends BaseError {
  constructor(message = "Resource not found", details?: any) {
    super(message, 404, details);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = "Access denied", details?: any) {
    super(message, 403, details);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = "Authentication required", details?: any) {
    super(message, 401, details);
  }
}

export class ValidationError extends BaseError {
  constructor(message = "Validation failed", details?: any) {
    super(message, 400, details);
  }
}

export class ConflictError extends BaseError {
  constructor(message = "Resource conflict", details?: any) {
    super(message, 409, details);
  }
}

export class RateLimitError extends BaseError {
  constructor(message = "Too many requests", details?: any) {
    super(message, 429, details);
  }
}

export class DatabaseError extends BaseError {
  constructor(message = "Database operation failed", details?: any) {
    super(message, 500, details);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(message = "Service temporarily unavailable", details?: any) {
    super(message, 503, details);
  }
}

// Type for error response
export interface ErrorResponse {
  status: string;
  message: string;
  code?: string;
  details?: any;
  stack?: string;
}