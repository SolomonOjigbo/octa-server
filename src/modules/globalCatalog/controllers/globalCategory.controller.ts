import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { globalCategoryService } from '../services/globalCategory.service';
import { GlobalCategorySchema } from '../validations';
import { CreateGlobalCategoryDto, UpdateGlobalCategoryDto } from '../types/globalCatalog.dto';

/**
 * @swagger
 * tags: [GlobalCatalog]
 */
export class GlobalCategoryController {
  /** @swagger /global-categories post */
  create = asyncHandler(async (req:Request, res:Response) => {
    const dto = GlobalCategorySchema.parse(req.body) as CreateGlobalCategoryDto;
    const cat = await globalCategoryService.create(dto);
    res.status(201).json(cat);
  });
  /** @swagger /global-categories get */
  list = asyncHandler(async (_:Request, res:Response) => {
    res.json(await globalCategoryService.list());
  });
  /** @swagger /global-categories/{id} get */
  async getById(req:Request, res: Response){
    const cat = await globalCategoryService.getById(req.params.id);
    if (!cat) return res.sendStatus(404);
    res.json(cat);
  };
  /** @swagger /global-categories/{id} patch */
  update = asyncHandler(async (req, res) => {
    const dto = GlobalCategorySchema.partial().parse(req.body) as UpdateGlobalCategoryDto;
    res.json(await globalCategoryService.update(req.params.id, dto));
  });
  /** @swagger /global-categories/{id} delete */
  delete = asyncHandler(async (req, res) => {
    await globalCategoryService.delete(req.params.id);
    res.sendStatus(204);
  });
}
export const globalCategoryController = new GlobalCategoryController();
