import { z } from "zod";
import { BusinessEntityDto, UpdateBusinessEntityDto } from "../../businessEntity/types/businessEntity.dto";
import { CreateUserDto, UpdateUserDto } from "../../user/types/user.dto";
import { StoreType } from "@modules/store/types/store.dto";


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
    tenantId: string;
  };
  store: {
    name: string;
    code: string;
    address?: string;
    isMain?: boolean;
    type?: StoreType;
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
  updatedBy?: string | null;
}

export interface TenantWithRelationsDto extends TenantResponseDto {
  businessEntities: UpdateBusinessEntityDto[];
  users: UpdateUserDto[];
}