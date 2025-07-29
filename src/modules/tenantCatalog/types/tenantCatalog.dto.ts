// Tenant categories
export interface CreateTenantCategoryDto {
  tenantId: string;
  name: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
  
}
export interface UpdateTenantCategoryDto extends Partial<CreateTenantCategoryDto> {}

// Tenant products
export interface CreateTenantProductDto {
  tenantCategoryId?: string;
  sku?: string;
  name?: string;
  globalProductId?: string;
  costPrice?: number;
  sellingPrice?: number;
  dosageForm?: string;
  sellingType?: string;
  category?: CreateTenantCategoryDto;
  isTransferable?: boolean;
  description?: string;
  barcode?: string;
  brand?: string;
  imageUrl?: string;
  isActive?: boolean;           // ← add
  createdAt?: Date; 
  isVariable?: boolean;
  variants?: CreateTenantProductVariantDto[]
}
export interface UpdateTenantProductDto extends Partial<CreateTenantProductDto> {}

// Tenant variants
export interface CreateTenantProductVariantDto {
  tenantProductId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  costPrice: number;
  sellingPrice: number;
  stock?: number;
  variantAttributes: {
    id: string;
    name: string;
    options: string[];
  }[];
}
export interface UpdateTenantProductVariantDto extends Partial<CreateTenantProductVariantDto> {}
