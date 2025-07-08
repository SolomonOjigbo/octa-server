import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { tenantVariantService } from '../services/tenantVariant.service';
import { TenantVariantSchema } from '../validations';
import { CreateTenantProductVariantDto, UpdateTenantProductVariantDto } from '../types/tenantCatalog.dto';

/**
 * @swagger
 * tags: [TenantCatalog]
 */
export class TenantVariantController {
  create = asyncHandler(async (req,res) => {
    const dto = TenantVariantSchema.parse(req.body) as CreateTenantProductVariantDto;
    const v = await tenantVariantService.create(dto);
    res.status(201).json(v);
  });
  listByProduct = asyncHandler(async (req,res) => {
    res.json(await tenantVariantService.listByProduct(req.params.tenantProductId));
  });
  update = asyncHandler(async (req,res) => {
    const dto = TenantVariantSchema.partial().parse(req.body) as UpdateTenantProductVariantDto;
    res.json(await tenantVariantService.update(req.params.id, dto));
  });
  delete = asyncHandler(async (req,res) => {
    await tenantVariantService.delete(req.params.id);
    res.sendStatus(204);
  });
}
export const tenantVariantController = new TenantVariantController();
