import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { globalCategoryService } from '../services/globalCategory.service';
import { CreateGlobalCategoryDto, UpdateGlobalCategoryDto } from '../types/globalCatalog.dto';
import { createGlobalCategorySchema, updateGlobalCategorySchema } from '../validations';

/**
 * @swagger
 * tags: [GlobalCatalog]
 */
export class GlobalCategoryController {
  /** @swagger /global-categories post */
  create = asyncHandler(async (req:Request, res:Response) => {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const dto = createGlobalCategorySchema.parse(req.body) as CreateGlobalCategoryDto;
    const cat = await globalCategoryService.create(tenantId, userId, dto);
    res.status(201).json(cat);
  });
  /** @swagger /global-categories get */
  list = asyncHandler(async (req:Request, res:Response) => {
    try {
     res.json(await globalCategoryService.list());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  /** @swagger /global-categories/{id} get */
  async getById(req:Request, res: Response){
    const cat = await globalCategoryService.detail(req.params.id);
    if (!cat) return res.sendStatus(404);
    res.json(cat);
  };
  /** @swagger /global-categories/{id} patch */
  update = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const dto = updateGlobalCategorySchema.partial().parse(req.body) as UpdateGlobalCategoryDto;
    res.json(await globalCategoryService.update(tenantId, userId, id, dto));
  });
  /** @swagger /global-categories/{id} delete */
  delete = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    await globalCategoryService.delete(id, tenantId, userId);
    res.sendStatus(204);
  });
}
export const globalCategoryController = new GlobalCategoryController();
