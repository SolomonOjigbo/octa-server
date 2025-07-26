// src/modules/globalCatalog/types/globalCatalog.dto.ts

export interface CreateGlobalCategoryDto {
  name: string;
  imageUrl?: string;
  parentId?: string;
  description?: string;
  parent?: string;
}
export interface UpdateGlobalCategoryDto extends Partial<CreateGlobalCategoryDto> {
  id: string;
}

export interface CreateGlobalProductDto {
  globalCategoryId: string;
  sku: string;
  name: string;
  barcode?: string;
  imageUrl?: string;
  brand?: string;
  dosageForm?: string;
  sellingType?: string;
  description?: string;
  isPrescription?: boolean;
  isActive?: boolean;
}
export interface UpdateGlobalProductDto extends Partial<CreateGlobalProductDto> {
  id: string;
}

export interface CreateGlobalProductVariantDto {
  globalProductId: string;
  variantAttributeIds: string[];
  name: string;
  sku: string;
  imageUrl?: string;
  costPrice: number;
  sellingPrice: number;
  stock?: number;
}
export interface UpdateGlobalProductVariantDto
  extends Partial<Omit<CreateGlobalProductVariantDto, "globalProductId">> {
  id: string;
}
