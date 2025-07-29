// src/modules/notification/templates/templateConfig.ts
export const templateConfig = {
  purchaseOrderCreated: {
    requiredVariables: ['poNumber', 'supplierName', 'items']
  },
  stockTransferNotification: {
    requiredVariables: ['fromStore', 'toStore', 'transferId', 'items']
  },
  paymentReceived: {
    requiredVariables: ['amount', 'reference', 'customerName', 'paymentType']
  },
  invoiceIssued: {
    requiredVariables: ['invoiceNo', 'customerName', 'dueDate', 'items', 'total']
  },
  tenantPOSTemplate: {
    requiredVariables: ['session', 'transactions']
  },
  invoiceOverdue: {
    requiredVariables: ['invoiceId', 'customerName']
  }
};