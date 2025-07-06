import { z } from "zod";
import { BusinessEntityDto } from "../../businessEntity/types/businessEntity.dto";
import { CreateUserDto } from "../../user/types/user.dto";


// Types

export interface TenantOnboardingDto {
  tenant: {
    name: string;
    slug: string;
    legalName?: string;
    contactEmail?: string;
  };
  businessEntity: {
    name: string;
    taxId?: string;
    legalAddress?: string;
  };
  store: {
    name: string;
    code: string;
    address?: string;
    isMain?: boolean;
  };
  adminUser: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  };
}

export interface UpdateTenantDto {
  id: string;
  name?: string;
  slug?: string;
  legalName?: string;
  contactEmail?: string;
  branding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}
export interface TenantResponseDto {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null; // User ID of the last updater
}

export interface TenantWithRelationsDto extends TenantResponseDto {
  businessEntities: BusinessEntityDto[];
  users: CreateUserDto[];
}