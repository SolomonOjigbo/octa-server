// src/modules/stockTransfer/stockTransfer.subscriber.ts

import { eventBus } from "@events/eventBus";
import { inventoryFlowService } from "@modules/inventory/services/inventoryFlow.service";
import { notificationService } from "@modules/notification/services/notification.service";
import { userRoleService } from "@modules/userRole/services/userRole.service";



export class StockTransferSubscriber {


  subscribe() {
    eventBus.on('stockTransfer.created', this.onTransferCreated);
    eventBus.on('stockTransfer.received', this.onTransferReceived);
  }

    onTransferCreated = async ({ transfer }) => {
        const roles = ['inventory_manager', 'tenant_admin'];
    const emails = await userRoleService.getUserEmailsByRoleNames( roles, transfer.destinationTenantId)
    for(const email of emails) {
    await notificationService.sendEmail({
        to: email,
      template: 'stockTransferCreated',
      subject: 'stockTransferIncoming',
      variables: {
        transferId: transfer.id,
        sourceStore: transfer.sourceStore.name,
        expectedAt: transfer.expectedAt,
      },
    });
}
  };

 onTransferReceived = async ({ transfer }) => {
    const receipt = await inventoryFlowService.recordStockTransferReceipt(transfer.tenantId, transfer.userId, transfer.id);
    const emails = await userRoleService.getUserEmailsByRoleNames(['inventory_manager', 'tenant_admin'], transfer.id);
        for(const email of emails) {
        await notificationService.sendEmail({
        to: email, 
        template: 'stockTransferReceived',
        subject:'Stock Transfer Received',
        variables: {
            transfer,
            receipt,
            receivedAt: new Date().toISOString(),
        },
      });
    }
  }
}
