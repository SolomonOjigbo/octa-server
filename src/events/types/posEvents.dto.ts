export type PosEventPayload = {
  tenantId: string;
  storeId: string;
  userId: string;
    sessionId?: string;
    transactionId?: string;
    amount: number;
    method: string;
    reference?: string;
    items?: {
      productId: string;
      quantity: number;
      reason?: string;
    }[];
    shippingType?: "pickup" | "delivery";
    shippingFee?: number;
    shippingAddress?: string;
    customerId?: string;
    pharmacistId?: string;
    paymentStatus?: "pending" | "completed" | "failed";
    status?: "pending" | "completed" | "cancelled";
    discount?: number;
    taxAmount?: number;
    originalTransactionId?: string;
    reason?: string;
};

export type PosEventType =
  | "CREATE_TRANSACTION"
  | "UPDATE_TRANSACTION"
  | "DELETE_TRANSACTION"
  | "CREATE_PAYMENT"
  | "UPDATE_PAYMENT"
  | "DELETE_PAYMENT"
  | "CREATE_SALES_RETURN"
  | "CANCEL_SALES_RETURN"
  | "CREATE_CASH_DROP"
  | "UPDATE_CASH_DROP";

export interface PosEventDto {
  type: PosEventType;
  payload: PosEventPayload;
    createdAt: Date;
    tenantId: string;
    userId: string;
    sessionId?: string;
    transactionId?: string;
}

export enum POSEvent {
    CREATE_TRANSACTION = "CREATE_TRANSACTION",
    UPDATE_TRANSACTION = "UPDATE_TRANSACTION",
    DELETE_TRANSACTION = "DELETE_TRANSACTION",
    CREATE_PAYMENT = "CREATE_PAYMENT",
    UPDATE_PAYMENT = "UPDATE_PAYMENT",
    DELETE_PAYMENT = "DELETE_PAYMENT",
    CREATE_SALES_RETURN = "CREATE_SALES_RETURN",
    CANCEL_SALES_RETURN = "CANCEL_SALES_RETURN",
    CREATE_CASH_DROP = "CREATE_CASH_DROP",
    UPDATE_CASH_DROP = "UPDATE_CASH_DROP",
    CREATE_POS_SESSION = "CREATE_POS_SESSION",
    OPEN_POS_SESSION = "UPDATE_POS_SESSION",
    CLOSE_POS_SESSION = "CLOSE_POS_SESSION",
    CASH_RECONCILIATION_DISCREPANCY = "CASH_RECONCILIATION_DISCREPANCY",
}