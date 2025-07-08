import { z } from "zod";
// src/modules/product/types/product.dto.ts

export interface ProductVariantDto {
  id?: string;               // optional on create
  attributes: Record<string, any>;
  priceDelta?: number;       // relative to base price
  barcode?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface ProductCategoryDto {
  id?: string;
  name: string;
  description?: string;
}

export interface CreateProductDto {
  tenantId: string;
  categoryId?: string;       // reference to existing
  category?: ProductCategoryDto;  // inline create option
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  brand?: string;
  costPrice: number;
  sellingPrice: number;
  threshold?: number;
  isActive?: boolean;
  variants?: ProductVariantDto[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}
export interface CreateCategoryDto extends ProductCategoryDto {
  tenantId: string;
}
export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CategoryQueryFilters {
  tenantId?: string;
  name?: string;
  description?: string;
  search?: any;
  parentId?: string;
  page?: number;
  limit?: number;
  withProducts?: boolean;
}

export interface ProductQueryFilters {
      search?: string;
      categoryId?: string;
      sku?: string;
      barcode?: string;
      brand?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
      minPrice?: number;
      maxPrice?: number;
      locationType?: 'store' | 'warehouse';
      locationId?: string;
    }


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
  tenantId: string;
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

