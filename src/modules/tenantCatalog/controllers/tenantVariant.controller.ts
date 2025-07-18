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
  create = asyncHandler(async (req: Request,res: Response) => {
    try {
      const userId = req.user!.id;
      const dto = TenantVariantSchema.parse(req.body) as CreateTenantProductVariantDto;
      const v = await tenantVariantService.createVariant(dto, userId);
      res.status(201).json(v);

    }catch (error) {
      res.status(400).json({ message: error.message });

    }
  });
  listByProduct = asyncHandler(async (req: Request,res: Response) => {
    try {
      const tenantProductId = req.params.tenantProductId;
      const variants = await tenantVariantService.getVariants(req.user.tenantId, tenantProductId);
      res.status(200).json(variants);
      
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  getById = asyncHandler(async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const variant = await tenantVariantService.getVariantById(id);
      if (!variant) {
        res.status(404).json({ message: 'Variant not found' });
      }
      res.json(variant);
      
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = req.user.tenantId;
      if(!tenantId){
        res.status(401).json({ message: 'Unauthorized' });
      } 
      const userId = req.user!.id;
      const id = req.params.id;
      const dto = TenantVariantSchema.partial().parse(req.body) as UpdateTenantProductVariantDto;
      res.json(await tenantVariantService.updateVariant(id,  dto, userId ));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  delete = asyncHandler(async (req: Request,res: Response) => {
    try {
      const tenantId = req.user!.tenantId
      if(!tenantId){
        res.status(401).json({ message: 'Unauthorized' });
      }
      const id = req.params.id;
      const userId = req.user!.id;
      await tenantVariantService.deleteVariant(id, userId);
      res.sendStatus(204);
      
    } catch (error) {
      
      res.status(400).json({ message: error.message });
    }
  });
}
export const tenantVariantController = new TenantVariantController();
