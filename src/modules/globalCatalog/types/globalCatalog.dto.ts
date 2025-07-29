// src/modules/globalCatalog/types/globalCatalog.dto.ts

export interface CSVRow {
  [key: string]: string | number | boolean;
}

export interface CreateGlobalCategoryDto {
  name: string;
  imageUrl?: string;
  parentId?: string;
  description?: string;
}
export interface UpdateGlobalCategoryDto extends Partial<CreateGlobalCategoryDto> {
  id: string;
}

export interface CreateGlobalProductDto {
  globalCategoryId: string;
  sku: string;
  name: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
  brand?: string;
  dosageForm?: string;
  sellingType?: string;
  description?: string;
  isPrescription?: boolean;
  isActive?: boolean;
  isVariable: boolean;
  variants?: CreateGlobalProductVariantDto[];
}
export interface UpdateGlobalProductDto extends Partial<CreateGlobalProductDto> {
  id: string;
}

export interface CreateGlobalProductVariantDto {
  globalProductId: string;
   variantAttributes: {
    id: string;
    name: string;
    options: string[];
  }[];
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
