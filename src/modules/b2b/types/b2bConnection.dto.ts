import { z } from "zod";

export const b2bConnectionStatuses = [
  "pending",
  "approved",
  "rejected",
  "revoked"
] as const;

export const b2bConnectionTypes = [
  "general",
  "wholesale",
  "distributor",
  "clinic",
  "hospital",
  "pharmacy"
] as const;

export type B2BConnectionStatus = typeof b2bConnectionStatuses[number];
export type B2BConnectionType = typeof b2bConnectionTypes[number];


export interface CreateB2BConnectionDto {
  tenantBId: string;
  settings?: Record<string, any>;
}

export interface ConnectionActionDto {
  reason?: string;
}

export interface B2BConnectionResponseDto {
  id: string;
  tenantAId: string;
  tenantBId: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}


// Base DTOs
export interface BaseB2BConnectionDto {
  tenantAId: string;
  tenantBId: string;
  status: B2BConnectionStatus;
  type: B2BConnectionType;
  settings?: Record<string, unknown>;
  metadata?: {
  createdBy?:     string;
  createdAt?:     string;
  updatedBy?:     string;
  updatedAt?:     string;
  approvedBy?:    string;
  approvedAt?:    string;
  rejectedBy?:    string;
  rejectedAt?:    string;
  revokedBy?:     string;
  revokedAt?:     string;
  rejectionReason?: string;
  revocationReason?: string;
  deletedBy?:     string;     // new
  deletedAt?:     string;     // new
};
}

// Request DTOs
export interface CreateB2BConnectionDto extends Omit<BaseB2BConnectionDto, 'status' | 'metadata'> {
  status?: B2BConnectionStatus;
}

export interface UpdateB2BConnectionDto extends Partial<Omit<BaseB2BConnectionDto, 'tenantAId' | 'tenantBId'>> {
  id: string;
}

export interface ApproveB2BConnectionDto {
  approvedBy?: string;
  notes?: string;
}

export interface RejectB2BConnectionDto {
  rejectedBy?: string;
  notes?: string;
}

export interface RevokeB2BConnectionDto {
  revokedBy?: string;
  notes?: string;
}

export interface ListB2BConnectionsDto {
  tenantId: string;
  status?: B2BConnectionStatus;
  type?: B2BConnectionType;
  page?: number;
  limit?: number;
}

// Response DTOs
export interface B2BConnectionResponseDto extends BaseB2BConnectionDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  deletedAt?: Date;
  tenantA: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  tenantB: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
}


// Zod Schemas
export const b2bConnectionResponseSchema = z.object({
  id: z.string().cuid(),
  tenantAId: z.string().cuid(),
  tenantBId: z.string().cuid(),
  status: z.enum(b2bConnectionStatuses),
  type: z.enum(b2bConnectionTypes),
  settings: z.record(z.unknown()).optional(),
  metadata: z.object({
    createdBy: z.string().cuid().optional(),
    createdAt: z.string().datetime().optional(),
    updatedBy: z.string().cuid().optional(),
    updatedAt: z.string().datetime().optional(),
    approvedBy: z.string().cuid().optional(),
    approvedAt: z.string().datetime().optional(),
    rejectedBy: z.string().cuid().optional(),
    rejectedAt: z.string().datetime().optional(),
    revokedBy: z.string().cuid().optional(),
    revokedAt: z.string().datetime().optional(),
    rejectionReason: z.string().optional(),
    revocationReason: z.string().optional()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tenantA: z.object({
    id: z.string().cuid(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().url().optional()
  }),
  tenantB: z.object({
    id: z.string().cuid(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().url().optional()
  })
});



export interface B2BConnectionWithRelationsDto extends B2BConnectionResponseDto {
  purchaseOrders: {
    id: string;
    status: string;
    orderDate: Date;
    totalAmount: number;
  }[];
  inventories: {
    id: string;
    tenantProductId: string;
    quantity: number;
    movementType: string;
    createdAt: Date;
  }[];
  stockTransfers: {
    id: string;
    status: string;
    transferType: string;
    createdAt: Date;
    quantity: number;
  }[];
  globalProducts: {
    id: string;
    sku: string;
    name: string;
  }[];
}


export const b2bConnectionWithRelationsSchema = b2bConnectionResponseSchema.extend({
  purchaseOrders: z.array(z.object({
    id: z.string().cuid(),
    status: z.string(),
    orderDate: z.date(),
    totalAmount: z.number()
  })).optional(),
  stockTransfers: z.array(z.object({
    id: z.string().cuid(),
    status: z.string(),
    transferType: z.string(),
    createdAt: z.date(),
    quantity: z.number()
  })).optional()
});