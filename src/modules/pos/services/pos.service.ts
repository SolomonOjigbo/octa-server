import { PrismaClient } from "@prisma/client";
import {
  OpenPOSSessionDto,
  ClosePOSSessionDto,
  CreatePOSTransactionDto,
  CreatePOSPaymentDto,
  CreateCashDropDto,
  CreateSalesReturnDto,
} from "../types/pos.dto";
import { inventoryService } from "../../inventory/services/inventory.service";
import { stockService } from "../../stock/services/stock.service";

const prisma = new PrismaClient();

export class POSService {
  // Sessions
  async openSession(dto: OpenPOSSessionDto) {
    return prisma.pOSSession.create({
      data: {
        ...dto,
        isOpen: true,
        openedAt: new Date(),
      },
    });
  }
  async closeSession(dto: ClosePOSSessionDto) {
    return prisma.pOSSession.update({
      where: { id: dto.sessionId },
      data: {
        isOpen: false,
        closingBalance: dto.closingBalance,
        closedAt: dto.closedAt ? new Date(dto.closedAt) : new Date(),
      },
    });
  }
  async getSessions(tenantId: string, storeId?: string) {
    return prisma.pOSSession.findMany({
      where: { tenantId, ...(storeId && { storeId }) },
      orderBy: { openedAt: "desc" },
    });
  }
  async getOpenSession(tenantId: string, storeId: string, userId: string) {
    return prisma.pOSSession.findFirst({
      where: { tenantId, storeId, userId, isOpen: true },
    });
  }

//   // Transactions
//   async createTransaction(dto: CreatePOSTransactionDto) {
//     // Transaction
//     const transaction = await prisma.transaction.create({
//       data: {
//         tenantId: dto.tenantId,
//         storeId: dto.storeId,
//         userId: dto.userId,
//         customerId: dto.customerId,
//         totalAmount: dto.totalAmount,
//         discount: dto.discount,
//         paymentMethod: dto.paymentMethod,
//         status: "completed",
//         sessionId: dto.sessionId,
//         items: {
//           create: dto.items.map(item => ({
//             productId: item.productId,
//             quantity: item.quantity,
//             price: item.price,
//             discount: item.discount,
//             batchNumber: item.batchNumber,
//             expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
//           })),
//         },
//       },
//       include: { items: true },
//     });

//     // Inventory/Stock OUT for each item
//     for (const item of dto.items) {
//       await inventoryService.createMovement({
//         tenantId: dto.tenantId,
//         productId: item.productId,
//         storeId: dto.storeId,
//         quantity: -item.quantity,
//         movementType: "SALE",
//         batchNumber: item.batchNumber,
//         expiryDate: item.expiryDate,
//         reference: transaction.id,
//       });
//       await stockService.incrementStockLevel({
//         tenantId: dto.tenantId,
//         productId: item.productId,
//         storeId: dto.storeId,
//         delta: -item.quantity,
//       });
//     }

//     return transaction;
//   }

// Get batches in FIFO order, non-expired, with quantities
  async getAvailableBatchesForSale(tenantId: string, storeId: string, productId: string) {
    const now = new Date();
    return prisma.inventory.findMany({
      where: {
        tenantId,
        storeId,
        productId,
        expiryDate: { gte: now },
        quantity: { gt: 0 },
      },
      orderBy: [{ expiryDate: "asc" }, { updatedAt: "asc" }],
    });
  }

  // Deduct quantity from inventory, batch-wise (FIFO), block expired, warn near expiry (<30d)
  async deductFromBatches(tenantId: string, storeId: string, productId: string, totalQty: number) {
    let remaining = totalQty;
    const batches = await this.getAvailableBatchesForSale(tenantId, storeId, productId);
    const now = new Date();
    const batchMovements: {
      batchNumber: string;
      expiryDate: Date | null;
      quantity: number;
      nearExpiry: boolean;
    }[] = [];

    for (const batch of batches) {
      if (batch.expiryDate && batch.expiryDate < now) continue; // Block expired
      const batchIsNearExpiry =
        batch.expiryDate &&
        (batch.expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24) < 30;
      const deductQty = Math.min(batch.quantity, remaining);
      await prisma.inventory.update({
        where: { id: batch.id },
        data: { quantity: batch.quantity - deductQty, updatedAt: new Date() },
      });
      batchMovements.push({
        batchNumber: batch.batchNumber ?? "",
        expiryDate: batch.expiryDate,
        quantity: deductQty,
        nearExpiry: !!batchIsNearExpiry,
      });
      remaining -= deductQty;
      if (remaining <= 0) break;
    }
    if (remaining > 0)
      throw new Error("Insufficient non-expired stock to fulfill sale.");
    return batchMovements;
  }

