

import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import {logger} from "@logging/logger";
import { notificationService } from "@modules/notification/services/notification.service";

const prisma = new PrismaClient();

// Run daily at 3:00 AM
export function scheduleStockReconciliation() {
  cron.schedule("0 3 * * *", async () => {
    logger.info("🔄 Starting stock vs. inventory reconciliation...");

    // 1. Aggregate inventory by key
    const invAgg = await prisma.inventory.groupBy({
      by: ["tenantId", "storeId", "productId", "batchNumber"],
      _sum: { quantity: true },
    });

    // 2. Compare to stock
    for (const rec of invAgg) {
      const sumQty = rec._sum.quantity ?? 0;
      // match stock rows with matching keys (ignoring warehouse & variant)
      const stock = await prisma.stock.findFirst({
        where: {
          tenantId: rec.tenantId,
          storeId: rec.storeId,
          tenantProductId: rec.productId,
          batchNumber: rec.batchNumber,
        },
      });
      const stockQty = stock?.quantity ?? 0;

      if (stockQty !== sumQty) {
        const msg = `Reconciliation mismatch: tenant=${rec.tenantId}, store=${rec.storeId}, product=${rec.productId}, batch=${rec.batchNumber} → stock=${stockQty}, inventorySum=${sumQty}`;
        logger.warn("❗ " + msg);
        // Send alert email to ops team
        await notificationService.sendEmail({
          to: process.env.OPERATIONS_EMAIL!,
          subject: "Stock Reconciliation Alert",
          template: "stockReconciliationAlert",
          variables: { message: msg },
        });
      }
    }

    logger.info("✅ Stock reconciliation job completed.");
  });
}
