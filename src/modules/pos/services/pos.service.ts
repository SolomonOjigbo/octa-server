import { PrismaClient } from "@prisma/client";
import {
  OpenPOSSessionDto,
  ClosePOSSessionDto,
  CreatePOSTransactionDto,
  CreatePOSPaymentDto,
  CreateCashDropDto,
  CreateSalesReturnDto,
  ListSessionsFilter,
  ListTransactionsFilter,
  ListPaymentsFilter,
  ReceiptResponseDto,
  SessionPaymentsBreakdownDto,
  CashReconciliationResultDto,
  POSSessionResponseDto,
} from "../types/pos.dto";
import { inventoryService } from "../../inventory/services/inventory.service";
import { stockService } from "../../stock/services/stock.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventEmitter } from "@events/event.emitter";
import { POSEvent } from "@events/types/posEvents.dto";
import { AppError, ErrorCode } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { logger } from "@logging/logger";
import { cacheService } from "@cache/cache.service";
import { StockMovementType } from "@common/types/stockMovement.dto";
import { POSAuditAction } from "@modules/audit/types/audit.dto";

const prisma = new PrismaClient();

export class POSService {
  private readonly CACHE_TTL = 60 * 5; // 5 minutes

  /**
   * Open a new POS session
   */
  async openSession(dto: OpenPOSSessionDto): Promise<POSSessionResponseDto> {
    return prisma.$transaction(async (tx) => {
      const existingSession = await tx.pOSSession.findFirst({
        where: { userId: dto.userId, storeId: dto.storeId, isOpen: true },
      });

      if (existingSession) {
        throw new AppError(
          "User already has an open session at this store.",
          HttpStatusCode.CONFLICT,
          ErrorCode.SESSION_ALREADY_OPEN
        );
      }

      const session = await tx.pOSSession.create({
        data: {
          tenantId: dto.tenantId,
          storeId: dto.storeId,
          userId: dto.userId,
          openingBalance: dto.openingBalance,
          isOpen: true,
          openedAt: new Date(),
        },
      });

      await auditService.log({
        tenantId: dto.tenantId,
        userId: dto.userId,
        action: POSAuditAction.OPEN_POS_SESSION,
        entityType: "POSSession",
        entityId: session.id,
        details: JSON.stringify({ openingBalance: dto.openingBalance, storeId: dto.storeId }),
      });
      
      eventEmitter.emit(POSEvent.OPEN_POS_SESSION, { sessionId: session.id, userId: dto.userId });

      await cacheService.del(`pos-sessions:${dto.storeId}`);
      return session;
    });
  }

  /**
   * Close a POS session
   */
  async closeSession(dto: ClosePOSSessionDto): Promise<POSSessionResponseDto> {
    return prisma.$transaction(async (tx) => {
      const session = await tx.pOSSession.findUnique({
        where: { id: dto.sessionId },
      });

      if (!session) {
        throw new AppError("Session not found.", HttpStatusCode.NOT_FOUND, ErrorCode.SESSION_NOT_FOUND);
      }
      if (!session.isOpen) {
        throw new AppError("Session is already closed.", HttpStatusCode.BAD_REQUEST, ErrorCode.SESSION_ALREADY_CLOSED);
      }

      const { cashTotal } = await this.calculateExpectedCash(session.id, session.openingBalance, tx);
      const cashDifference = dto.closingBalance - cashTotal;

      const updatedSession = await tx.pOSSession.update({
        where: { id: dto.sessionId },
        data: {
          isOpen: false,
          closingBalance: dto.closingBalance,
          closedAt: dto.closedAt ? new Date(dto.closedAt) : new Date(),
        },
      });

      await auditService.log({
        tenantId: session.tenantId,
        userId: session.userId,
        action: POSAuditAction.CLOSE_POS_SESSION,
        entityType: "POSSession",
        entityId: session.id,
        details: JSON.stringify({ closingBalance: dto.closingBalance, expected: cashTotal, difference: cashDifference }),
      });

      if (Math.abs(cashDifference) > 0.01) {
        eventEmitter.emit(POSEvent.CASH_RECONCILIATION_DISCREPANCY, {
          sessionId: session.id,
          difference: cashDifference,
        });
      }
      
      eventEmitter.emit(POSEvent.CLOSE_POS_SESSION, { sessionId: session.id });

      await cacheService.del(`pos-sessions:${session.storeId}`);
      await cacheService.del(`pos-open-session:${session.tenantId}:${session.storeId}:${session.userId}`);
      await cacheService.del(`pos-session-details:${dto.sessionId}`);

      return { ...updatedSession, cashDifference };
    });
  }

