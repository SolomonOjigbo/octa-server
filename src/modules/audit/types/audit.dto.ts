// Base Audit Types
export interface BaseAuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Module-Specific Metadata Types
export interface UserAuditMetadata {
  targetUserId?: string;
  rolesChanged?: string[];
  permissionsChanged?: string[];
}

export interface PharmacyAuditMetadata {
  prescriptionId?: string;
  medicationId: string;
  quantity: number;
  pharmacistId: string;
  patientId?: string;
  isControlled: boolean;
  lotNumber?: string;
}
export interface PurchaseOrderAuditMetadata {
  requestedBy?: string;
  updatedBy?: string;
  linkedBy?: string;
    statusChange?: {
    from: string;
    to: string;
  };
  itemsChanged?: {
    added?: string[];
    removed?: string[];
    updated?: string[];
  };
}

export interface StockAuditMetadata {
  productId: string;
  variantId?: string;
  previousQuantity: number;
  newQuantity: number;
  location: {
    type: 'store' | 'warehouse' | 'clinic';
    id: string;
  };
  batchNumber?: string;
}
export interface B2BAuditMetadata {
    connectionId: string;
    statusChange?: {
        from: string;
        to: string;
    };
    syncedData?: {
        lastSyncedAt?: Date;
        syncErrors?: string[];
    };
    notes?: string;
    initiatedBy?: string; // User who initiated the action
    targetTenantId?: string; // Target tenant for B2B actions
    actionDetails?: string; // Additional details about the action taken
    connectionType?: string; // Type of B2B connection (e.g., purchase order
}

// Module-Specific Audit Log Types
export interface UserAuditLog extends BaseAuditLog {
  metadata: UserAuditMetadata;
}

export interface PharmacyAuditLog extends BaseAuditLog {
  metadata: PharmacyAuditMetadata;
}

export interface StockAuditLog extends BaseAuditLog {
  metadata: StockAuditMetadata;
}
export interface PurchaseOrderAuditLog extends BaseAuditLog {
  metadata: PurchaseOrderAuditMetadata;
}
export interface B2BAuditLog extends BaseAuditLog {
  metadata: B2BAuditMetadata;
}

export type AuditLog = UserAuditLog | PharmacyAuditLog | StockAuditLog | PurchaseOrderAuditLog | B2BAuditLog;


// Removed duplicate AuditLogCreateParams to resolve type conflict.

export interface UserActivityParams {
  tenantId: string;
  userId?: string;
  action: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQueryParams {
  tenantId: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;

}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export enum AuditAction {
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_INVITED = "USER_INVITTED",
  USER_DEACTIVATED = "USER_DEACTIVATED",
  USER_ACTIVATED = "USER_ACTIVATED",
    ROLE_CREATED = "ROLE_CREATED",
    ROLE_UPDATED = "ROLE_UPDATED",
  PASSWORD_RESET = "PASSWORD_RESET",
  ROLE_ASSIGNED = "ROLE_ASSIGNED",
  ROLE_REVOKED = "ROLE_REVOKED",
  SESSIONS_REVOKED_ALL = "SESSIONS_REVOKED_ALL",
  SESSION_REVOKED = "SESSION_REVOKED",
    USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED",
    TENANT_CREATED = "TENANT_CREATED",
    TENANT_UPDATED = "TENANT_UPDATED",
    TENANT_DELETED = "TENANT_DELETED",
    B2B_CONNECTION_CREATED = "B2B_CONNECTION_CREATED",
    B2B_CONNECTION_UPDATED = "B2B_CONNECTION_UPDATED",
    B2B_CONNECTION_DELETED = "B2B_CONNECTION_DELETED",
    B2B_CONNECTION_APPROVED = "B2B_CONNECTION_APPROVED",
    B2B_CONNECTION_REJECTED = "B2B_CONNECTION_REJECTED",
    B2B_CONNECTION_SYNCED = "B2B_CONNECTION_SYNCED",
    STORE_CREATED = "STORE_CREATED",
    STORE_UPDATED = "STORE_UPDATED",
    STORE_DELETED = "STORE_DELETED",
    PRODUCT_CREATED = "PRODUCT_CREATED",
    PRODUCT_UPDATED = "PRODUCT_UPDATED",
    PRODUCT_DELETED = "PRODUCT_DELETED",
    ORDER_CREATED = "ORDER_CREATED",
    ORDER_UPDATED = "ORDER_UPDATED",
    ORDER_DELETED = "ORDER_DELETED",
    PRODUCT_CATEGORY_CREATED = "PRODUCT_CATEGORY_CREATED",
    PRODUCT_CATEGORY_UPDATED = "PRODUCT_CATEGORY_UPDATED",
    PRODUCT_CATEGORY_DELETED = "PRODUCT_CATEGORY_DELETED",
    PRODUCT_VARIANT_CREATED = "PRODUCT_VARIANT_CREATED",
    PRODUCT_VARIANT_UPDATED = "PRODUCT_VARIANT_UPDATED",
    PRODUCT_VARIANT_DELETED = "PRODUCT_VARIANT_DELETED",
    PRODUCTS_IMPORTED = "PRODUCTS_IMPORTED",

  // Add other audit actions as needed
}

export enum UserActivity {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  CREATE_USER = "CREATE_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  CREATE_ROLE = "CREATE_ROLE",
  UPDATE_ROLE = "UPDATE_ROLE",
  ASSIGN_ROLE = "ASSIGN_ROLE",
  DEACTIVATE_USER = "DEACTIVATE_USER",
    DELETE_ROLE = "DELETE_ROLE",


