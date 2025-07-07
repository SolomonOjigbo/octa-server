// src/modules/supplier/types/supplier.dto.ts

export interface CreateSupplierDto {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTime?: number;
  performanceMetrics?: Record<string, any>;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

export interface CreateProductSupplierDto {
  tenantId: string;
  supplierId: string;
  productId: string;
  price: number;
  currency: string;
  leadTime?: number;
}

export interface UpdateProductSupplierDto extends Partial<CreateProductSupplierDto> {}
