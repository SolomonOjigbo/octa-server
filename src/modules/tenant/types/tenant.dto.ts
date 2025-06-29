import { z } from "zod";
import { BusinessEntityDto } from "../../businessEntity/types/businessEntity.dto";
import { CreateUserDto } from "../../user/types/user.dto";


// Types
export interface CreateTenantDto {
  name: string;
  slug: string;
  legalName?: string;
  contactEmail?: string;
  branding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  adminUser?: {
    email: string;
    name: string;
    password: string;
  };
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {
  id: string;

}

export interface TenantResponseDto {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantWithRelationsDto extends TenantResponseDto {
  businessEntities: BusinessEntityDto[];
  users: CreateUserDto[];
}