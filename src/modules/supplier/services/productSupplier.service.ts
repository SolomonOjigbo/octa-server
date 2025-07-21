// src/modules/supplier/services/productSupplier.service.ts

import prisma from '@shared/infra/database/prisma';
import { b2bConnectionService } from '@modules/b2b/services/b2bConnection.service';
import { auditService } from '@modules/audit/services/audit.service';
import { logger } from '@logging/logger';
import { eventBus } from '@events/eventBus';
import { CreateProductSupplierDto, CreateProductSupplierDtoSchema, UpdateProductSupplierDto, UpdateProductSupplierDtoSchema } from '../types/productSupplier.dto';


export class ProductSupplierService {
  /**
   * Link a product (tenant or global) to a supplier.
   * If the link already exists, returns it.
   */
  async linkProductToSupplier(
    tenantId: string,
    dto: CreateProductSupplierDto
  ) {
    // Validate input
    const data = CreateProductSupplierDtoSchema.parse(dto);
    const {
      supplierId,
      tenantProductId,
      globalProductId,
      price,
      leadTime,
      notes,
    } = data;

    // Check for existing link
    const existing = await prisma.productSupplier.findFirst({
      where: {
        tenantId,
        supplierId,
        ...(tenantProductId
          ? { tenantProductId }
          : { globalProductId }),
      },
    });
    if (existing) return existing;
    
    // Create new link
    const newLink = prisma.productSupplier.create({
      data: {
        tenantId,
        supplierId,
        tenantProductId,
        globalProductId,
        price,
        leadTime,
        notes,
      },
    });
    eventBus.emit('product_supplier_linked', newLink);
    logger.info(`Product ${tenantProductId} linked to supplier ${supplierId} in tenant ${tenantId}`);
    return newLink;
  }


 async updateLink(
    tenantId: string,
    id: string,
    dto: UpdateProductSupplierDto
  ) {
    const data = UpdateProductSupplierDtoSchema.parse(dto);

    // Optionally, you could validate that the link belongs to this tenant:
    await this.getLinkById(tenantId, id);

    const updatedLink = prisma.productSupplier.update({
      where: { id },
      data: {
        ...(data.tenantProductId !== undefined && {
          tenantProductId: data.tenantProductId,
        }),
        ...(data.globalProductId !== undefined && {
          globalProductId: data.globalProductId,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.leadTime !== undefined && { leadTime: data.leadTime }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
      eventBus.emit('product_supplier_link_updated', updatedLink);
    logger.info(`Updated Product ${data?.tenantProductId} ${data?.globalProductId} linked to supplier ${data.supplierId} in tenant ${tenantId}`);
    return updatedLink;
  }

    /**
   * Remove a product-supplier link.
   */
  async unlinkProduct(tenantId: string, id: string) {
    // Optionally, validate tenantId matches the link:
    await this.getLinkById(tenantId, id);
    
    const unlinkedProduct = prisma.productSupplier.delete({ where: { id } });
        eventBus.emit('product_supplier_link_updated', unlinkedProduct);
    logger.info(`Unlinked Product ${id} from supplier in tenant ${tenantId}`);
  }

 /**
   * List all suppliers for a given product (tenant or global).
   */
 async getLinksForProduct(tenantId: string, opts: {
  tenantProductId?: string;
  globalProductId?: string;
}) {
  const { tenantProductId, globalProductId } = opts;
  if (Boolean(tenantProductId) === Boolean(globalProductId)) {
    throw new Error(
      "Must supply exactly one of 'tenantProductId' or 'globalProductId'"
    );
  }

  return prisma.productSupplier.findMany({
    where: {
      tenantId,
      ...(tenantProductId
        ? { tenantProductId }
        : { globalProductId }),
    },
    include: { supplier: true },
    orderBy: { createdAt: 'desc' },
  });
}


/**
   * (Optional helper) Fetch a single link, with tenant-scope enforcement.
   */
  async getLinkById(tenantId: string, id: string) {
    const link = await prisma.productSupplier.findFirst({
      where: { id, tenantId },
    });
    if (!link) throw new Error('Product-Supplier link not found');
    return link;
  }
  
}
export const productSupplierService = new ProductSupplierService();
