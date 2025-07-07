import { Request, Response } from "express";

import { 
  createProductCategorySchema,
  updateProductCategorySchema,
} from "../validations";
import { 
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from "../types/product.dto";
import { auditService } from "../../audit/types/audit.service";
import { AuditAction } from "../../audit/types/audit.dto";
import { HttpStatusCode } from "@common/constants/http";
import { AppError } from "@common/constants/app.errors";
import { asyncHandler } from "@middleware/errorHandler";
import { categoryService} from "../services/category.service";

export class CategoryController {
  // ========== Product Category Endpoints ==========
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const validated = createProductCategorySchema.parse({
      ...req.body,
      tenantId: req.user?.tenantId
    }) as CreateProductCategoryDto;
    if (!req.user?.tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }
    const category = await categoryService.createCategory(validated, req.user?.id);

    await auditService.log({
      userId: req.user?.id,
      tenantId: validated.tenantId,
      action: AuditAction.PRODUCT_CATEGORY_CREATED,
      entityType: "ProductCategory",
      entityId: category.id,
      metadata: {
        name: category.name
      }
    });

    res.status(HttpStatusCode.CREATED).json(category);
  });

  getCategories = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    const { page, limit, search, withProducts } = req.query;
    const result = await categoryService.getCategories(tenantId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      withProducts: withProducts === 'true'
    });

    res.json(result);
  });

  getCategoryById = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }
    const category = await categoryService.getCategoryById(tenantId, id);
    if (!category) {
      throw new AppError("Category not found", HttpStatusCode.NOT_FOUND);
    }
    res.json(category);
  });

  updateCategory = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    const validated = updateProductCategorySchema.parse({
      ...req.body,
      id,
      tenantId
    }) as UpdateProductCategoryDto;
    
    const category = await categoryService.updateCategory(
      tenantId,
      id,
      validated,
      req.user?.id
    );

    await auditService.log({
      userId: req.user?.id,
      tenantId,
      action: AuditAction.PRODUCT_CATEGORY_UPDATED,
      entityType: "ProductCategory",
      entityId: id,
      metadata: {
        changes: req.body
      }
    });

    res.json(category);
  });

  deleteCategory = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    await categoryService.deleteCategory(tenantId, id);

    await auditService.log({
      userId: req.user?.id,
      tenantId,
      action: AuditAction.PRODUCT_CATEGORY_DELETED,
      entityType: "ProductCategory",
      entityId: id
    });

    res.status(HttpStatusCode.NO_CONTENT).send();
  });

  getCategoriesByStore = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const storeId = req.user?.storeId;
    if (!tenantId || !storeId) {
      throw new AppError("Tenant and store context are required", HttpStatusCode.BAD_REQUEST);
    }
    const { page, limit, search } = req.query;
    const result = await categoryService.getCategoriesByStore(tenantId, storeId, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string
    });
    res.json(result);
  });

    // ========== End of Product Category Endpoints ==========
  
}

export const categoryController = new CategoryController();