import{ parse } from "csv-parse";
import prisma from '@shared/infra/database/prisma';
import { CreateGlobalProductDto, CreateGlobalProductVariantDto, CSVRow, UpdateGlobalProductDto } from '../types/globalCatalog.dto';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { promisify } from 'util';
import * as fs from 'fs';
import * as util from 'util';
import { cacheService } from "@cache/cache.service";
import { CacheKeys } from "@cache/cacheKeys";
import { auditService } from "@modules/audit/services/audit.service";
import { eventBus } from "@events/eventBus";
import { EVENTS } from "@events/events";
import {logger } from "@logging/logger";
import { globalVariantService } from './globalVariant.service';
import { createGlobalProductSchema, createGlobalVariantSchema } from '../validations';
import { Prisma } from '@prisma/client';

const pipeline = promisify(require('stream').pipeline);

export class GlobalProductService {
  async createGlobalProduct(
    actorId: string,
    tenantId: string,
    dto: CreateGlobalProductDto & { category?: { name: string; imageUrl?: string; parentId?: string; description?: string }; variants?: Array<{ name: string; sku: string; costPrice: number; sellingPrice: number; stock?: number; imageUrl?: string; variantAttributeIds: string[] }> }
  ) {
    // 1. Validate incoming DTO
    const data = createGlobalProductSchema.parse(dto);

    // 2. Resolve category (inline vs reference)
    let categoryId = data.globalCategoryId;
    if (!categoryId && dto.category) {
      // inline create
    const newCat = await prisma.globalCategory.create({
      data: { 
        name: dto.category.name,
        ...(dto.category.imageUrl && { imageUrl: dto.category.imageUrl }),
        ...(dto.category.parentId && { parentId: dto.category.parentId }),
        ...(dto.category.description && { description: dto.category.description }),
      },
    });
    categoryId = newCat.id;

      // audit & event for category
      await auditService.log({
        tenantId,
        userId: actorId,
        module: "global_category",
        action: "create",
        entityId: newCat.id,
        details: {
          name: newCat.name,
          description: newCat.description,
        },
      });
      eventBus.emit(EVENTS.GLOBAL_CATEGORY_CREATED, {
        tenantId,
        categoryId: newCat.id,
        userId: actorId,
      });
      await cacheService.del(CacheKeys.globalCategoryList());
      logger.info(`Inline GlobalCategory created: ${newCat.id}`);
    }

    if (!categoryId) {
      throw new Error("globalCategoryId is required (either reference or inline).");
    }

    const productData: Prisma.GlobalProductCreateInput = {
    ...(tenantId && {connect: {id: tenantId}}),
    sku: data.sku,
    isPrescription: data.isPrescription ?? false,
    isActive: data.isActive ?? true,
    isVariable: data.isVariable ?? false,
    name: data.name,
    category: { connect: { id: categoryId } }, // Proper relation connection
    ...(data.barcode && { barcode: data.barcode }),
    ...(data.imageUrl && { imageUrl: data.imageUrl }),
    ...(data.brand && { brand: data.brand }),
    ...(data.dosageForm && { dosageForm: data.dosageForm }),
    ...(data.sellingType && { sellingType: data.sellingType }),
    ...(data.description && { description: data.description }),
       ...(!data.isVariable && { 
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice 
    }),
  };

    const product = await prisma.globalProduct.create({
    data: productData
      });

    // audit & event for product
    await auditService.log({
      tenantId,
      userId: actorId,
      module: "global_product",
      action: "create",
      entityId: product.id,
      details: { sku: product.sku, name: product.name },
    });
    eventBus.emit(EVENTS.GLOBAL_PRODUCT_CREATED, {
      tenantId,
      GlobalProductId: product.id,
      actorId,
    });
    await Promise.all([
      cacheService.del(CacheKeys.globalProductList(categoryId)),
      cacheService.del(CacheKeys.globalProductDetail(product.id))
    ]);
    logger.info(`GlobalProduct created: ${product.id}`);

    // 4. Create Variants (if any)
    if (Array.isArray(dto.variants)) {
      if (!product.isVariable && dto.variants.length > 0) {
      throw new Error("Cannot add variants to a non-variable product");
    }

    if (product.isVariable && dto.variants.length === 0) {
      throw new Error("Variable products must have at least one variant");
    }
      for (const v of dto.variants) {
        // attach the parent productId
        await globalVariantService.createGlobalProductVariant(
          tenantId,
          actorId,
          
          {  ...v,
            globalProductId: product.id,
        }
        );
      }
    } else if (product.isVariable) {
    throw new Error("Variable products must have variants");
  }
    // 5. Return the newly created product
    return product;
  }

