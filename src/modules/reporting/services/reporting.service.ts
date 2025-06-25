import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class ReportingService {
  // Sales/payment summary by cashier/user
  async getSalesSummary({ tenantId, userId, dateFrom, dateTo }: {
    tenantId: string;
    userId?: string;
    dateFrom?: string | Date;
    dateTo?: string | Date;
  }) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    // Sales totals
    const sales = await prisma.transaction.aggregate({
      where,
      _count: { _all: true },
      _sum: { totalAmount: true, taxAmount: true, discount: true },
    });
    // Payment totals
    const payments = await prisma.payment.aggregate({
      where: { ...where, status: "completed" },
      _sum: { amount: true },
    });
    // Refund totals
    const refunds = await prisma.payment.aggregate({
      where: { ...where, status: "completed", amount: { lt: 0 } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    return {
      sales,
      payments,
      refunds,
    };
  }

  // Daily sales summary
  async getDailySales({ tenantId, storeId, dateFrom, dateTo }: {
    tenantId: string;
    storeId?: string;
    dateFrom?: string | Date;
    dateTo?: string | Date;
  }) {
    // Returns sales grouped by day
    return prisma.transaction.groupBy({
      by: ["createdAt"],
      where: {
        tenantId,
        ...(storeId && { storeId }),
        ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
        ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
      },
      _sum: { totalAmount: true },
      orderBy: { createdAt: "asc" },
    });
  }
}

export const reportingService = new ReportingService();
