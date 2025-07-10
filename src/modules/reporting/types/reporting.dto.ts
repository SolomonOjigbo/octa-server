// Sales
export interface SalesBucket {
  period: string;     // e.g. '2025-07-01'
  totalSales: number;
  count:      number;
}

// Inventory
export interface InventoryStatus {
  tenantProductId: string;
  productName:     string;
  quantity:        number;
  reorderPoint?:   number;
}

// Purchase Orders
export interface POStatusCount {
  status: string;
  count:  number;
}

// Transactions
export interface TransactionTypeCount {
  type: string;
  totalAmount: number;
  count:       number;
}

// Payments
export interface PaymentMethodCount {
  method: string;
  totalAmount: number;
  count:       number;
}

// B2B Connections
export interface B2BStatusCount {
  status: string;
  count:  number;
}