  async updateGlobalProduct(
    id: string,
    userId: string,
    tenantId: string,
    dto: UpdateGlobalProductDto,
  ) {
    // 1. Unique code check if changed
    if (dto.sku) {
      const conflict = await prisma.globalProduct.findFirst({
        where: { sku: dto.sku, id: { not: id } },
      });
      if (conflict) throw new Error("GlobalProduct sku conflict.");
    }

    // 2. Update
    const product = await prisma.globalProduct.update({
      where: { id },
      data: dto as any,
    });

    // 3. Audit
    await auditService.log({
      tenantId: tenantId,
      userId: userId,
      module: "global_product",
      action: "update",
      entityId: id,
      details: dto,
    });

    // 4. Cache
    await cacheService.del(CacheKeys.globalProductList(product.globalCategoryId));
    await cacheService.del(
      CacheKeys.globalProductDetail(id)
    );

    // 5. Event
    eventBus.emit(EVENTS.GLOBAL_PRODUCT_UPDATED, {
      tenantId: tenantId,
      globalProductId: id,
      changes: dto,
      userId,
    });

    logger.info(`GlobalProduct updated: ${id}`);
    return product;
  }

  async deleteGlobalProduct(id: string, userId: string, tenantId: string) {
    // 1. Fetch to get tenantId
    const product = await prisma.globalProduct.findUnique({ where: { id } });
    if (!product) throw new Error("GlobalProduct not found.");

    // 2. Delete
    await prisma.globalProduct.delete({ where: { id } });

    // 3. Audit
    await auditService.log({
      tenantId: tenantId,
      userId: userId,
      module: "global_product",
      action: "delete",
      entityId: id,
    });

    // 4. Cache
    await cacheService.del(CacheKeys.globalProductList(tenantId));
    await cacheService.del(
      CacheKeys.globalProductDetail( id)
    );

    // 5. Event
    eventBus.emit(EVENTS.GLOBAL_PRODUCT_DELETED, {
      tenantId: tenantId,
      globalProductId: id,
      userId,
    });

    logger.info(`GlobalProduct deleted: ${id}`);
    return { success: true };
  }

  async getGlobalProducts(tenantId: string) {
    const key = CacheKeys.globalProductList(tenantId);
    let list = await cacheService.get<any[]>(key);
    if (!list) {
      list = await prisma.globalProduct.findMany();
      await cacheService.set(key, list, 300);
    }
    return list;
  }

  async getGlobalProductById(id: string) {
    // Fetch first to get tenantId
    const product = await prisma.globalProduct.findUnique({ where: { id } });
    if (!product) throw new Error("GlobalProduct not found.");
    const key = CacheKeys.globalProductDetail(id);
    let p = await cacheService.get<any>(key);
    if (!p) {
      p = product;
      await cacheService.set(key, p, 300);
    }
    return p;
  }

  async bulkImportProductsFromCSV(
  actorId: string,
  tenantId: string,
  filePath: string,
): Promise<{ success: number; errors: Array<{ row: number; error: string }> }> {
  const errors: Array<{ row: number; error: string }> = [];
  let successCount = 0;

  try {
    // 1. Parse CSV file
    const records = await this.parseCSVFile(filePath);

    // 2. Process in batches (100 at a time)
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchResults = await this.processImportBatch(actorId, tenantId, batch, i + 1);
      successCount += batchResults.success;
      errors.push(...batchResults.errors);
    }

    return { success: successCount, errors };
  } catch (error) {
    logger.error('Bulk import failed', error);
    throw new Error('Failed to process CSV import');
  }
}



