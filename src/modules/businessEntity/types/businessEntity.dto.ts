import { CreateStoreDto, StoreType } from "@modules/store/types/store.dto";

// Business Entity DTOs
export interface CreateBusinessEntityDto {
  tenantId: string;
  name: string;
  taxId?: string;
  legalAddress?: string;
}
export interface UpdateBusinessEntityDto extends Partial<CreateBusinessEntityDto> {}

export interface BusinessEntityDto {
  id: string;
  tenantId: string;
  name: string;
  taxId?: string;
  legalAddress: string;
  stores?: CreateStoreDto[];
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    createdBy?: string;
    updatedBy?: string;
    ip?: string;
    userAgent?: string;
  };
  
}