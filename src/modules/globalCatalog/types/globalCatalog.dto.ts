// Categories
export interface CreateGlobalCategoryDto {
  name: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
}
export interface UpdateGlobalCategoryDto extends Partial<CreateGlobalCategoryDto> {}

// Products
export interface CreateGlobalProductDto {
  globalCategoryId: string;
  sku: string;
  name: string;
  imageUrl?: string;
  barcode?: string;
  dosageForm?: string;
  strength?: string;
  isPrescription?: boolean;
  description?: string;
  brand?: string;
}
export interface UpdateGlobalProductDto extends Partial<CreateGlobalProductDto> {}

// Variants
export interface CreateGlobalProductVariantDto {
  globalProductId: string;
  name: string;
  imageUrl?: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  stock?: number;
}
export interface UpdateGlobalProductVariantDto extends Partial<CreateGlobalProductVariantDto> {}
