export enum ErrorCode {
  // Product errors
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_SKU_EXISTS = 'PRODUCT_SKU_EXISTS',
  PRODUCT_BARCODE_EXISTS = 'PRODUCT_BARCODE_EXISTS',
  // Category errors
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_NAME_EXISTS = 'CATEGORY_NAME_EXISTS',
  // Variant errors
  VARIANT_NOT_FOUND = 'VARIANT_NOT_FOUND',
  VARIANT_SKU_EXISTS = 'VARIANT_SKU_EXISTS',
  // General
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  //B2B Connections
    B2B_CONNECTION_NOT_FOUND = 'B2B_CONNECTION_NOT_FOUND',
    B2B_CONNECTION_EXISTS = 'B2B_CONNECTION_EXISTS',
    B2B_CONNECTION_DELETED = 'B2B_CONNECTION_DELETED',
    B2B_CONNECTION_CREATED = 'B2B_CONNECTION_CREATED',
    B2B_CONNECTION_UPDATED = 'B2B_CONNECTION_UPDATED',
    B2B_CONNECTION_APPROVED = 'B2B_CONNECTION_APPROVED',
    B2B_CONNECTION_REJECTED = 'B2B_CONNECTION_REJECTED',
    B2B_CONNECTION_SYNCED = 'B2B_CONNECTION_SYNCED',
    B2B_CONNECTION_SYNC_FAILED = 'B2B_CONNECTION_SYNC_FAILED',
    B2B_CONNECTION_REVOKED = 'B2B_CONNECTION_REVOKED',

    SELF_CONNECTION = 'SELF_CONNECTION',
    SELF_CONNECTION_NOT_ALLOWED = 'SELF_CONNECTION_NOT_ALLOWED',

    TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
    TENANT_EXISTS = 'TENANT_EXISTS',
    TENANT_DELETED = 'TENANT_DELETED',

    INVALID_STATUS_CHANGE = 'INVALID_STATUS_CHANGE',

}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: ErrorCode,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(`${entity}${id ? ` with ID ${id}` : ''} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(errors: any) {
    super('Validation failed', 400, ErrorCode.VALIDATION_ERROR, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Forbidden', 403, ErrorCode.FORBIDDEN);
  }
}