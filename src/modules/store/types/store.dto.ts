import { z } from "zod";

export const storeTypes = ["wholesale", "retail", "clinic", "warehouse"] as const;
export const storeStatuses = ["active", "inactive", "under_maintenance", "closed"] as const;

export type StoreType = typeof storeTypes[number];
export type StoreStatus = typeof storeStatuses[number];

export const openingHourSchema = z.object({
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  isClosed: z.boolean().optional()
});

export type OpeningHour = z.infer<typeof openingHourSchema>;

export interface CreateStoreDto {
  tenantId: string;
  businessEntityId?: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  type?: StoreType;
  status?: StoreStatus;
  isMain?: boolean;
  managerId?: string;
  openingHours?: OpeningHour[];
  branding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface UpdateStoreDto extends Partial<Omit<CreateStoreDto, 'tenantId'>> {
  id: string;
}

export interface StoreResponseDto {
  id: string;
  tenantId: string;
  businessEntityId?: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  type: StoreType;
  status: StoreStatus;
  isMain: boolean;
  managerId?: string;
  openingHours?: OpeningHour[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreWithRelationsDto extends StoreResponseDto {
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  businessEntity?: {
    id: string;
    name: string;
  };
  inventoryCount?: number;
}