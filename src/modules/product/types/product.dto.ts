import { z } from "zod";
import { createProductCategorySchema, createProductSchema, createProductVariantSchema } from "../validations";

// DTO Types
export type CreateProductCategoryDto = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryDto = Partial<CreateProductCategoryDto>;

export type CreateProductVariantDto = z.infer<typeof createProductVariantSchema>;
export type UpdateProductVariantDto = Partial<CreateProductVariantDto>;

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = Partial<CreateProductDto>;

// Response DTOs
export interface ProductResponseDto {
  id: string;
  tenantId: string;
  storeId: string;
  warehouseId?: string;
  name: string;
  brand?: string;
  sku: string;
  barcode?: string;
  description?: string;
  dosageForm?: string;
  strength?: string;
  costPrice: number;
  sellingPrice: number;
  category?: {
    id: string;
    name: string;
  };
  variants?: ProductVariantResponseDto[];
  stocks?: ProductStockDto[];
  suppliers?: ProductSupplierDto[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

}


export interface ProductStockDto {
  id: string;
  quantity: number;
  store?: {
    id: string;
    name: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
}

export interface ProductSupplierDto {
  id: string;
  supplier: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  createdAt: Date;
}

export interface ProductCategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Product Variant DTOs

export interface CreateVariantDto {
  name: string;
  sku?: string;
  costPrice: number;
  sellingPrice: number;
  productId: string;
  stock?: number;
}

export interface UpdateVariantDto extends Partial<CreateVariantDto> {}

export interface ProductVariantCategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface ProductVariantResponseDto {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stocks?: ProductStockDto[];
}

export interface ProductVariantResponseDto {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stocks?: ProductStockDto[];
  category?: ProductVariantCategoryResponseDto;
  createdAt: Date;
  updatedAt: Date;
}

