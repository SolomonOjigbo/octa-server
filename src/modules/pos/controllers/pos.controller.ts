import { Request, Response } from "express";
import { posService } from "../services/pos.service";
import {
  openPOSSessionSchema,
  closePOSSessionSchema,
  createPOSTransactionSchema,
  createPOSPaymentSchema,
  createSalesReturnSchema,
  createCashDropSchema,
  reconcileCashSchema,
} from "../validations";
import { CreateCashDropDto, CreatePOSPaymentDto, CreatePOSTransactionDto, CreateSalesReturnDto, OpenPOSSessionDto } from "../types/pos.dto";
import prisma from "@shared/infra/database/prisma";
import { AppError } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";


export class POSController {
  async openSession(req: Request, res: Response) {
    try {
       const userId = req.user?.id;
      const validated = openPOSSessionSchema.parse({...req.body, openedBy:userId}) as OpenPOSSessionDto;
      const session = await posService.openSession(validated);
      res.status(201).json(session);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async closeSession(req: Request, res: Response) {
    try {
      const parsed = closePOSSessionSchema.parse(req.body) as any;
      const validated = {
        ...parsed,
        closedAt: parsed.closedAt ? new Date(parsed.closedAt) : undefined,
      };
      const session = await posService.closeSession(validated);
      res.json(session);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getSessions(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const storeId = req.query.storeId as string | undefined;
    const filter = { storeId };
    const sessions = await posService.getSessions(tenantId, filter);
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
    const query = {
      storeId,
      sessionId
    }
    const transactions = await posService.getTransactions(tenantId, query);
    res.json(transactions);
  }

    async createPayment(req: Request, res: Response) {
      const userId = req.user?.id;
      const validated = createPOSPaymentSchema.parse({
        ...req.body,
        processedBy: userId,
      }) as CreatePOSPaymentDto;

      const payment = await posService.createPayment(validated);
      res.status(201).json(payment);
    }


  async getPayments(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const transactionId = req.query.transactionId as string | undefined;
    const filter = transactionId ? { transactionId } : {};
    const payments = await posService.getPayments(tenantId, filter);
    res.json(payments);
  }


  async createSalesReturn(req: Request, res: Response) {
  try {
     const userId = req.user?.id;
    const validated = createSalesReturnSchema.parse({
      ...req.body,
      processedBy: userId,
    }) as CreateSalesReturnDto;
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
    try {
      const { sessionId } = req.params;
      const { declaredClosingCash } = reconcileCashSchema.parse(req.body);
      const result = await posService.reconcileSessionCash(sessionId, declaredClosingCash);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(HttpStatusCode.CONFLICT).json({ message: error.message, code: error.code });
      }
      res.status(400).json({ message: "Failed to reconcile cash", details: error.errors || error.message });
    }
  }


  async getSessionSummary(req: Request, res: Response) {
    const { sessionId } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) return res.status(403).json({ error: 'Unauthorized tenant context' });

    const summary = await posService.getSessionSummary(sessionId, tenantId);
    res.json({ success: true, data: summary });
  }


}

export const posController = new POSController();
