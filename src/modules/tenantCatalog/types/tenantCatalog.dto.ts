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
  tenantId: string;
  globalProductId?: string;
  tenantCategoryId?: string;
  sku?: string;
  name?: string;
  isTransferable?: boolean;
  description?: string;
  brand?: string;
  imageUrl?: string;
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
}
export interface UpdateTenantProductVariantDto extends Partial<CreateTenantProductVariantDto> {}
