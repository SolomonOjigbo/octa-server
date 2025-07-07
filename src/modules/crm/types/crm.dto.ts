// src/modules/crm/types/crm.dto.ts

export interface CreateCustomerDto {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  isActive?: boolean;
  loyaltyNumber?: string;
  segment?: string;
  tags?: string[];
  defaultPaymentTerm?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface CreateCommunicationLogDto {
  tenantId: string;
  method: string;
  content: string;
  direction: 'inbound' | 'outbound';
  // userId: string;
  customerId?: string;
  supplierId?: string;
}

export interface UpdateCommunicationLogDto extends Partial<CreateCommunicationLogDto> {}

export interface CustomerSummary {
  customer: any;
  totalPurchases: number;
  totalPaid: number;
  balance: number;
  lastPurchase: any;
  commsCount: number;
}

export interface TopCustomersParams {
  tenantId: string;
  limit?: number;
}

export interface OutstandingParams {
  tenantId: string;
}

export interface PurchaseFrequency {
  frequencyDays: number | null;
}


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
