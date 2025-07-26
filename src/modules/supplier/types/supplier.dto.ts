// src/modules/supplier/types/supplier.dto.ts

export interface CreateSupplierDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTime?: number;
  performanceMetrics?: Record<string, any>;
  paymentTerms?: string;
  notes?: string;
  createdAt: Date;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

// Product Supplier
export interface CreateProductSupplierDto {
  supplierId: string;
  globalProductId?: string;
  tenantProductId?: string;
  price?: number;
  isGlobal: boolean;
  leadTime?: number;
}

export interface UpdateProductSupplierDto extends Partial<CreateProductSupplierDto> {}