import { EventEmitter } from 'events';
import { NotificationService } from '@modules/notification/services/notification.service';
import { UserRoleService } from '@modules/userRole/services/userRole.service';
import { EVENTS } from '@events/events';
import { storeService } from '@modules/store/services/store.service';
import { tenantService } from '@modules/tenant/services/tenant.service';
import prisma from '@shared/infra/database/prisma';
import { inventoryFlowService } from './services/inventoryFlow.service';
import { inventoryService } from './services/inventory.service';
import { tenantOnboardingSchema } from '@modules/tenant/validations';

export class InventorySubscriber {
  constructor(
    private eventBus: EventEmitter,
    private notificationService: NotificationService,
    private userRoleService: UserRoleService
  ) {
    this.subscribe();
  }

  subscribe() {
    this.eventBus.on(EVENTS.INVENTORY_ADJUSTMENT, this.onInventoryAdjustment);
    this.eventBus.on(EVENTS.LOW_STOCK_ALERT, this.onLowStockAlert);
  }

  private onInventoryAdjustment = async (payload: {
    movementId: string;
    performedBy: string;
    details: any;
  }) => {
    try {
      // Fetch additional details
      const store = payload.details.storeId 
        ? await inventoryService.getById(payload.performedBy, payload.movementId)
        : null;
      
      const product = await prisma.tenantProduct.findUnique({
        where: { id: payload.details.tenantProductId }
      });

      // Get adjustment details
      const adjustment = {
        product,
        adjustment: payload.details.quantity,
        newQuantity: await this.calculateNewQuantity(payload.details),
        positive: payload.details.quantity > 0
      };

      const roles = ['tenantAdmin', 'storeManager'];
      const emails = await this.userRoleService.getUserEmailsByRoleNames(
        roles, 
        product.tenantId
      );
      
      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'inventoryAdjustment',
          subject: 'Inventory Adjustment Performed',
          variables: {
            reference: payload.details.reference,
            movementType: payload.details.movementType,
            performedBy: payload.performedBy,
            performedAt: new Date().toISOString(),
            items: [adjustment],
            reason: payload.details.reason || 'Manual adjustment'
          },
        });
      }
    } catch (error) {
      console.error('Error handling inventory adjustment event:', error);
    }
  };

  private async calculateNewQuantity(details: any): Promise<number> {
    const currentStock = await prisma.stock.findFirst({
      where: {
        tenantProductId: details.tenantProductId,
        storeId: details.storeId,
        warehouseId: details.warehouseId
      }
    });
    return (currentStock?.quantity || 0) + details.quantity;
  }

  private onLowStockAlert = async (payload: {
    tenantId: string;
    threshold: number;
    items: Array<{
      product: any;
      variant: any;
      currentQuantity: number;
      minQuantity: number;
      storeId?: string;
      warehouseId?: string;
    }>;
  }) => {
    try {
      // Fetch location details
      const enrichedItems = await Promise.all(payload.items.map(async item => {
        const store = item.storeId 
          ? await storeService.getStoreById(item.storeId)
          : null;
    
        return {
          product: item.product,
          variant: item.variant,
          currentQuantity: item.currentQuantity,
          minQuantity: item.minQuantity,
          store: store?.name,
        };
      }));

      const roles = ['storeManager', 'tenantAdmin'];
      const emails = await this.userRoleService.getUserEmailsByRoleNames(
        roles, 
        payload.tenantId
      );
      
      for (const email of emails) {
        await this.notificationService.sendEmail({
          to: email,
          template: 'lowStockAlert',
          subject: 'Low Stock Alert',
          variables: {
            threshold: payload.threshold,
            alertTime: new Date().toISOString(),
            items: enrichedItems
          },
        });
      }
    } catch (error) {
      console.error('Error handling low stock alert event:', error);
    }
  };
}

// Factory initialization
export const createInventorySubscriber = (
  eventBus: EventEmitter,
  services: {
    notificationService: NotificationService;
    userRoleService: UserRoleService;
  }
) => {
  return new InventorySubscriber(
    eventBus,
    services.notificationService,
    services.userRoleService
  );
};