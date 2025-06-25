import { Request, Response } from "express";
import { businessEntityService } from "../services/businessEntity.service";
import { createBusinessEntitySchema } from "../validations";
import { BusinessEntityDto } from "../types/businessEntity.dto";

export class BusinessEntityController {
  async createEntity(req: Request, res: Response) {
    try {
      const validated = createBusinessEntitySchema.parse(req.body) as BusinessEntityDto;
      const entity = await businessEntityService.createEntity(validated);
      res.status(201).json(entity);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
  async getEntities(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const entities = await businessEntityService.getEntities(tenantId);
    res.json(entities);
  }
  async getEntityById(req: Request, res: Response) {
    const { id } = req.params;
    const entity = await businessEntityService.getEntityById(id);
    if (!entity) return res.status(404).json({ message: "Not found" });
    res.json(entity);
  }
  async updateEntity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = createBusinessEntitySchema.partial().parse(req.body);
      const entity = await businessEntityService.updateEntity(id, validated);
      res.json(entity);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
  async deleteEntity(req: Request, res: Response) {
    const { id } = req.params;
    const result = await businessEntityService.deleteEntity(id);
    if (result.count === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  }
}
export const businessEntityController = new BusinessEntityController();



















// export const createEntity = async (req: Request, res: Response) => {
//   try {
//     const entity = await entityService.createEntity(req.body);
//     res.status(201).json(entity);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getEntityById = async (req: Request, res: Response) => {
//   try {
//     const entity = await entityService.getEntityById(req.params.id);
//     if (!entity) return res.status(404).json({ error: "Entity not found" });
//     res.json(entity);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const updateEntity = async (req: Request, res: Response) => {
//   try {
//     const entity = await entityService.updateEntity(req.params.id, req.body);
//     res.json(entity);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const deleteEntity = async (req:                                                                                                   Request, res: Response) => {
//   try {
//     await entityService.deleteEntity(req.params.id);
//     res.status(204).send();
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const listEntitiesByTenant = async (req: Request, res: Response) => {
//   try {
//     const entities = await entityService.listEntitiesByTenant(req.params.tenantId);
//     res.json(entities);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };
