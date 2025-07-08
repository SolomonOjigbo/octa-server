import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { globalProductService } from '../services/globalProduct.service';
import { GlobalProductSchema } from '../validations';
import { CreateGlobalProductDto, UpdateGlobalProductDto } from '../types/globalCatalog.dto';

/**
 * @swagger
 * tags: [GlobalCatalog]
 */
export class GlobalProductController {
  /** @swagger /global-products post */
  create = asyncHandler(async (req,res) => {
    const dto = GlobalProductSchema.parse(req.body) as CreateGlobalProductDto;
    const p = await globalProductService.create(dto);
    res.status(201).json(p);
  });
  /** @swagger /global-products/category/{categoryId} get */
  listByCategory = asyncHandler(async (req,res) => {
    res.json(await globalProductService.listByCategory(req.params.categoryId));
  });
  
  /** @swagger /global-products/{id} get */
async getById(req:Request, res:Response) {
    const p = await globalProductService.getById(req.params.id);
    if (!p) return res.sendStatus(404);
    res.json(p);
  };

  /** @swagger /global-products/{id} patch */
  update = asyncHandler(async (req,res) => {
    const dto = GlobalProductSchema.partial().parse(req.body) as UpdateGlobalProductDto;
    res.json(await globalProductService.update(req.params.id, dto));
  });
  /** @swagger /global-products/{id} delete */
  delete = asyncHandler(async (req,res) => {
    await globalProductService.delete(req.params.id);
    res.sendStatus(204);
  });
}
export const globalProductController = new GlobalProductController();
