// src/modules/stockTransfer/stockTransfer.subscriber.ts
import { EventEmitter } from 'events';
import { NotificationService } from '@modules/notification/services/notification.service';
import { UserRoleService } from '@modules/userRole/services/userRole.service';
import { EVENTS } from '@events/events';
import { InventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';
import { tenantService } from '@modules/tenant/services/tenant.service';
import { storeService } from '@modules/store/services/store.service';
import { logger } from '@logging/logger';

export class StockTransferSubscriber {
  constructor(
    private eventBus: EventEmitter,
    private notificationService: NotificationService,
    private inventoryFlowService: InventoryFlowService,
    private userRoleService: UserRoleService
  ) {
    this.subscribe();
  }

  subscribe() {
    this.eventBus.on(EVENTS.STOCK_TRANSFER_REQUESTED, this.onTransferRequested);
    this.eventBus.on(EVENTS.STOCK_TRANSFER_APPROVED, this.onTransferApproved);
    this.eventBus.on(EVENTS.STOCK_TRANSFER_REJECTED, this.onTransferRejected);
    this.eventBus.on(EVENTS.STOCK_TRANSFER_CANCELLED, this.onTransferCancelled);
    this.eventBus.on(EVENTS.STOCK_TRANSFER_COMPLETED, this.onTransferCompleted);
  }

// Update existing methods to use new template
private onTransferRequested = async (transfer: any) => {
  try {
    // Fetch additional details
    const sourceTenant = await tenantService.getTenantById(transfer.tenantId);
    const destTenant = await tenantService.getTenantById(transfer.destTenantId);
    const fromStore = transfer.fromStoreId 
      ? await storeService.getStoreById(transfer.fromStoreId)
      : null;
    const toStore = transfer.toStoreId 
      ? await storeService.getStoreById(transfer.toStoreId)
      : null;

    const roles = ['storeManager', 'tenantAdmin'];
    const emails = await this.userRoleService.getUserEmailsByRoleNames(
      roles, 
      transfer.destTenantId
    );
    
    for (const email of emails) {
      await this.notificationService.sendEmail({
        to: email,
        template: 'stockTransferNotification',
        subject: 'New Stock Transfer Request',
        variables: {
          transferId: transfer.id,
          transferType: transfer.transferType,
          status: 'REQUESTED',
          fromStore: fromStore?.name || 'N/A',
          toStore: toStore?.name || 'N/A',
          initiatedBy: transfer.createdById,
          initiatedAt: transfer.createdAt.toISOString(),
          items: transfer.items
        },
      });
    }
  } catch (error) {
    console.error('Error handling transfer requested event:', error);
  }
};

// Add similar enhancements for other event handlers (approved, rejected, etc.)

  private onTransferApproved = async (transfer: any) => {
    try {
      // Notify source tenant
      const sourceEmails = await this.userRoleService.getUserEmailsByRoleNames(
        ['storeManager'], 
        transfer.tenantId
      );
      
        const sourceTenant = await tenantService.getTenantById(transfer.tenantId);
    const destTenant = await tenantService.getTenantById(transfer.destTenantId);
    const fromStore = transfer.fromStoreId 
      ? await storeService.getStoreById(transfer.fromStoreId)
      : null;
    const toStore = transfer.toStoreId 
      ? await storeService.getStoreById(transfer.toStoreId)
      : null;

      for (const email of sourceEmails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'stockTransferApproved',
          subject: 'Stock Transfer Approved',
          variables: {
            transferId: transfer.id,
            status: 'APPROVED',
            fromStore: fromStore?.name || 'N/A',
            toStore: toStore?.name || 'N/A',
            initiatedBy: transfer.createdById,
            initiatedAt: transfer.createdAt.toISOString(),
            items: transfer.items,
            destTenant: transfer.destTenantId,
            itemsCount: transfer.items.length,
            transferType: transfer.transferType,
          },
        });
      }

      // Process inventory receipt
      await this.inventoryFlowService.recordStockTransferReceipt(
        transfer.destTenantId,
        transfer.approvedById || 'system',
        transfer.id
      );
    } catch (error) {
      console.error('Error handling transfer approved event:', error);
      logger.log(error);
    }
  };

  private onTransferRejected = async ({ transfer, reason }: any) => {
    try {
      const emails = await this.userRoleService.getUserEmailsByRoleNames(
        ['INVENTORY_MANAGER'], 
        transfer.tenantId
      );
      
      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'stockTransferRejected',
          subject: 'Stock Transfer Rejected',
          variables: {
            transferId: transfer.id,
            destTenant: transfer.destTenantId,
            reason,
          },
        });
      }
    } catch (error) {
      console.error('Error handling transfer rejected event:', error);
    }
  };

  private onTransferCancelled = async ({ transfer, reason }: any) => {
    try {
      const emails = await this.userRoleService.getUserEmailsByRoleNames(
        ['INVENTORY_MANAGER'], 
        transfer.destTenantId
      );
      
      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'stockTransferCancelled',
          subject: 'Stock Transfer Cancelled',
          variables: {
            transferId: transfer.id,
            sourceTenant: transfer.tenantId,
            reason,
          },
        });
      }
    } catch (error) {
      console.error('Error handling transfer cancelled event:', error);
    }
  };

  private onTransferCompleted = async (transfer: any) => {
    try {
      // Notify both parties
      const parties = [
        { tenantId: transfer.tenantId, role: 'storeManager' },
        { tenantId: transfer.tenantId, role: 'tenantAdmin' },
        { tenantId: transfer.destTenantId, role: 'storeManager' },
        { tenantId: transfer.destTenantId, role: 'tenantAdmin' },
      ];
      
      for (const party of parties) {
        const emails = await this.userRoleService.getUserEmailsByRoleNames(
          [party.role], 
          party.tenantId
        );
        
        for (const email of emails) {
          await this.notificationService.sendEmail({
            to: email,
            template: 'stockTransferCompleted',
            subject: 'Stock Transfer Completed',
            variables: {
              transferId: transfer.id,
              itemsCount: transfer.items.length,
              completedAt: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error handling transfer completed event:', error);
    }
  };
}

// Factory initialization
export const createStockTransferSubscriber = (
  eventBus: EventEmitter,
  services: {
    notificationService: NotificationService;
    inventoryService: InventoryFlowService;
    userRoleService: UserRoleService;
  }
) => {
  return new StockTransferSubscriber(
    eventBus,
    services.notificationService,
    services.inventoryService,
    services.userRoleService
  );
};