  /**
   * List POS sessions with pagination and filtering
   */
  async getSessions(
    tenantId: string,
    filters: ListSessionsFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const cacheKey = `pos-sessions:${tenantId}:${JSON.stringify(filters)}:${page}:${limit}`;
      const cached = await cacheService.get<{
        data: any[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(cacheKey);
      if (cached) return cached;

      const where: any = { tenantId };
      
      if (filters.storeId) where.storeId = filters.storeId;
      if (filters.userId) where.userId = filters.userId;
      if (filters.status === "open") where.isOpen = true;
      if (filters.status === "closed") where.isOpen = false;

      const [total, data] = await Promise.all([
        prisma.pOSSession.count({ where }),
        prisma.pOSSession.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { openedAt: "desc" },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      ]);

      const result = {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to fetch POS sessions", { error, tenantId });
      throw error;
    }
  }

  /**
   * Get current open session for a user at a store
   */
  async getOpenSession(
    tenantId: string,
    storeId: string,
    userId: string
  ): Promise<any | null> {
    try {
      const cacheKey = `pos-open-session:${tenantId}:${storeId}:${userId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;

      const session = await prisma.pOSSession.findFirst({
        where: {
          tenantId,
          storeId,
          userId,
          isOpen: true
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { openedAt: "desc" }
      });

      if (session) {
        await cacheService.set(cacheKey, session, this.CACHE_TTL);
      }

      return session;
    } catch (error) {
      logger.error("Failed to fetch open POS session", { error, tenantId, storeId, userId });
      throw error;
    }
  }

  /**
   * Create a new POS transaction with inventory updates
   */
  async createTransaction(
    dto: CreatePOSTransactionDto
  ): Promise<{ transaction: any; batchWarnings: string[] }> {
    return prisma.$transaction(async (tx) => {
      // 1. Validate session is open
      const session = await tx.pOSSession.findUnique({
        where: { id: dto.sessionId }
      });

      if (!session || !session.isOpen) {
        throw new AppError(
          "Invalid or closed POS session",
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.SESSION_ALREADY_CLOSED
        );
      }

      // 2. Process each item with batch-level inventory deduction
      const allItems: any[] = [];
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;
      const batchWarnings: string[] = [];

      for (const item of dto.items) {
        // Get product details to check if controlled
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            isPrescription: true,
            controlledSubstance: true,
            sellingPrice: true
          }
        });

        if (!product) {
          throw new AppError(
            `Product ${item.productId} not found`,
            HttpStatusCode.NOT_FOUND,
            ErrorCode.PRODUCT_NOT_FOUND
          );
        }

        // For controlled substances, validate pharmacist
        if (product.controlledSubstance && !dto.pharmacistId) {
          throw new AppError(
            `Pharmacist ID required for controlled substance ${item.productId}`,
            HttpStatusCode.BAD_REQUEST,
            ErrorCode.PHARMACIST_REQUIRED
          );
        }

        // Use selling price if not provided in item
        const price = item.price ?? product.sellingPrice;
        if (!price) {
          throw new AppError(
            `Price not set for product ${item.productId}`,
            HttpStatusCode.BAD_REQUEST,
            ErrorCode.PRODUCT_PRICE_NOT_SET
          );
        }

        // Deduct from inventory batches (FIFO)
        const batchesUsed = await this.deductFromBatches(
          dto.tenantId,
          dto.storeId,
          item.productId,
          item.quantity,
          tx
        );

        for (const batch of batchesUsed) {
          const discount = item.discount ?? 0;
          const taxRate = item.taxRate ?? 0;
          const lineSubtotal = (price - discount) * batch.quantity;
          const taxAmount = lineSubtotal * taxRate;

          subtotal += lineSubtotal;
          totalTax += taxAmount;
          totalDiscount += discount * batch.quantity;

          // Add warning for near-expiry batches
          if (batch.nearExpiry) {
            batchWarnings.push(
              `Batch ${batch.batchNumber} for product ${item.productId} expires soon (${batch.expiryDate?.toISOString().slice(0, 10)})`
            );
          }

          allItems.push({
            productId: item.productId,
            quantity: batch.quantity,
            price,
            discount,
            taxRate,
            taxAmount,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            isPrescription: product.isPrescription,
            isControlled: product.controlledSubstance
          });
        }
      }

      // 3. Calculate totals
      const shippingFee = dto.shippingType === "delivery" ? dto.shippingFee ?? 0 : 0;
      const totalAmount = subtotal + totalTax + shippingFee - (dto.discount ?? 0);

      // 4. Create transaction
      const transaction = await tx.transaction.create({
        data: {
          tenantId: dto.tenantId,
          storeId: dto.storeId,
          userId: dto.userId,
          customerId: dto.customerId,
          totalAmount,
          taxAmount: totalTax,
          discount: dto.discount ?? totalDiscount,
          shippingFee,
          shippingType: dto.shippingType,
          shippingAddress: dto.shippingAddress,
          paymentMethod: dto.paymentMethod,
          status: "completed",
          sessionId: dto.sessionId,
          items: { create: allItems },
          pharmacistId: dto.pharmacistId
        },
        include: { items: true }
      });

      // 5. Clear relevant caches
      await cacheService.del(`pos-transactions:${dto.sessionId}`);
      await cacheService.del(`pos-session:${dto.sessionId}`);

      return { transaction, batchWarnings };
    });
  }

  /**
   * List transactions with pagination and filtering
   */
  async getTransactions(
    tenantId: string,
    filters: ListTransactionsFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      // const cacheKey = `pos-transactions:${tenantId}:${JSON.stringify(filters)}:${page}:${limit}`;
      // const cached = await cacheService.get(cacheKey);
      // if (cached) return cached;

      const where: any = { tenantId };
      
      if (filters.storeId) where.storeId = filters.storeId;
      if (filters.sessionId) where.sessionId = filters.sessionId;
      if (filters.status) where.status = filters.status;
      if (filters.fromDate) where.createdAt = { gte: filters.fromDate };
      if (filters.toDate) where.createdAt = { lte: filters.toDate };

      const [total, data] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            customer: {
              select: {
                id: true,
                name: true,
                loyaltyNumber: true
              }
            },
            posSession: {
              select: {
                id: true,
                userId: true,
                openedAt: true
              }
            },
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      ]);

      const result = {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      // await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to fetch POS transactions", { error, tenantId });
      throw error;
    }
  }

  /**
   * Create a payment record
   */
  async createPayment(dto: CreatePOSPaymentDto): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // Verify transaction exists
      const transaction = await tx.transaction.findUnique({
        where: { id: dto.transactionId }
      });

      if (!transaction) {
        throw new AppError(
          "Transaction not found",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.TRANSACTION_NOT_FOUND
        );
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          tenantId: dto.tenantId,
          transactionId: dto.transactionId,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference,
          status: "completed",
          paidAt: new Date(),
          userId: dto.processedBy,
          sessionId: transaction.sessionId
        }
      });

      // Update transaction payment status if fully paid
      const totalPaid = await tx.payment.aggregate({
        where: { transactionId: dto.transactionId },
        _sum: { amount: true }
      });

      if (totalPaid._sum.amount && totalPaid._sum.amount >= transaction.totalAmount) {
        await tx.transaction.update({
          where: { id: dto.transactionId },
          data: { paymentStatus: "paid" }
        });
      }

      // Clear relevant caches
      await cacheService.del(`pos-payments:${dto.transactionId}`);
      await cacheService.del(`pos-session:${transaction.sessionId}`);

      return payment;
    });
  }

  /**
   * List payments with pagination and filtering
   */
  async getPayments(
    tenantId: string,
    filters: ListPaymentsFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      // const cacheKey = `pos-payments:${tenantId}:${JSON.stringify(filters)}:${page}:${limit}`;
      // const cached = await cacheService.get(cacheKey);
      // if(cached) return cached;

      const where: any = { tenantId, status: "completed" };
      
      if (filters.transactionId) where.transactionId = filters.transactionId;
      if (filters.method) where.method = filters.method;
      if (filters.fromDate) where.paidAt = { gte: filters.fromDate };
      if (filters.toDate) where.paidAt = { lte: filters.toDate };

      const [total, data] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { paidAt: "desc" },
          include: {
            transaction: {
              select: {
                id: true,
                totalAmount: true,
                customerId: true
              }
            },
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      ]);

      const result = {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      // await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to fetch POS payments", { error, tenantId });
      throw error;
    }
  }

  /**
   * Process a sales return with inventory reconciliation
   */
  async createSalesReturn(dto: CreateSalesReturnDto): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // 1. Get original transaction
      const original = await tx.transaction.findUnique({
        where: { id: dto.originalTransactionId },
        include: { items: true }
      });

      if (!original) {
        throw new AppError(
          "Original transaction not found",
          HttpStatusCode.NOT_FOUND,
          ErrorCode.ORIGINAL_TRANSACTION_NOT_FOUND
        );
      }

      // 2. Validate return quantities
      const returnItems = [];
      let totalReturnAmount = 0;

      for (const item of dto.items) {
        const originalItem = original.items.find(i => i.productId === item.productId);
        if (!originalItem) {
          throw new AppError(
            `Product ${item.productId} not found in original transaction`,
            HttpStatusCode.BAD_REQUEST,
            ErrorCode.PRODUCT_NOT_IN_ORIGINAL_TRANSACTION
          );
        }

        if (originalItem.quantity < item.quantity) {
          throw new AppError(
            `Cannot return more than sold for product ${item.productId}`,
            HttpStatusCode.BAD_REQUEST,
            ErrorCode.INVALID_RETURN_QUANTITY
          );
        }

        const lineTotal = (originalItem.price - (originalItem.discount ?? 0)) * item.quantity;
        totalReturnAmount += lineTotal;

        returnItems.push({
          productId: item.productId,
          quantity: -item.quantity, // Negative quantity for return
          price: originalItem.price,
          discount: originalItem.discount,
          taxRate: originalItem.taxRate,
          taxAmount: originalItem.taxAmount ? (originalItem.taxAmount / originalItem.quantity) * item.quantity : 0,
          batchNumber: originalItem.batchNumber,
          expiryDate: originalItem.expiryDate,
          isPrescription: originalItem.isPrescription,
          isControlled: originalItem.isControlled,
          reason: item.reason
        });
      }

      // 3. Create return transaction
      const returnTxn = await tx.transaction.create({
        data: {
          tenantId: dto.tenantId,
          storeId: original.storeId,
          userId: dto.userId,
          customerId: original.customerId,
          totalAmount: -totalReturnAmount, // Negative amount for return
          taxAmount: returnItems.reduce((sum, i) => sum + (i.taxAmount ?? 0), 0),
          discount: returnItems.reduce((sum, i) => sum + (i.discount ?? 0) * i.quantity, 0),
          paymentMethod: dto.refundMethod,
          status: "returned",
          sessionId: dto.sessionId,
          originalTransactionId: dto.originalTransactionId,
          items: { create: returnItems }
        },
        include: { items: true }
      });

      // 4. Update inventory for returned items
      for (const item of dto.items) {
        const originalItem = original.items.find(i => i.productId === item.productId)!;

        await inventoryService.recordMovement({
          id: originalItem.id, // Use the original transaction item id or another unique identifier as required
          tenantId: dto.tenantId,
          productId: item.productId,
          storeId: original.storeId,
          quantity: item.quantity,
          movementType: StockMovementType.RETURN,
          reference: returnTxn.id,
          batchNumber: originalItem.batchNumber,
          expiryDate: originalItem.expiryDate,
          userId: dto.userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await stockService.incrementStockLevel({
          tenantId: dto.tenantId,
          productId: item.productId,
          storeId: original.storeId,
          delta: item.quantity
        }, dto.userId);
      }

      // 5. Clear relevant caches
      await cacheService.del(`pos-transactions:${dto.sessionId}`);
      await cacheService.del(`pos-session:${dto.sessionId}`);

      return returnTxn;
    });
  }

  /**
   * Record a cash drop
   */
  async createCashDrop(dto: CreateCashDropDto): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // Verify session exists
      const session = await tx.pOSSession.findUnique({
        where: { id: dto.sessionId }
      });

      if (!session || !session.isOpen) {
        throw new AppError(
          "Invalid or closed POS session",
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.SESSION_ALREADY_CLOSED
        );
      }

      // Create cash drop record
      const cashDrop = await tx.payment.create({
        data: {
          tenantId: dto.tenantId,
          storeId: dto.storeId,
          sessionId: dto.sessionId,
          userId: dto.userId,
          amount: -dto.amount, // Negative amount for cash removal
          method: "cash_drop",
          reference: dto.reason,
          status: "completed",
          paidAt: new Date()
        }
      });

      // Clear relevant caches
      await cacheService.del(`pos-payments:${dto.sessionId}`);
      await cacheService.del(`pos-session:${dto.sessionId}`);

      return cashDrop;
    });
  }

  /**
   * Get receipt details for a transaction
   */
  async getReceipt(
    transactionId: string,
    tenantId: string
  ): Promise<ReceiptResponseDto | null> {
    try {
      const cacheKey = `pos-receipt:${transactionId}`;
      const cached = await cacheService.get<ReceiptResponseDto>(cacheKey);
      if (cached) return cached;

      const txn = await prisma.transaction.findUnique({
        where: { id: transactionId, tenantId },
        include: { 
          items: true, 
          customer: true, 
          payments: true, 
          posSession: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          } 
        }
      });

      if (!txn) return null;

      const receipt: ReceiptResponseDto = {
        id: txn.id,
        date: txn.createdAt,
        storeId: txn.storeId,
        cashier: {
          id: txn.posSession.user.id,
          name: txn.posSession.user.name
        },
        customer: txn.customer ? {
          id: txn.customer.id,
          name: txn.customer.name,
          loyaltyNumber: txn.customer.loyaltyNumber
        } : undefined,
        items: txn.items.map(i => ({
          productId: i.productId,
          name: i.product?.name || "Unknown Product",
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate,
          quantity: i.quantity,
          unitPrice: i.price,
          discount: i.discount ?? 0,
          taxRate: i.taxRate ?? 0,
          taxAmount: i.taxAmount ?? 0,
          lineTotal: (i.price - (i.discount ?? 0)) * i.quantity + (i.taxAmount ?? 0),
          isPrescription: i.isPrescription,
          isControlled: i.isControlled
        })),
        subtotal: txn.items.reduce((sum, i) => sum + (i.price - (i.discount ?? 0)) * i.quantity, 0),
        tax: txn.taxAmount ?? 0,
        discount: txn.discount ?? 0,
        shipping: txn.shippingFee ?? 0,
        grandTotal: txn.totalAmount,
        payments: txn.payments.map(p => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference
        })),
        paymentStatus: txn.paymentStatus,
        shippingType: txn.shippingType,
        shippingAddress: txn.shippingAddress,
        sessionId: txn.sessionId,
        originalTransactionId: txn.originalTransactionId
      };

      await cacheService.set(cacheKey, receipt, this.CACHE_TTL);
      return receipt;
    } catch (error) {
      logger.error("Failed to fetch receipt", { error, transactionId });
      throw error;
    }
  }

  /**
   * Get payments breakdown for a session
   */
  async getSessionPaymentsBreakdown(
    sessionId: string
  ): Promise<SessionPaymentsBreakdownDto> {
    try {
      const cacheKey = `pos-payments-breakdown:${sessionId}`;
      const cached = await cacheService.get<SessionPaymentsBreakdownDto>(cacheKey);
      if (cached) return cached;

      // Sum payments by method (excluding reversals/refunds)
      const payments = await prisma.payment.groupBy({
        by: ['method'],
        where: {
          sessionId,
          status: 'completed',
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      });

      // Total
      const total = payments.reduce((sum, p) => sum + (p._sum.amount || 0), 0);

      const result = { payments, total };

      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to get payments breakdown", { error, sessionId });
      throw error;
    }
  }

  /**
   * Reconcile cash for a session
   */
  
  async reconcileSessionCash(
    sessionId: string,
    declaredClosingCash: number
  ): Promise<CashReconciliationResultDto> {
    const session = await prisma.pOSSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppError("Session not found", HttpStatusCode.NOT_FOUND, ErrorCode.SESSION_NOT_FOUND);
    }

    const { payments, total, cashTotal, cashDrops, cashRefunds } = await this.calculateExpectedCash(sessionId, session.openingBalance);
    const expectedCash = session.openingBalance + cashTotal - cashDrops + cashRefunds;
    const difference = declaredClosingCash - expectedCash;

    const result: CashReconciliationResultDto = {
      tenantId: session.tenantId,
      storeId: session.storeId,
      userId: session.userId,
      payments,
      total,
      openingBalance: session.openingBalance,
      declaredClosingCash,
      cashSales: cashTotal,
      cashDrops,
      cashRefunds,
      expectedCash,
      cashTotal,
      cashDifference: difference,
      status: Math.abs(difference) < 0.01 ? "OK" : "DISCREPANCY",
      sessionOpenedAt: session.openedAt,
      sessionClosedAt: session.closedAt,
    };

    await auditService.log({
        tenantId: session.tenantId,
        userId: session.userId,
        action: POSAuditAction.RECONCILE_POS_SESSION,
        entityType: 'POSSession',
        entityId: sessionId,
        details: JSON.stringify({ declared: declaredClosingCash, expected: expectedCash, difference })
    });

    return result;
  }


async getSessionSummary(sessionId: string, tenantId: string) {
  const session = await prisma.posSession.findFirst({
    where: { id: sessionId, tenantId },
    include: {
      transactions: true,
      payments: true,
      cashDrops: true,
      reconciliations: true,
      returns: true,
    },
  });

  if (!session) throw new AppError('Session not found', 404);

  const totalSales = session.transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalPayments = session.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalReturns = session.returns.reduce((sum, r) => sum + r.amount, 0);
  const totalCashDrops = session.cashDrops.reduce((sum, c) => sum + c.amount, 0);
  const totalReconciled = session.reconciliations.reduce((sum, r) => sum + r.countedCashAmount, 0);

  return {
    sessionId,
    openedBy: session.openedBy,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    totalSales,
    totalPayments,
    totalReturns,
    totalCashDrops,
    totalReconciled,
  };
}

  

  /**
   * Helper method to deduct inventory from batches (FIFO)
   */
  private async deductFromBatches(
    tenantId: string,
    storeId: string,
    productId: string,
    totalQty: number,
    tx: any
  ): Promise<{
    batchNumber?: string;
    expiryDate?: Date;
    quantity: number;
    nearExpiry: boolean;
  }[]> {
    const now = new Date();
    const batches = await tx.inventory.findMany({
      where: {
        tenantId,
        storeId,
        productId,
        expiryDate: { gte: now }, // Only non-expired batches
        quantity: { gt: 0 }
      },
      orderBy: [{ expiryDate: "asc" }, { updatedAt: "asc" }] // FIFO - oldest expiry first
    });

    let remaining = totalQty;
    const batchMovements: {
      batchNumber?: string;
      expiryDate?: Date;
      quantity: number;
      nearExpiry: boolean;
    }[] = [];

    for (const batch of batches) {
      // Check if batch is near expiry (within 30 days)
      const batchIsNearExpiry = batch.expiryDate 
        ? (batch.expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24) < 30
        : false;

      const deductQty = Math.min(batch.quantity, remaining);
      
      // Update inventory batch
      await tx.inventory.update({
        where: { id: batch.id },
        data: { quantity: batch.quantity - deductQty }
      });

      batchMovements.push({
        batchNumber: batch.batchNumber || undefined,
        expiryDate: batch.expiryDate || undefined,
        quantity: deductQty,
        nearExpiry: batchIsNearExpiry
      });

      remaining -= deductQty;
      if (remaining <= 0) break;
    }

    if (remaining > 0) {
      throw new AppError(
        "Insufficient non-expired stock to fulfill sale",
        HttpStatusCode.BAD_REQUEST,
        
      );
    }

    return batchMovements;
  }

  private async calculateExpectedCash(
    sessionId: string,
    openingBalance: number,
    tx?: any
  ): Promise<{
    payments: any[];
    total: number;
    cashTotal: number;
    cashDrops: number;
    cashRefunds: number;
  }> {
    const transaction = tx || prisma;

    const payments = await transaction.payment.findMany({
      where: { sessionId, status: "completed" },
      select: {
        method: true,
        amount: true,
        reference: true
      }
    });

    const cashTotal = payments
      .filter(p => p.method === "cash")
      .reduce((sum, p) => sum + p.amount, 0);

    const cashDrops = payments
      .filter(p => p.method === "cash_drop")
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);

    const cashRefunds = payments
      .filter(p => p.method === "refund")
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);

    const total = cashTotal - cashDrops + cashRefunds + openingBalance;

    return { payments, total, cashTotal, cashDrops, cashRefunds };
  }
}

export const posService = new POSService();