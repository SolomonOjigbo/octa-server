export interface SessionInfo {
  id: string;
  userId: string;
  tenantId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateSessionDto {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateSessionDto {
  token?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionResponse {
  id: string;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isCurrent?: boolean;
}