// src/modules/purchaseOrder/purchaseOrder.subscriber.ts

import { NotificationService } from '@modules/notification/services/notification.service';
import { InventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { InvoiceService } from '@modules/invoice/services/invoice.service';
import { EventEmitter } from "events";
import { userRoleService } from '@modules/userRole/services/userRole.service';
import prisma from '@shared/infra/database/prisma';

export class PurchaseOrderSubscriber {
  constructor(
    private eventBus: EventEmitter,
    private notificationService: NotificationService,
    private inventoryFlowService: InventoryFlowService,
    private invoiceService: InvoiceService
  ) {}

  subscribe() {
    this.eventBus.on('purchaseOrder.created', this.onPurchaseOrderCreated);
    this.eventBus.on('purchaseOrder.received', this.onPurchaseOrderReceived);
  }

  // private onPurchaseOrderCreated = async ({ po, invoice }) => {
  //   const emails = await userRoleService.getUserEmailsByRoleName('tenant_admin', po.tenantId);
  //   for (const email of emails) {
  //   await this.notificationService.sendEmail({
  //     to: email,
  //     subject: 'Purchase Order Created',
  //     template: 'purchaseOrderCreated' ,
  //     variables: {
  //       poNumber: po.poNumber,
  //       poId: po.id,
  //       invoiceId: invoice?.id,
  //       createdAt: po.createdAt,
  //       supplierName: po.supplier.name,
  //       items: po.items.map(item => ({
  //         product: item.product.name,
  //         quantity: item.quantity
  //       }))
  //     },
  //   });
  //   }
  // };
// File: purchaseOrder.subscriber.ts
private onPurchaseOrderCreated = async ({ po, invoice }) => {
  const emails = await userRoleService.getUserEmailsByRoleName('tenantAdmin', po.tenantId);
  
  // Fetch product details for PO items
  const itemsWithProducts = await Promise.all(po.items.map(async (item) => {
    const product = await prisma.tenantProduct.findUnique({
      where: { id: item.tenantProductId },
      select: { name: true }
    });
    return { ...item, product };
  }));

  for (const email of emails) {
    await this.notificationService.sendEmail({
      to: email,
      subject: 'Purchase Order Created',
      template: 'purchaseOrderCreated',
      variables: {
        poNumber: po.poNumber,
        supplierName: po.supplier.name,
        items: po.items.map(item => ({
          product: item.product.name,
          quantity: item.quantity
        })),
        totalAmount: po.totalAmount,
        createdAt: po.createdAt.toLocaleDateString()
      },
    });
  }
};
  private onPurchaseOrderReceived = async ({ tenantId, userId, poId }: { tenantId: string, userId: string, poId: string }) => {
    // Trigger stock adjustment or reconciliation if necessary
    await this.inventoryFlowService.recordReceiptForPO(tenantId, userId, poId);
    
  };
}
