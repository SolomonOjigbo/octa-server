export interface CreateProductCategoryDto {
  tenantId: string;
  name: string;
  description?: string;
}

export interface CreateProductVariantDto {
  tenantId: string;
  productId: string;
  name: string;           // e.g., "100mg tablet"
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  isActive?: boolean;
}

export interface CreateProductDto {
  tenantId: string;
  categoryId?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  brand?: string;
  costPrice: number;
  sellingPrice: number;
  isActive?: boolean;
  dosageForm?: string;     // e.g., "tablet", "syrup"
  strength?: string;       // e.g., "100mg", "250mg"
  batchNumber?: string;
  expiryDate?: Date | string;
  variants?: CreateProductVariantDto[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface UpdateProductVariantDto extends Partial<CreateProductVariantDto> {}
export interface UpdateProductCategoryDto extends Partial<CreateProductCategoryDto> {}
