
import prisma from "@shared/infra/database/prisma";


export class CRMReportingService {
  async getCustomerSummary(customerId: string) {
    // Total purchases, last purchase, total payments, outstanding balance, etc.
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        transactions: true,
        payments: true,
        communicationLogs: true,
      },
    });
    const totalPurchases = customer?.transactions.reduce((sum, t) => sum + (t.totalAmount ?? 0), 0) ?? 0;
    const totalPaid = customer?.payments.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
    const lastPurchase = customer?.transactions.reduce((latest, t) =>
      !latest || (t.createdAt > latest.createdAt) ? t : latest, undefined as any
    );
    return {
      customer,
      totalPurchases,
      totalPaid,
      balance: totalPurchases - totalPaid,
      lastPurchase,
      commsCount: customer?.communicationLogs.length ?? 0,
    };
  }

  // Top N customers by spend
  async getTopCustomers({ tenantId, limit = 10 }: { tenantId: string; limit?: number }) {
    return prisma.customer.findMany({
      where: { tenantId },
      orderBy: [
        {
          transactions: {
            _sum: { totalAmount: "desc" },
          },
        },
      ],
      take: limit,
      include: {
        transactions: true,
      },
    });
  }

  // Customer purchase frequency
  async getCustomerPurchaseFrequency(customerId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    });
    if (transactions.length < 2) return { frequencyDays: null };
    const diffs = transactions
      .slice(1)
      .map((t, i) => (t.createdAt.getTime() - transactions[i].createdAt.getTime()) / (1000 * 3600 * 24));
    const avgFrequency = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return { frequencyDays: avgFrequency };
  }

  // Customers with outstanding balances (credit sales)
  async getCustomersWithOutstanding({ tenantId }: { tenantId: string }) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        transactions: true,
        payments: true,
      },
    });
    return customers
      .map(c => {
        const purchases = c.transactions.reduce((s, t) => s + (t.totalAmount || 0), 0);
        const paid = c.payments.reduce((s, p) => s + (p.amount || 0), 0);
        return { ...c, balance: purchases - paid };
      })
      .filter(c => c.balance > 0);
  }
}

export const crmReportingService = new CRMReportingService();
