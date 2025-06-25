// Customer DTOs
export interface CreateCustomerDto {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  loyaltyNumber?: string;
  segment?: string;
  tags?: string[];
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

// Supplier DTOs (could reuse previous definitions, but can extend for CRM-specific fields)
export interface CreateSupplierDto {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTime?: number;
  performanceMetrics?: any;
  paymentTerms?: string;
  notes?: string;
}
export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

// Communication Log
export interface CreateCommunicationLogDto {
  tenantId: string;
  method: string;
  content: string;
  direction: "inbound" | "outbound";
  userId?: string;
  customerId?: string;
  supplierId?: string;
}
export interface UpdateCommunicationLogDto extends Partial<CreateCommunicationLogDto> {}
