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
  create = asyncHandler(async (req: Request,res: Response) => {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const dto = GlobalProductSchema.parse(req.body) as CreateGlobalProductDto;
    const p = await globalProductService.createGlobalProduct(userId, tenantId, dto);
    res.status(201).json(p);
  });
  /** @swagger /global-products/category/{categoryId} get */
  // listByCategory = asyncHandler(async (req,res) => {
  //   res.json(await globalProductService.(req.params.categoryId));
  // });
  
  /** @swagger /global-products/{id} get */
async getById(req:Request, res:Response) {
    const p = await globalProductService.getGlobalProductById(req.params.id);
    if (!p) return res.sendStatus(404);
    res.json(p);
  };

  /** @swagger /global-products/{id} patch */
  update = asyncHandler(async (req,res) => {
    const id = req.params.id;
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const dto = GlobalProductSchema.partial().parse(req.body) as UpdateGlobalProductDto;
    res.json(await globalProductService.updateGlobalProduct(id, tenantId, dto));
  });
  /** @swagger /global-products/{id} delete */
  delete = asyncHandler(async (req,res) => {
    const userId = req.user!.id;
    const id = req.params.id;
    const tenantId = req.user!.tenantId;
    await globalProductService.deleteGlobalProduct(id, tenantId);
    res.sendStatus(204);
  });
}
export const globalProductController = new GlobalProductController();