  // Main transaction logic with batch, tax, discount, shipping
  async createTransaction(dto: CreatePOSTransactionDto) {
    // Calculate totals, process batch-level deduction, build items with batch/expiry
    let allItems: any[] = [];
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let batchWarnings: string[] = [];

    for (const item of dto.items) {
      const batchesUsed = await this.deductFromBatches(
        dto.tenantId,
        dto.storeId,
        item.productId,
        item.quantity
      );
      for (const batch of batchesUsed) {
        const discount = item.discount ?? 0;
        const taxRate = item.taxRate ?? 0;
        const lineSubtotal = (item.price - discount) * batch.quantity;
        const taxAmount = lineSubtotal * taxRate;

        subtotal += lineSubtotal;
        totalTax += taxAmount;
        totalDiscount += discount * batch.quantity;

        if (batch.nearExpiry) {
          batchWarnings.push(
            `Batch ${batch.batchNumber} for product ${item.productId} expires soon (${batch.expiryDate?.toISOString().slice(0, 10)})`
          );
        }

        allItems.push({
          productId: item.productId,
          quantity: batch.quantity,
          price: item.price,
          discount: discount,
          taxRate: taxRate,
          taxAmount: taxAmount,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
        });
      }
    }

    const shippingFee = dto.shippingType === "delivery" ? dto.shippingFee ?? 0 : 0;
    const totalAmount = subtotal + totalTax + shippingFee - (dto.discount ?? 0);

    // Create transaction and items
    const transaction = await prisma.transaction.create({
      data: {
        tenantId: dto.tenantId,
        storeId: dto.storeId,
        userId: dto.userId,
        customerId: dto.customerId,
        totalAmount,
        taxAmount: totalTax,
        discount: dto.discount ?? totalDiscount,
        shippingFee: shippingFee,
        shippingType: dto.shippingType,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        status: "completed",
        sessionId: dto.sessionId,
        items: { create: allItems },
      },
      include: { items: true },
    });

    return { transaction, batchWarnings };
  }

  // Payments
  async createPayment(dto: CreatePOSPaymentDto) {
    return prisma.payment.create({
      data: {
        tenantId: dto.tenantId,
        transactionId: dto.transactionId,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
      },
    });
  }

  async getPayments(tenantId: string, transactionId?: string) {
    return prisma.payment.findMany({
      where: { tenantId, ...(transactionId && { transactionId }) },
    });
  }

  // Query transactions, etc. (can expand with filtering)
  async getTransactions(tenantId: string, storeId?: string, sessionId?: string) {
    return prisma.transaction.findMany({
      where: { tenantId, ...(storeId && { storeId }), ...(sessionId && { sessionId }) },
      include: { items: true, customer: true, posSession: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // Add to existing POSService class

// 1. Sales Return (Refund/Adjustment)
async createSalesReturn(dto: CreateSalesReturnDto) {
  // 1. Get original transaction, validate quantities
  const original = await prisma.transaction.findUnique({
    where: { id: dto.originalTransactionId },
    include: { items: true },
  });
  if (!original) throw new Error("Original transaction not found");
  for (const item of dto.items) {
    const originalItem = original.items.find(i => i.productId === item.productId);
    if (!originalItem || originalItem.quantity < item.quantity) {
      throw new Error(`Cannot return more than sold for product ${item.productId}`);
    }
  }
  // 2. Create a negative transaction (sales return)
  const returnTxn = await prisma.transaction.create({
    data: {
      tenantId: dto.tenantId,
      storeId: original.storeId,
      userId: dto.userId,
      customerId: original.customerId,
      totalAmount: -dto.items.reduce((sum, i) => {
        const originalItem = original.items.find(oi => oi.productId === i.productId);
        return sum + (originalItem ? originalItem.price * i.quantity : 0);
      }, 0),
      paymentMethod: dto.refundMethod,
      status: "returned",
      sessionId: dto.sessionId,
      items: {
        create: dto.items.map(i => ({
          productId: i.productId,
          quantity: -i.quantity,
          price: original.items.find(oi => oi.productId === i.productId)?.price ?? 0,
          discount: original.items.find(oi => oi.productId === i.productId)?.discount ?? 0,
          batchNumber: original.items.find(oi => oi.productId === i.productId)?.batchNumber,
          expiryDate: original.items.find(oi => oi.productId === i.productId)?.expiryDate,
        })),
      },
    },
    include: { items: true },
  });
  // 3. Update inventory and stock (+ return to inventory)
  for (const item of dto.items) {
    await inventoryService.createMovement({
      tenantId: dto.tenantId,
      productId: item.productId,
      storeId: original.storeId,
      quantity: item.quantity,
      movementType: "SALES_RETURN",
      reference: returnTxn.id,
    });
    await stockService.incrementStockLevel({
      tenantId: dto.tenantId,
      productId: item.productId,
      storeId: original.storeId,
      delta: item.quantity,
    });
  }
  // (Optional: record refund/payment)
  return returnTxn;
}

// 2. Cash Drop
async createCashDrop(dto: CreateCashDropDto) {
  // Optionally add a CashDrop table/model, or log as a payment with a special method
  return prisma.payment.create({
    data: {
      tenantId: dto.tenantId,
      storeId: dto.storeId,
      sessionId: dto.sessionId,
      userId: dto.userId,
      amount: -dto.amount, // Negative to indicate cash removal
      method: "cash_drop",
      reference: dto.reason,
    },
  });
}

// 3. Stock Check/Alert
async checkStockBeforeSale(tenantId: string, storeId: string, items: { productId: string, quantity: number }[]) {
  for (const item of items) {
    const stock = await stockService.getStock(tenantId, item.productId, storeId);
    if (!stock || stock.quantity < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }
    // Optionally, check expiry dates in inventory for earliest batch
    // (Implementation depends on how you model per-batch inventory)
  }
  return true;
}
    async getTransactionById(tenantId: string, transactionId: string) {
        return prisma.transaction.findUnique({
        where: { id: transactionId, tenantId },
        include: { items: true, customer: true, posSession: true },
        });
    }
    
    async deleteTransaction(tenantId: string, transactionId: string) {
        return prisma.transaction.delete({
        where: { id: transactionId, tenantId },
        });
    }
}



export const posService = new POSService();
