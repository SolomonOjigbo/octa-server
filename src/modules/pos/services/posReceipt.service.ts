// src/modules/pos/services/posReceipt.service.ts
import { Response } from "express";
import PDFDocument from "pdfkit";
import prisma from "@shared/infra/database/prisma";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";

export class POSReceiptService {
  async getReceipt(tenantId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, tenantId },
      include: {
        items: true,
        customer: true,
        session: {
          include: {
            store: true,
            user: true,
          },
        },
        payments: true,
      },
    });

    if (!transaction) throw new Error("Transaction not found");

     eventBus.emit(EVENTS.POS_RECEIPT_READY, {
      tenantId,
      transactionId: transaction.id,
      customerEmail: transaction?.customer?.email,
    });

    // Format receipt structure
    return {
      transactionId: transaction.id,
      date: transaction.createdAt,
      store: {
        name: transaction.session.store.name,
        address: transaction.session.store.address,
      },
      cashier: {
        name: transaction.session.user.name,
      },
      customer: transaction.customer ?? null,
      items: transaction.items.map((item) => ({
        product: item.tenantProductId,
        variant: item.tenantProductVariantId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        tax: item.tax,
      })),
      totals: {
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        payments: transaction.payments,
      },
      metadata: {
        sessionId: transaction.posSessionId,
        reference: transaction.reference,
      },
    };
  }

  async streamPDFReceipt(tenantId: string, transactionId: string, res: Response) {
    const receipt = await this.getReceipt(tenantId, transactionId);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=receipt-${transactionId}.pdf`);

    doc.pipe(res);

    doc.fontSize(16).text("POS RECEIPT", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Transaction ID: ${receipt.transactionId}`);
    doc.text(`Date: ${new Date(receipt.date).toLocaleString()}`);
    doc.text(`Cashier: ${receipt.cashier.name}`);
    doc.text(`Store: ${receipt.store.name}`).moveDown();

    doc.text("Items:");
    receipt.items.forEach(item => {
      doc.text(
        ` - ${item.product} x${item.quantity} @ ${item.price} → ₦${item.quantity * item.price}`
      );
    });

    doc.moveDown().text(`Total: ₦${receipt.totals.total}`);
    doc.text(`Payment Method: ${receipt.totals.paymentMethod}`);
    doc.end();
  }
}

export const posReceiptService = new POSReceiptService();
