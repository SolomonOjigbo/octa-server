
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
      originalMap[i.tenantProductId || i.productId] = {
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice ?? i.costPrice ?? i.price ?? 0),
      };
    }
  
    // Rest of the function remains the same
    // ...
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