private async parseCSVFile(filePath: string): Promise<Record<string, any>[]> {
  try {
    const records: Record<string, any>[] = [];
    const parseOptions = {
      columns: true,
      trim: true,
      skip_empty_lines: true,
      cast: (value: string, context: { column: string | number }) => {
        const column = typeof context.column === 'string' ? context.column : '';
        return this.castCSVValue(value, { column });
      }
    };

    // Create readable stream from file content
    const stream = fs.createReadStream(filePath)
      .pipe(parse(parseOptions))
      .on('data', (record) => records.push(record))
      .on('error', (error) => {
        throw error;
      });

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    return records;
  } catch (error) {
    logger.error('Failed to parse CSV file', { error, filePath });
    throw new Error('Failed to parse CSV file');
  }
}

private castCSVValue(value: string, context: { column: string }): string | number | boolean {
  const booleanColumns = ['isVariable', 'isPrescription', 'isActive'];
  const numberColumns = ['costPrice', 'sellingPrice', 'stock'];

  if (booleanColumns.includes(context.column)) {
    return value.toLowerCase() === 'true';
  }

  if (numberColumns.includes(context.column)) {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  return value;
}

private async processImportBatch(
  actorId: string,
  tenantId: string,
  batch: any[],
  startRow: number,
): Promise<{ success: number; errors: Array<{ row: number; error: string }> }> {
  const errors: Array<{ row: number; error: string }> = [];
  let successCount = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const rowNumber = startRow + i;

      try {
        // Validate and transform row data
        const productData = this.transformCSVRow(row);

        // Create product
        const product = await this.createProductFromImport(
          tx,
          actorId,
          tenantId,
          productData.product,
          rowNumber
        );

        // Create variants if needed
        if (productData.product.isVariable && productData.variants) {
          await this.createVariantsFromImport(
            tx,
            actorId,
            tenantId,
            product.id,
            productData.variants,
            rowNumber
          );
        }

        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        logger.error(`Error processing row ${rowNumber}`, error);
      }
    }
  });

  return { success: successCount, errors };
}

