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
  create = asyncHandler(async (req:Request, res: Response) => {
    try {
      
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const dto = { tenantId, ...TenantCategorySchema.parse(req.body) } as CreateTenantCategoryDto;
      const cat = await tenantCategoryService.createCategory(userId, dto);
      res.status(201).json(cat);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  list = asyncHandler(async (req:Request, res:Response) => {
    try {
      
      const cats = await tenantCategoryService.getCategories(req.user!.tenantId);
      res.status(200).json(cats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  getById = async(req:Request, res:Response) => {
    const cat = await tenantCategoryService.getCategoryById(req.params.id);
    if (!cat) return res.sendStatus(404);
    res.json(cat);
  };

  update = asyncHandler(async (req: Request, res: Response) => {
    try {
      
      const userId = req.user!.id;
      const dto = TenantCategorySchema.partial().parse(req.body) as UpdateTenantCategoryDto;
      res.json(await tenantCategoryService.updateCategory(req.params.id, dto, userId));
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  delete = asyncHandler(async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      await tenantCategoryService.deleteCategory(req.params.id, tenantId, userId);
      res.sendStatus(204);
      
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
}
export const tenantCategoryController = new TenantCategoryController();
