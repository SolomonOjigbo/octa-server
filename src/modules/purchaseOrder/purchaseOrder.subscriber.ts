// src/modules/purchaseOrder/purchaseOrder.subscriber.ts

import { NotificationService } from '@modules/notification/services/notification.service';
import { InventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { InvoiceService } from '@modules/invoice/services/invoice.service';
import { EventEmitter } from "events";
import { userRoleService } from '@modules/userRole/services/userRole.service';

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

  private onPurchaseOrderCreated = async ({ po, invoice }) => {
    const emails = await userRoleService.getUserEmailsByRoleName('tenant_admin', po.tenantId);
    for (const email of emails) {
    await this.notificationService.sendEmail({
      to: email,
      subject: 'Purchase Order Created',
      template: 'purchaseOrderCreated',
      variables: {
        supplierName: po.supplier.name,
        poId: po.id,
        invoiceId: invoice?.id,
        createdAt: po.createdAt,
      },
    });
    }
  };

  private onPurchaseOrderReceived = async ({ tenantId, userId, poId }: { tenantId: string, userId: string, poId: string }) => {
    // Trigger stock adjustment or reconciliation if necessary
    await this.inventoryFlowService.recordReceiptForPO(tenantId, userId, poId);
  };
}
