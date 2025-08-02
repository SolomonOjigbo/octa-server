import { WarehouseStatus } from '@prisma/client';
import { z } from 'zod';

// export enum WarehouseStatus {
//   ACTIVE = 'ACTIVE',
//   INACTIVE = 'INACTIVE',
//   UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
 
// }

export const CreateWarehouseDtoSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  address: z.string().optional(),
  status: z.nativeEnum(WarehouseStatus).default(WarehouseStatus.ACTIVE),
  businessEntityId: z.string().cuid(),
});

export const UpdateWarehouseDtoSchema = CreateWarehouseDtoSchema.partial();

export type CreateWarehouseDto = z.infer<typeof CreateWarehouseDtoSchema>;
export type UpdateWarehouseDto = z.infer<typeof UpdateWarehouseDtoSchema>;

export interface WarehouseResponseDto {
  id: string;
  name: string;
  code: string;
  address?: string;
  status: WarehouseStatus;
  businessEntityId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseWithRelationsDto extends WarehouseResponseDto {
  businessEntity: {
    id: string;
    name: string;
  };
  inventories: {
    id: string;
    productName: string;
    quantity: number;
  }[];
}