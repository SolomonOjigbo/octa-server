
import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { 
  createProductVariantSchema,
  updateProductVariantSchema
} from "../validations";
import { 
  CreateProductVariantDto,
  UpdateProductVariantDto
} from "../types/product.dto";
import { auditService } from "../../audit/types/audit.service";
import { AuditAction } from "../../audit/types/audit.dto";
import { HttpStatusCode } from "@common/constants/http";
import { AppError } from "@common/constants/app.errors";
import { asyncHandler } from "@middleware/errorHandler";


export class ProductVariantController {
  // ========== Product Variant Endpoints ==========
  createVariant = asyncHandler(async (req, res) => {
    const validated = createProductVariantSchema.parse({
      ...req.body,
      tenantId: req.user?.tenantId
    }) as CreateProductVariantDto;
    
    const variant = await productService.createVariant(
      validated,
      req.user?.id
    );

    await auditService.log({
      userId: req.user?.id,
      tenantId: validated.tenantId,
      action: AuditAction.PRODUCT_VARIANT_CREATED,
      entityType: "ProductVariant",
      entityId: variant.id,
      metadata: {
        productId: validated.productId,
        name: variant.name
      }
    });

    res.status(HttpStatusCode.CREATED).json(variant);
  });

  getVariants = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { productId } = req.query;
    
    if (!tenantId) {
      throw new AppError("Tenant context is required", HttpStatusCode.BAD_REQUEST);
    }

    const variants = await productService.getVariants(
      tenantId,
      productId as string | undefined
    );

    res.json(variants);
  });

  updateVariant = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    const validated = updateProductVariantSchema.parse({
      ...req.body,
      id,
      tenantId
    }) as UpdateProductVariantDto;
    
    const variant = await productService.updateVariant(
      tenantId,
      id,
      validated,
      req.user?.id
    );

    await auditService.log({
      userId: req.user?.id,
      tenantId,
      action: AuditAction.PRODUCT_VARIANT_UPDATED,
      entityType: "ProductVariant",
      entityId: id,
      metadata: {
        changes: req.body
      }
    });

    res.json(variant);
  });

  deleteVariant = asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    
    await productService.deleteVariant(tenantId, id);

    await auditService.log({
      userId: req.user?.id,
      tenantId,
      action: AuditAction.PRODUCT_VARIANT_DELETED,
      entityType: "ProductVariant",
      entityId: id
    });

    res.status(HttpStatusCode.NO_CONTENT).send();
  });
}

export const productVariantController = new ProductVariantController();