private transformCSVRow(row: any): {
  product: CreateGlobalProductDto;
  variants?: Array<any>;
} {
  // Basic validation
  if (!row.sku || !row.name) {
    throw new Error('Missing required fields: sku and name are required');
  }

  const productData: CreateGlobalProductDto = {
    sku: row.sku,
    name: row.name,
    globalCategoryId: row.globalCategoryId,
    barcode: row.barcode,
    imageUrl: row.imageUrl,
    brand: row.brand,
    dosageForm: row.dosageForm,
    description: row.description,
    isPrescription: row.isPrescription === true,
    isVariable: row.isVariable === true,
    isActive: row.isActive !== false,
    ...(!row.isVariable && {
      costPrice: parseFloat(row.costPrice),
      sellingPrice: parseFloat(row.sellingPrice)
    })
  };

  let variants: Array<CreateGlobalProductVariantDto> | undefined;

  if (row.isVariable) {
    if (!row.variants) {
      throw new Error('Variable products must have variants');
    }

    try {
      variants = JSON.parse(row.variants);
    } catch (e) {
      throw new Error('Invalid variants format. Expected JSON string');
    }

    if (!Array.isArray(variants)) {
      throw new Error('Variants must be an array');
    }
  }

  return { product: productData, variants };
}
private async createProductFromImport(
  tx: Prisma.TransactionClient,
  actorId: string,
  tenantId: string,
  productData: CreateGlobalProductDto,
  rowNumber: number
): Promise<{ id: string }> {
  try {
    // Validate with Zod schema
    const validatedData = createGlobalProductSchema.parse({
      ...productData,
      // Ensure proper decimal handling for prices
      ...(!productData.isVariable && {
        costPrice: new Prisma.Decimal(productData.costPrice || 0),
        sellingPrice: new Prisma.Decimal(productData.sellingPrice || 0)
      })
    });

    // Check for existing product
    const existing = await tx.globalProduct.findUnique({
      where: { sku: validatedData.sku },
      select: { id: true }
    });

    if (existing) {
      throw new Error(`Product with SKU ${validatedData.sku} already exists`);
    }

    // Prepare create data with proper Prisma types
    const createData: Prisma.GlobalProductCreateInput = {
      sku: validatedData.sku,
      name: validatedData.name,
      isVariable: validatedData.isVariable ?? false,
      isPrescription: validatedData.isPrescription ?? false,
      isActive: validatedData.isActive ?? true,
      ...(validatedData.barcode && { barcode: validatedData.barcode }),
      ...(validatedData.imageUrl && { imageUrl: validatedData.imageUrl }),
      ...(validatedData.brand && { brand: validatedData.brand }),
      ...(validatedData.dosageForm && { dosageForm: validatedData.dosageForm }),
      ...(validatedData.description && { description: validatedData.description }),
      ...(!validatedData.isVariable && {
        costPrice: new Prisma.Decimal(validatedData.costPrice || 0),
        sellingPrice: new Prisma.Decimal(validatedData.sellingPrice || 0)
      }),
      ...(validatedData.globalCategoryId && {
        category: { connect: { id: validatedData.globalCategoryId } }
      })
    };

    // Create product
    const product = await tx.globalProduct.create({
      data: createData,
      select: { id: true }
    });

    // Audit log
    await auditService.log({
      tenantId,
      userId: actorId,
      module: "global_product",
      action: "create",
      entityId: product.id,
      details: {
        sku: validatedData.sku,
        name: validatedData.name,
        isVariable: validatedData.isVariable
      },
    });

    return product;
  } catch (error) {
    logger.error(`Error creating product from row ${rowNumber}`, error);
    throw new Error(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Failed to create product'}`);
  }
}

private async createVariantsFromImport(
  tx: Prisma.TransactionClient,
  actorId: string,
  tenantId: string,
  productId: string,
  variants: Array<CreateGlobalProductVariantDto>,
  rowNumber: number
): Promise<void> {
  for (const [index, variantData] of variants.entries()) {
    try {
      // Validate with Zod schema
      const validatedVariant = createGlobalVariantSchema.parse({
        ...variantData,
        costPrice: new Prisma.Decimal(variantData.costPrice),
        sellingPrice: new Prisma.Decimal(variantData.sellingPrice),
        globalProductId: productId
      });

      // Check for existing variant
      const existing = await tx.globalVariant.findFirst({
        where: {
          sku: validatedVariant.sku,
          globalProductId: productId
        }
      });

      if (existing) {
        throw new Error(`Variant SKU ${validatedVariant.sku} already exists`);
      }

      // Verify variant attributes exist
      const attributeIds = validatedVariant.variantAttributes.map(attr => attr.id);
      const existingAttributes = await tx.variantAttributes.findMany({
        where: { id: { in: attributeIds } },
        select: { id: true }
      });

      if (existingAttributes.length !== attributeIds.length) {
        const missingIds = attributeIds.filter(
          id => !existingAttributes.some(attr => attr.id === id)
        );
        throw new Error(`Missing variant attributes: ${missingIds.join(', ')}`);
      }

      // Create variant
      const variant = await tx.globalVariant.create({
        data: {
          name: validatedVariant.name,
          sku: validatedVariant.sku,
          costPrice: validatedVariant.costPrice,
          sellingPrice: validatedVariant.sellingPrice,
          ...(validatedVariant.imageUrl && { imageUrl: validatedVariant.imageUrl }),
          ...(validatedVariant.stock && { stock: validatedVariant.stock }),
          product: { connect: { id: productId } },
          variantAttributes: {
            connect: validatedVariant.variantAttributes.map(attr => ({ id: attr.id }))
          }
        },
        include: {
          variantAttributes: true
        }
      });

      // Audit log
      await auditService.log({
        tenantId,
        userId: actorId,
        module: "global_variant",
        action: "create",
        entityId: variant.id,
        details: {
          productId,
          sku: variant.sku,
          attributes: variant.variantAttributes.map(attr => attr.id)
        },
      });

    } catch (error) {
      logger.error(`Error creating variant ${index + 1} from row ${rowNumber}`, error);
      throw new Error(`Row ${rowNumber}, Variant ${index + 1}: ${error instanceof Error ? error.message : 'Failed to create variant'}`);
    }
  }
}
}

export const globalProductService = new GlobalProductService();
