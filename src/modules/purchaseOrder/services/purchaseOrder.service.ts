// modules/purchaseOrder/services/purchaseOrder.service.ts
import { PrismaClient } from "@prisma/client";
import { 
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CancelPurchaseOrderDto,
  LinkPaymentDto,
  PurchaseOrderResponseDto,
  ListPurchaseOrdersDto,
  PurchaseOrderItemResponseDto
} from "../types/purchaseOrder.dto";
import { inventoryService } from "../../inventory/services/inventory.service";
import { stockService } from "../../stock/services/stock.service";
import { auditService } from "@modules/audit/services/audit.service";
import { eventEmitter } from "@events/event.emitter";
import { logger } from "@logging/logger";
import { cacheService } from "@cache/cache.service";
import { AppError } from "@common/constants/app.errors";
import { HttpStatusCode } from "@common/constants/http";
import { StockMovementType } from "@common/types/stockMovement.dto";

const prisma = new PrismaClient();

export class PurchaseOrderService {
  private readonly CACHE_TTL = 60 * 10; // 10 minutes

  async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Validate all products exist and are active
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { isActive: true, isControlled: true }
        });

        if (!product || !product.isActive) {
          throw new AppError(`Product ${item.productId} not found or inactive`, HttpStatusCode.BAD_REQUEST);
        }

        // Additional validation for controlled substances
        if (product.isControlled && (!item.batchNumber || !item.expiryDate)) {
          throw new AppError(
            `Batch number and expiry date required for controlled substance ${item.productId}`,
            HttpStatusCode.BAD_REQUEST
          );
        }
      }

      // Create the purchase order
      const po = await tx.purchaseOrder.create({
        data: {
          tenantId: dto.tenantId,
          supplierId: dto.supplierId,
          storeId: dto.storeId,
          warehouseId: dto.warehouseId,
          orderDate: new Date(dto.orderDate),
          status: "pending",
          totalAmount: dto.totalAmount,
          notes: dto.notes,
          items: {
            create: dto.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              costPrice: item.costPrice,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  isControlled: true
                }
              }
            }
          },
          supplier: true,
          store: true,
          warehouse: true,
          payments: true
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.requestedBy, // Assuming requestedBy is added to DTO
        tenantId: dto.tenantId,
        action: "PURCHASE_ORDER_CREATED",
        entityType: "PurchaseOrder",
        entityId: po.id,
        metadata: {
          supplierId: dto.supplierId,
          itemCount: dto.items.length,
          totalAmount: dto.totalAmount
        }
      });

      // Emit event
      eventEmitter.emit("purchaseOrder:created", {
        poId: po.id,
        tenantId: dto.tenantId,
        supplierId: dto.supplierId,
        itemCount: dto.items.length,
        totalAmount: dto.totalAmount
      });

      // Invalidate cache
      await cacheService.invalidate(`purchaseOrders:${dto.tenantId}`);

      return this.toResponseDto(po);
    });
  }

  async receivePurchaseOrder(tenantId: string, id: string, userId: string): Promise<PurchaseOrderResponseDto> {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { 
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  isControlled: true
                }
              }
            }
          },
          supplier: true,
          store: true,
          warehouse: true
        }
      });

      if (!po) {
        throw new AppError('Purchase order not found', HttpStatusCode.NOT_FOUND);
      }

      if (po.status === "received") {
        throw new AppError('Purchase order already received', HttpStatusCode.BAD_REQUEST);
      }

      if (po.status === "cancelled") {
        throw new AppError('Cannot receive a cancelled purchase order', HttpStatusCode.BAD_REQUEST);
      }

      if (po.tenantId !== tenantId) {
        throw new AppError('Unauthorized access to purchase order', HttpStatusCode.FORBIDDEN);
      }

      // Inventory + Stock Update for each item
      for (const item of po.items) {
        // Add inventory movement
        await inventoryService.recordMovement({
          tenantId,
          productId: item.productId,
          storeId: po.storeId,
          warehouseId: po.warehouseId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          movementType: StockMovementType.PURCHASE,
          costPrice: item.costPrice,
          expiryDate: item.expiryDate,
          reference: po.id,
          id: item.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Adjust stock
        await stockService.incrementStockLevel({
          tenantId,
          productId: item.productId,
          storeId: po.storeId,
          warehouseId: po.warehouseId,
          delta: item.quantity
        }, userId);
      }

      // Mark PO as received
      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "received",
          receivedDate: new Date()
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  isControlled: true
                }
              }
            }
          },
          supplier: true,
          store: true,
          warehouse: true,
          payments: true
        }
      });

      // Audit log
      await auditService.log({
        userId,
        tenantId,
        action: "PURCHASE_ORDER_RECEIVED",
        entityType: "PurchaseOrder",
        entityId: po.id,
        metadata: {
          itemCount: po.items.length,
          totalAmount: po.totalAmount
        }
      });

      // Emit event
      eventEmitter.emit("purchaseOrder:received", {
        poId: po.id,
        tenantId,
        itemCount: po.items.length,
        receivedBy: userId
      });

      // Invalidate cache
      await cacheService.invalidate(`purchaseOrders:${tenantId}`);

      return this.toResponseDto(updatedPo);
    });
  }

  async listPurchaseOrders(filters: ListPurchaseOrdersDto): Promise<{
    data: PurchaseOrderResponseDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const cacheKey = `purchaseOrders:${JSON.stringify(filters)}`;
    
    try {
      const cached = await cacheService.get<{
        data: PurchaseOrderResponseDto[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(cacheKey);
      if (cached) return cached;

      const where: any = {
        tenantId: filters.tenantId,
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.storeId && { storeId: filters.storeId }),
        ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
        ...(filters.fromDate && { orderDate: { gte: filters.fromDate } }),
        ...(filters.toDate && { orderDate: { lte: filters.toDate } }),
      };

      // Filter by product if specified
      if (filters.productId) {
        where.items = {
          some: {
            productId: filters.productId
          }
        };
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [total, pos] = await Promise.all([
        prisma.purchaseOrder.count({ where }),
        prisma.purchaseOrder.findMany({
          where,
          skip,
          take: limit,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                    isControlled: true
                  }
                }
              }
            },
            supplier: true,
            store: true,
            warehouse: true,
            payments: true
          },
          orderBy: { orderDate: "desc" }
        })
      ]);

      const result = {
        data: pos.map(this.toResponseDto),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      await cacheService.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error("Failed to fetch purchase orders", { error });
      throw new AppError('Failed to fetch purchase orders', HttpStatusCode.INTERNAL_SERVER);
    }
  }

  async getPurchaseOrderById(tenantId: string, id: string): Promise<PurchaseOrderResponseDto | null> {
    try {
      const po = await prisma.purchaseOrder.findFirst({
        where: { id, tenantId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  isControlled: true
                }
              }
            }
          },
          supplier: true,
          store: true,
          warehouse: true,
          payments: true
        }
      });

      return po ? this.toResponseDto(po) : null;
    } catch (error) {
      logger.error("Failed to fetch purchase order", { error });
      throw new AppError('Failed to fetch purchase order', HttpStatusCode.INTERNAL_SERVER);
    }
  }

  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return prisma.$transaction(async (tx) => {
      const existingPo = await tx.purchaseOrder.findUnique({
        where: { id },
        select: { status: true, tenantId: true }
      });

      if (!existingPo) {
        throw new AppError('Purchase order not found', HttpStatusCode.NOT_FOUND);
      }

      // Prevent updates to received or cancelled POs
      if (existingPo.status === "received" || existingPo.status === "cancelled") {
        throw new AppError(`Cannot update a ${existingPo.status} purchase order`, HttpStatusCode.BAD_REQUEST);
      }

      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: data.status,
          receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
          notes: data.notes
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  isControlled: true
                }
              }
            }
          },
          supplier: true,
          store: true,
          warehouse: true,
          payments: true
        }
      });

      // Audit log
      await auditService.log({
        userId: data.updatedBy || 'system', // Assuming updatedBy is added to DTO
        tenantId: existingPo.tenantId,
        action: "PURCHASE_ORDER_UPDATED",
        entityType: "PurchaseOrder",
        entityId: id,
        metadata: {
          newStatus: data.status,
          previousStatus: existingPo.status
        }
      });

      // Emit event if status changed
      if (data.status && data.status !== existingPo.status) {
        eventEmitter.emit("purchaseOrder:status_changed", {
          poId: id,
          tenantId: existingPo.tenantId,
          previousStatus: existingPo.status,
          newStatus: data.status
        });
      }

      // Invalidate cache
      await cacheService.invalidate(`purchaseOrders:${existingPo.tenantId}`);

      return this.toResponseDto(updatedPo);
    });
  }

  async cancelPurchaseOrder(id: string, dto: CancelPurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return prisma.$transaction(async (tx) => {
      const existingPo = await tx.purchaseOrder.findUnique({
        where: { id },
        select: { status: true, tenantId: true }
      });

      if (!existingPo) {
        throw new AppError('Purchase order not found', HttpStatusCode.NOT_FOUND);
      }

      if (existingPo.status === "received") {
        throw new AppError('Cannot cancel a received purchase order', HttpStatusCode.BAD_REQUEST);
      }

      if (existingPo.status === "cancelled") {
        throw new AppError('Purchase order already cancelled', HttpStatusCode.BAD_REQUEST);
      }

      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "cancelled",
          notes: dto.reason ? `Cancelled: ${dto.reason}` : undefined
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  isControlled: true
                }
              }
            }
          },
          supplier: true,
          store: true,
          warehouse: true,
          payments: true
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.cancelledBy,
        tenantId: existingPo.tenantId,
        action: "PURCHASE_ORDER_CANCELLED",
        entityType: "PurchaseOrder",
        entityId: id,
        metadata: {
          reason: dto.reason
        }
      });

      // Emit event
      eventEmitter.emit("purchaseOrder:cancelled", {
        poId: id,
        tenantId: existingPo.tenantId,
        cancelledBy: dto.cancelledBy,
        reason: dto.reason
      });

      // Invalidate cache
      await cacheService.invalidate(`purchaseOrders:${existingPo.tenantId}`);

      return this.toResponseDto(updatedPo);
    });
  }

  async linkPayment(id: string, dto: LinkPaymentDto): Promise<PurchaseOrderResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Verify payment exists
      const payment = await tx.payment.findUnique({
        where: { id: dto.paymentId }
      });

      if (!payment) {
        throw new AppError('Payment not found', HttpStatusCode.NOT_FOUND);
      }

      // Verify PO exists
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        select: { tenantId: true, totalAmount: true, payments: true }
      });

      if (!po) {
        throw new AppError('Purchase order not found', HttpStatusCode.NOT_FOUND);
      }

      // Check if payment is already linked
      if (po.payments.some(p => p.id === dto.paymentId)) {
        throw new AppError('Payment already linked to this purchase order', HttpStatusCode.BAD_REQUEST);
      }

      // Link payment to PO
      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: {
          payments: {
            connect: { id: dto.paymentId }
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  isControlled: true
                }
              }
            }
          },
          supplier: true,
          store: true,
          warehouse: true,
          payments: true
        }
      });

      // Audit log
      await auditService.log({
        userId: dto.linkedBy || 'system', // Assuming linkedBy is added to DTO
        tenantId: po.tenantId,
        action: "PURCHASE_ORDER_PAYMENT_LINKED",
        entityType: "PurchaseOrder",
        entityId: id,
        metadata: {
          paymentId: dto.paymentId,
          amount: dto.amount
        }
      });

      // Emit event
      eventEmitter.emit("purchaseOrder:payment_linked", {
        poId: id,
        tenantId: po.tenantId,
        paymentId: dto.paymentId,
        amount: dto.amount
      });

      // Invalidate cache
      await cacheService.invalidate(`purchaseOrders:${po.tenantId}`);

      return this.toResponseDto(updatedPo);
    });
  }

  private toResponseDto(po: any): PurchaseOrderResponseDto {
    const paidAmount = po.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    
    return {
      id: po.id,
      tenantId: po.tenantId,
      supplier: {
        id: po.supplierId,
        name: po.supplier?.name || 'Unknown Supplier'
      },
      store: po.storeId ? {
        id: po.storeId,
        name: po.store?.name || 'Unknown Store'
      } : undefined,
      warehouse: po.warehouseId ? {
        id: po.warehouseId,
        name: po.warehouse?.name || 'Unknown Warehouse'
      } : undefined,
      orderDate: po.orderDate,
      receivedDate: po.receivedDate || undefined,
      status: po.status,
      totalAmount: po.totalAmount,
      paidAmount,
      balance: po.totalAmount - paidAmount,
      notes: po.notes || undefined,
      items: po.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Unknown Product',
        productSku: item.product?.sku || 'N/A',
        quantity: item.quantity,
        costPrice: item.costPrice,
        batchNumber: item.batchNumber || undefined,
        expiryDate: item.expiryDate || undefined,
        isControlled: item.product?.isControlled || false
      })),
      payments: po.payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt || undefined
      })),
      createdAt: po.createdAt,
      updatedAt: po.updatedAt
    };
  }
}

export const purchaseOrderService = new PurchaseOrderService();