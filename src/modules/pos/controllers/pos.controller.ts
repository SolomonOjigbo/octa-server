import { Request, Response } from "express";
import { posService } from "../services/pos.service";
import {
  openPOSSessionSchema,
  closePOSSessionSchema,
  createPOSTransactionSchema,
  createPOSPaymentSchema,
  createSalesReturnSchema,
  createCashDropSchema,
} from "../validations";
import { ClosePOSSessionDto, CreateCashDropDto, CreatePOSPaymentDto, CreatePOSTransactionDto, CreateSalesReturnDto, OpenPOSSessionDto } from "../types/pos.dto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class POSController {
  async openSession(req: Request, res: Response) {
    try {
      const validated = openPOSSessionSchema.parse(req.body) as OpenPOSSessionDto;
      const session = await posService.openSession(validated);
      res.status(201).json(session);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async closeSession(req: Request, res: Response) {
    try {
      const validated = closePOSSessionSchema.parse(req.body) as ClosePOSSessionDto;
      const session = await posService.closeSession(validated);
      res.json(session);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getSessions(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const storeId = req.query.storeId as string | undefined;
    const sessions = await posService.getSessions(tenantId, storeId);
    res.json(sessions);
  }

  async getOpenSession(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const storeId = req.query.storeId as string;
    const userId = req.query.userId as string;
    const session = await posService.getOpenSession(tenantId, storeId, userId);
    if (!session) return res.status(404).json({ message: "No open session" });
    res.json(session);
  }

  async getTransactions(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const storeId = req.query.storeId as string | undefined;
    const sessionId = req.query.sessionId as string | undefined;
    const transactions = await posService.getTransactions(tenantId, storeId, sessionId);
    res.json(transactions);
  }

  async createPayment(req: Request, res: Response) {
    try {
      const validated = createPOSPaymentSchema.parse(req.body) as CreatePOSPaymentDto;
      const payment = await posService.createPayment(validated);
      res.status(201).json(payment);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getPayments(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const transactionId = req.query.transactionId as string | undefined;
    const payments = await posService.getPayments(tenantId, transactionId);
    res.json(payments);
  }


  async createSalesReturn(req: Request, res: Response) {
  try {
    const validated = createSalesReturnSchema.parse(req.body) as CreateSalesReturnDto;
    const returnTxn = await posService.createSalesReturn(validated);
    res.status(201).json(returnTxn);
  } catch (err) {
    res.status(400).json({ message: err.errors || err.message });
  }
}

async createCashDrop(req: Request, res: Response) {
  try {
    const validated = createCashDropSchema.parse(req.body) as CreateCashDropDto;
    const cashDrop = await posService.createCashDrop(validated);
    res.status(201).json(cashDrop);
  } catch (err) {
    res.status(400).json({ message: err.errors || err.message });
  }
}

// Override createTransaction to enforce stock check
// async createTransaction(req: Request, res: Response) {
//   try {
//     const validated = createPOSTransactionSchema.parse(req.body) as CreatePOSTransactionDto;
//     // Stock check BEFORE creating transaction
//     await posService.checkStockBeforeSale(
//       validated.tenantId,
//       validated.storeId,
//       validated.items.map(i => ({
//         productId: i.productId,
//         quantity: i.quantity,
//       }))
//     );
//     const transaction = await posService.createTransaction(validated);
//     res.status(201).json(transaction);
//   } catch (err) {
//     res.status(400).json({ message: err.errors || err.message });
//   }
// }

async createTransaction(req: Request, res: Response) {
    try {
      const validated = createPOSTransactionSchema.parse(req.body) as CreatePOSTransactionDto;
      const { transaction, batchWarnings } = await posService.createTransaction(validated);
      res.status(201).json({
        transaction,
        batchWarnings, // Show warnings for near-expiry
        message: batchWarnings.length
          ? "Transaction successful, but some batches are near expiry."
          : "Transaction successful.",
      });
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  // Receipt with batch, expiry, tax, discount, shipping breakdown
  async getReceipt(req: Request, res: Response) {
    const { transactionId } = req.params;
    const txn = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true, customer: true, payments: true, posSession: true },
    });
    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    res.json({
      receipt: {
        date: txn.createdAt,
        store: txn.storeId,
        cashier: txn.userId,
        customer: txn.customer,
        items: txn.items.map(i => ({
          productId: i.productId,
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate,
          quantity: i.quantity,
          unitPrice: i.price,
          discount: i.discount,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
          lineTotal: (i.price - (i.discount ?? 0)) * i.quantity + (i.taxAmount ?? 0),
        })),
        subtotal: txn.items.reduce((sum, i) => sum + (i.price - (i.discount ?? 0)) * i.quantity, 0),
        tax: txn.taxAmount,
        discount: txn.discount,
        shipping: txn.shippingFee,
        grandTotal: txn.totalAmount,
        paymentMethod: txn.paymentMethod,
        shippingType: txn.shippingType,
        shippingAddress: txn.shippingAddress,
        sessionId: txn.sessionId,
      },
    });
  }
  
async getSessionPaymentsBreakdown(req: Request, res: Response) {
    const { sessionId } = req.params;
    const result = await posService.getSessionPaymentsBreakdown(sessionId);
    res.json(result);
  }

  async reconcileSessionCash(req: Request, res: Response) {
    const { sessionId } = req.params;
    const { declaredClosingCash } = req.body;
    const result = await posService.reconcileSessionCash(sessionId, declaredClosingCash);
    res.json(result);
  }

}

export const posController = new POSController();
