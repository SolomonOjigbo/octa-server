// supplier.dto.ts
export interface CreateSupplierDto {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  leadTime?: number;
  notes?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}


