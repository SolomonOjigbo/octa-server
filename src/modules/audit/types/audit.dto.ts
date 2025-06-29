export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  createdAt: Date;
  updatedAt: Date;
    metadata?: {
        createdBy?: string;
        updatedBy?: string;
        ip?: string;
        userAgent?: string;
        targetTenantId?: string;
        changes?: any;
        status?: string;
    };
}

export interface AuditLogCreateParams {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
    metadata?: {
        createdBy?: string;
        updatedBy?: string;
        ip?: string;
        userAgent?: string;
        targetTenantId?: string;
        changes?: any;
        status?: string;
    };
}

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



  // Add more user activities as needed
}