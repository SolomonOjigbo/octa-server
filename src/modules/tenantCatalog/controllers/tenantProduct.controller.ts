import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { tenantProductService } from '../services/tenantProduct.service';
import { TenantProductSchema } from '../validations';
import { CreateTenantProductDto, UpdateTenantProductDto } from '../types/tenantCatalog.dto';

/**
 * @swagger
 * tags: [TenantCatalog]
 */
export class TenantProductController {
  create = asyncHandler(async (req, res) => {
    const dto = { tenantId: req.user!.tenantId, ...TenantProductSchema.parse(req.body) } as CreateTenantProductDto;
    const p = await tenantProductService.create(dto);
    res.status(201).json(p);
  });
  listByCategory = asyncHandler(async (req, res) => {
    res.json(await tenantProductService.listByCategory(req.user!.tenantId, req.query.categoryId as string));
  });
  getById = async (req, res) => {
    const p = await tenantProductService.getById(req.params.id);
    if (!p) return res.sendStatus(404);
    res.json(p);
  };
  update = asyncHandler(async (req, res) => {
    const dto = TenantProductSchema.partial().parse(req.body) as UpdateTenantProductDto;
    res.json(await tenantProductService.update(req.params.id, dto));
  });
  delete = asyncHandler(async (req, res) => {
    await tenantProductService.delete(req.params.id);
    res.sendStatus(204);
  });
}
export const tenantProductController = new TenantProductController();
