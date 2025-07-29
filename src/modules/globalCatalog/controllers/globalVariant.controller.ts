import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { globalVariantService } from '../services/globalVariant.service';
import { GlobalProductVariantSchema } from '../validations';
import { CreateGlobalProductVariantDto, UpdateGlobalProductVariantDto } from '../types/globalCatalog.dto';

/**
 * @swagger
 * tags: [GlobalCatalog]
 */
export class GlobalVariantController {
  /** @swagger /global-variants post */
  create = asyncHandler(async (req: Request,res: Response) => {
    try {
      const userId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const dto = GlobalProductVariantSchema.parse(req.body) as CreateGlobalProductVariantDto;
      const v = await globalVariantService.createGlobalProductVariant(tenantId, userId, dto);
      res.status(201).json(v);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  /** @swagger /global-variants/product/{globalProductId} get */
  listByProduct = asyncHandler(async (req:Request, res: Response) => {
    try {
      
      const globalProductId = req.params.globalProductId;
      const tenantId = req.user!.tenantId;
      res.json(await globalVariantService.getGlobalVariants(tenantId, globalProductId));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  /** @swagger /global-variants/{id} patch */
  update = asyncHandler(async (req: Request,res:Response) => {
    try {
      const dto = GlobalProductVariantSchema.partial().parse(req.body) as UpdateGlobalProductVariantDto;
      const id = req.params.id;
      const userId = req.user!.id;
      const tenantId = req.user.tenantId
      res.json(await globalVariantService.updateGlobalProductVariant(id, tenantId, userId, dto));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  /** @swagger /global-variants/{id} delete */
  delete = asyncHandler(async (req: Request,res: Response) => {
    try {
      const id = req.params.id;
      const userId = req.user!.id;
      const tenantId = req.user.tenantId;
      await globalVariantService.deleteGlobalVariant(id, userId, tenantId);
      res.sendStatus(204);
      
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
}
export const globalVariantController = new GlobalVariantController();
