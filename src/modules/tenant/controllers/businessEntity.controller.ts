import { Request, Response } from "express";
import { BusinessEntityService } from "../services/businessEntity.service";

const entityService = new BusinessEntityService();

export const createEntity = async (req: Request, res: Response) => {
  try {
    const entity = await entityService.createEntity(req.body);
    res.status(201).json(entity);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getEntityById = async (req: Request, res: Response) => {
  try {
    const entity = await entityService.getEntityById(req.params.id);
    if (!entity) return res.status(404).json({ error: "Entity not found" });
    res.json(entity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEntity = async (req: Request, res: Response) => {
  try {
    const entity = await entityService.updateEntity(req.params.id, req.body);
    res.json(entity);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteEntity = async (req: Request, res: Response) => {
  try {
    await entityService.deleteEntity(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listEntitiesByTenant = async (req: Request, res: Response) => {
  try {
    const entities = await entityService.listEntitiesByTenant(req.params.tenantId);
    res.json(entities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
