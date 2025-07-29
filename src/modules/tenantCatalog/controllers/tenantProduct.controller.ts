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
  create = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id
      const dto = TenantProductSchema.parse(req.body) as CreateTenantProductDto;
      const tenantId = req.user!.tenantId;
      const p = await tenantProductService.createProduct(userId, tenantId, dto, );
      res.status(201).json(p);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  getProducts = asyncHandler(async (req: Request, res:Response) => {
    res.json(await tenantProductService.getProducts(req.user!.tenantId));
  });
  getById = async (req: Request, res: Response) => {
    const p = await tenantProductService.getProductById(req.params.id);
    if (!p) return res.sendStatus(404);
    res.json(p);
  };
  update = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const id = req.params?.id;
      const tenantId = user?.tenantId;
      const dto = TenantProductSchema.parse(req.body) as UpdateTenantProductDto;
      res.json(await tenantProductService.updateProduct( id, user.id, tenantId, dto));
      
    } catch (error) {
      res.status(400).json({ error: error.message });
      
    }
  });
  delete = asyncHandler(async (req: Request, res: Response) => {
    try {
      
      const user = req.user!;
      const id = req.params.id
      await tenantProductService.deleteProduct(id, user.tenantId, user.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}
export const tenantProductController = new TenantProductController();
