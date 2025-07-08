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
  create = asyncHandler(async (req,res) => {
    const dto = GlobalProductVariantSchema.parse(req.body) as CreateGlobalProductVariantDto;
    const v = await globalVariantService.create(dto);
    res.status(201).json(v);
  });
  /** @swagger /global-variants/product/{globalProductId} get */
  listByProduct = asyncHandler(async (req,res) => {
    res.json(await globalVariantService.listByProduct(req.params.globalProductId));
  });
  /** @swagger /global-variants/{id} patch */
  update = asyncHandler(async (req,res) => {
    const dto = GlobalProductVariantSchema.partial().parse(req.body) as UpdateGlobalProductVariantDto;
    res.json(await globalVariantService.update(req.params.id, dto));
  });
  /** @swagger /global-variants/{id} delete */
  delete = asyncHandler(async (req,res) => {
    await globalVariantService.delete(req.params.id);
    res.sendStatus(204);
  });
}
export const globalVariantController = new GlobalVariantController();