  // Add more user activities as needed
}

// User Module Actions
export enum UserAuditAction {
  LOGIN = 'USER_LOGIN',
  LOGOUT = 'USER_LOGOUT',
  CREATE = 'USER_CREATE',
  UPDATE = 'USER_UPDATE',
  ROLE_ASSIGN = 'USER_ROLE_ASSIGN'

}

// Pharmacy Module Actions
export enum PharmacyAuditAction {
  PRESCRIPTION_FILLED = 'PHARMACY_PRESCRIPTION_FILLED',
  CONTROLLED_ACCESS = 'PHARMACY_CONTROLLED_ACCESS',
  COMPOUNDING = 'PHARMACY_COMPOUNDING'
}

// Stock Module Actions
export enum StockAuditAction {
  ADJUSTMENT = 'STOCK_ADJUSTMENT',
  TRANSFER = 'STOCK_TRANSFER',
  EXPIRY = 'STOCK_EXPIRY_PROCESSED'
}
// PurchaseOrder Module Actions
export enum PurchaseOrderAuditAction {
    CREATED = 'PURCHASE_ORDER_CREATED',
    UPDATED = 'PURCHASE_ORDER_UPDATED',
    DELETED = 'PURCHASE_ORDER_DELETED',
    RECEIVED = 'PURCHASE_ORDER_RECEIVED',
    CANCELLED = 'PURCHASE_ORDER_CANCELLED'
}

export enum B2BAuditAction {
  CONNECTION_CREATED = 'B2B_CONNECTION_CREATED',
  CONNECTION_UPDATED = 'B2B_CONNECTION_UPDATED',
  CONNECTION_DELETED = 'B2B_CONNECTION_DELETED',
  CONNECTION_APPROVED = 'B2B_CONNECTION_APPROVED', 
  CONNECTION_REJECTED = 'B2B_CONNECTION_REJECTED',
  CONNECTION_REVOKED = 'B2B_CONNECTION_REVOKED',
  CONNECTION_SYNCED = 'B2B_CONNECTION_SYNCED',
  CONNECTION_SYNC_FAILED = 'B2B_CONNECTION_SYNC_FAILED',
  CONNECTION_STATUS_CHANGED = 'B2B_CONNECTION_STATUS_CHANGED',
    CONNECTION_REQUESTED = 'B2B_CONNECTION_REQUESTED',
    CONNECTION_HISTORY_FETCHED = 'B2B_CONNECTION_HISTORY_FETCHED',
}

export enum POSAuditAction {
    OPEN_POS_SESSION = 'POS_OPEN_SESSION',
    CLOSE_POS_SESSION = 'POS_CLOSE_SESSION',
    PROCESS_PAYMENT = 'POS_PROCESS_PAYMENT',
    REFUND_PAYMENT = 'POS_REFUND_PAYMENT',
    VOID_TRANSACTION = 'POS_VOID_TRANSACTION',
    APPLY_DISCOUNT = 'POS_APPLY_DISCOUNT',
    RECONCILE_POS_SESSION = 'POS_RECONCILE_SESSION',
}


// Unified Action Type
export type AuditActionType = 
  | UserAuditAction 
  | PharmacyAuditAction 
  | StockAuditAction
  | PurchaseOrderAuditAction
  | B2BAuditAction
  | POSAuditAction;

  export interface AuditLogCreateParams<T = any> {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: T;
  ipAddress?: string;
  userAgent?: string;
  details?: string; // Additional details about the action
  timestamp?: Date; // Optional timestamp for the audit log
}

// Module-Specific Create Params
export interface CreatePharmacyAuditParams {
  tenantId: string;
  userId: string;
  action: PharmacyAuditAction;
  metadata: PharmacyAuditMetadata;
}

export interface CreateStockAuditParams {
  tenantId: string;
  userId: string;
  action: StockAuditAction;
  metadata: StockAuditMetadata;
}

export interface ControlledSubstanceMetadata {
  medicationId: string;
  pharmacistId: string;
  prescriptionId: string;
  patientId: string;
  quantity: number;
  lotNumber: string;
  witnessId?: string; // For dual-control requirements
  systemCheckPassed: boolean;
  discrepancyNotes?: string;
}

export enum ControlledSubstanceAuditAction {
  DISPENSE = 'CONTROLLED_DISPENSE',
  WASTAGE = 'CONTROLLED_WASTAGE',
  INVENTORY_CHECK = 'CONTROLLED_INVENTORY_CHECK',
  TRANSFER = 'CONTROLLED_TRANSFER'
}