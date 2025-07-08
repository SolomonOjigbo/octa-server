import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { tenantCategoryService } from '../services/tenantCategory.service';
import { TenantCategorySchema } from '../validations';
import { CreateTenantCategoryDto, UpdateTenantCategoryDto } from '../types/tenantCatalog.dto';

/**
 * @swagger
 * tags: [TenantCatalog]
 */
export class TenantCategoryController {
  create = asyncHandler(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const dto = { tenantId, ...TenantCategorySchema.parse(req.body) } as CreateTenantCategoryDto;
    const cat = await tenantCategoryService.create(dto);
    res.status(201).json(cat);
  });
  list = asyncHandler(async (req, res) => {
    res.json(await tenantCategoryService.list(req.user!.tenantId));
  });
  
  getById = async(req:Request, res:Response) => {
    const cat = await tenantCategoryService.getById(req.params.id);
    if (!cat) return res.sendStatus(404);
    res.json(cat);
  };

  update = asyncHandler(async (req, res) => {
    const dto = TenantCategorySchema.partial().parse(req.body) as UpdateTenantCategoryDto;
    res.json(await tenantCategoryService.update(req.params.id, dto));
  });
  delete = asyncHandler(async (req, res) => {
    await tenantCategoryService.delete(req.params.id);
    res.sendStatus(204);
  });
}
export const tenantCategoryController = new TenantCategoryController();
