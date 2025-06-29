

export const b2bConnectionStatuses = [
  "pending",
  "approved",
  "rejected",
  "revoked"
] as const;

export type B2BConnectionStatus = typeof b2bConnectionStatuses[number];

// Types
export interface CreateB2BConnectionDto {
  tenantAId: string;
  tenantBId: string;
  status?: B2BConnectionStatus;
  settings?: Record<string, unknown>;
}

export interface UpdateB2BConnectionDto extends Partial<CreateB2BConnectionDto> {
  id: string;
}

export interface B2BConnectionResponseDto {
  id: string;
  tenantAId: string;
  tenantBId: string;
  status: B2BConnectionStatus;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  tenantA: {
    id: string;
    name: string;
    slug: string;
  };
  tenantB: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface B2BConnectionWithRelationsDto extends B2BConnectionResponseDto {
  purchaseOrders: {
    id: string;
    status: string;
    orderDate: Date;
  }[];
  stockTransfers: {
    id: string;
    status: string;
    transferType: string;
  }[];
}