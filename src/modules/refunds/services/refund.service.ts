
import prisma from '@shared/infra/database/prisma';
import { inventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { CreateRefundDto } from '../types/refund.dto';
import { AppError } from '@common/constants/app.errors';

export class RefundService {
  /**
   * Create a refund for a sale or PO return, and roll back inventory.
   */
  async createRefund(
    tenantId: string,
    userId: string,
    dto: CreateRefundDto
  ) {
    // 1) Load original sale or PO
    const original = dto.transactionId
      ? await prisma.transaction.findUnique({
          where: { id: dto.transactionId },
          include: { items: true, store: true },
        })
      : await prisma.purchaseOrder.findUnique({
          where: { id: dto.purchaseOrderId! },
          include: { items: true, store: true, warehouse: true },
        });

    if (!original) {
      throw new AppError(
        dto.transactionId
          ? 'Original transaction not found'
          : 'Original purchase order not found',
        404
      );
    }

    // 2) Build a map of original quantities & prices by tenantProductId
    const originalMap: Record<string, { quantity: number; unitPrice: number }> =
      {};
    for (const i of original.items) {
      originalMap[i.tenantProductId] = {
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice ?? i.costPrice ?? 0),
      };
    }

    // 3) Validate refund items, resolve tenantProductId, compute total
    let totalRefund = 0;
    const rollbacks: Array<{
      tenantProductId: string;
      quantity: number;
      reason?: string;
    }> = [];

    for (const it of dto.refundItems) {
      // Resolve tenantProductId
      let tpid = it.tenantProductId!;
      if (!tpid && it.globalProductId) {
        const tp = await prisma.tenantProduct.findFirst({
          where: { tenantId, globalProductId: it.globalProductId },
        });
        if (!tp) {
          throw new AppError(
            `Product ${it.globalProductId} not in tenant catalog`,
            400
          );
        }
        tpid = tp.id;
      }

      // Validate against original
      const orig = originalMap[tpid];
      if (!orig || orig.quantity < it.quantity) {
        throw new AppError(
          `Cannot refund ${it.quantity} of product ${tpid}`,
          400
        );
      }

      totalRefund += it.quantity * orig.unitPrice;
      rollbacks.push({ tenantProductId: tpid, quantity: it.quantity, reason: it.reason });
    }

    // 4) Create the refund record
    const refund = await prisma.refund.create({
      data: {
        tenantId,
        userId,
        transactionId: dto.transactionId ?? null,
        purchaseOrderId: dto.purchaseOrderId ?? null,
        refundItems: dto.refundItems,
        totalRefund,
        refundMethod: dto.refundMethod,
        notes: dto.notes,
      },
    });

    // 5) Roll back inventory via POS‐return flow
    //    Use the same store (or warehouse) as the original
    const storeId = (original as any).storeId;
    const warehouseId = (original as any).warehouseId;
    await inventoryFlowService.processPOSReturn(tenantId, userId, 
      rollbacks.map(r => ({
        tenantProductId: r.tenantProductId,
        quantity: r.quantity,
        storeId,
        // if warehouse flow, you could call a different service
        reason: r.reason ?? 'Refund',
        reference: refund.id,
      }))
    );

    return refund;
  }

  async getRefundById(tenantId: string, id: string) {
    const refund = await prisma.refund.findFirst({
      where: { id, tenantId },
    });
    if (!refund) throw new AppError('Refund not found', 404);
    return refund;
  }

  async listRefunds(tenantId: string, filters: {
    transactionId?: string;
    purchaseOrderId?: string;
  }) {
    return prisma.refund.findMany({
      where: {
        tenantId,
        ...(filters.transactionId && { transactionId: filters.transactionId }),
        ...(filters.purchaseOrderId && { purchaseOrderId: filters.purchaseOrderId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const refundService = new RefundService();
