import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { 
  createProductSchema,
  updateProductSchema,
} from "../validations";
import { 
  CreateProductDto,
  UpdateProductDto,
} from "../types/product.dto";
import { auditService } from "../../audit/services/audit.service";
import { AuditAction } from "../../audit/types/audit.dto";
import { HttpStatusCode } from "@common/constants/http";
import { AppError } from "@common/constants/app.errors";
import { asyncHandler } from "@middleware/errorHandler";

// ========== Product CRUD Endpoints ==========
export class ProductController {
  createProduct = asyncHandler(async (req, res) => {
    const validated = createProductSchema.parse({
      ...req.body,
      tenantId: req.user?.tenantId
    }) as CreateProductDto;
    
    const product = await productService.createProduct(
      validated,
      req.user?.id
    );

    await auditService.log({
      userId: req.user?.id,
      tenantId: validated.tenantId,
      action: AuditAction.PRODUCT_CREATED,
      entityType: "Product",
      entityId: product.id,
      metadata: {
        name: product.name,
        sku: product.sku
      }
    });

    res.status(HttpStatusCode.CREATED).json(product);
  });

  getProducts = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    const { 
      page, 
      limit, 
      search, 
      categoryId,
      sku,
      barcode,
      isActive,
      minPrice,
      maxPrice,
      locationType,
      locationId,
      withStock,
      withSuppliers,
      withInventory
    } = req.query;

    const result = await productService.getProducts(tenantId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      categoryId: categoryId as string,
      sku: sku as string,
      barcode: barcode as string,
      isActive: isActive ? isActive === 'true' : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      locationType: locationType as 'store' | 'warehouse',
      locationId: locationId as string,
      // withStock: withStock === 'true',
      // withSuppliers: withSuppliers === 'true',
      // withInventory: withInventory === 'true'
    });

    res.json(result);
  });

  getProductById = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    const { withStock, withSuppliers, withInventory } = req.query;
    const product = await productService.getProductById(tenantId, id, {
      withStock: withStock === 'true',
      withSuppliers: withSuppliers === 'true',
      withInventory: withInventory === 'true'
    });

    if (!product) {
      throw new AppError("Product not found", HttpStatusCode.NOT_FOUND);
    }

    res.json(product);
  });

  updateProduct = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    const validated = updateProductSchema.parse({
      ...req.body,
      id,
      tenantId
    }) as UpdateProductDto;
    
    const product = await productService.updateProduct(
      tenantId,
      id,
      validated,
      req.user?.id
    );
    
    if (!product) throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);


    await auditService.log({
      userId: req.user?.id,
      tenantId,
      action: AuditAction.PRODUCT_UPDATED,
      entityType: "Product",
      entityId: id,
      metadata: {
        changes: req.body
      }
    });

    res.json(product);
  });

  deleteProduct = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    await productService.deleteProduct(tenantId, id);

    await auditService.log({
      userId: req.user?.id,
      tenantId,
      action: AuditAction.PRODUCT_DELETED,
      entityType: "Product",
      entityId: id
    });

    res.status(HttpStatusCode.NO_CONTENT).send();
  });

  // ========== Batch Operations ==========
  importProducts = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    if (!Array.isArray(req.body)) {
      throw new AppError("Request body must be an array of products", HttpStatusCode.BAD_REQUEST);
    }

    const result = await productService.importProducts(
      tenantId,
      req.body,
      req.user?.id
    );

    await auditService.log({
      userId: req.user?.id,
      tenantId,
      action: AuditAction.PRODUCTS_IMPORTED,
      entityType: "Product",
      metadata: {
        importedCount: result.success.length,
        errorCount: result.errors.length
      },
      entityId: ""
    });

    res.status(HttpStatusCode.CREATED).json(result);
  });

  exportProducts = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    const { format, includeStock, includeVariants } = req.query;
    const result = await productService.exportProducts(tenantId, {
      format: format as 'csv' | 'json',
      includeStock: includeStock === 'true',
      includeVariants: includeVariants === 'true'
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products_export.csv');
      return res.send(result);
    }

    res.json(result);
  });

  // ========== Search & Lookup Endpoints ==========
  searchProducts = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { q } = req.query;
    
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    if (!q) {
      throw new AppError("Search query is required", HttpStatusCode.BAD_REQUEST);
    }

    const { 
      limit,
      fields,
      withStock,
      locationType,
      locationId
    } = req.query;

    const products = await productService.getProducts(tenantId, {
      search: q as string,
      limit: limit ? parseInt(limit as string) : 10,
      // withStock: withStock === 'true',
      locationType: locationType as 'store' | 'warehouse',
      locationId: locationId as string
    });

    res.json(products);
  });



  getProductsByWarehouse = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { warehouseId } = req.params;
    
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    const { withStock, withSuppliers, withInventory } = req.query;
    const products = await productService.getProducts(tenantId, {
      locationType: 'warehouse',
      locationId: warehouseId,
      // withStock: withStock === 'true',
      // withSuppliers: withSuppliers === 'true',
      // withInventory: withInventory === 'true'
    });

    res.json(products);
  });

  getProductsByStore = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { storeId } = req.params;
    
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    const { withStock, withSuppliers, withInventory } = req.query;
    const products = await productService.getProducts(tenantId, {
      locationType: 'store',
      locationId: storeId,
      // withStock: withStock === 'true',
      // withSuppliers: withSuppliers === 'true',
      // withInventory: withInventory === 'true'
    });

    res.json(products);
  });


}

export const productController = new ProductController();