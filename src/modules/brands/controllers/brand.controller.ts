// src/modules/brand/controllers/brand.controller.ts
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { CreateBrandSchema, UpdateBrandSchema } from "../validations";
import { brandService } from "../services/brand.service";

export const brandController = {
  list: asyncHandler(async (_: Request, res: Response) => {
    const brands = await brandService.list();
    res.json(brands);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const brand = await brandService.getById(req.params.id);
    res.json(brand);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateBrandSchema.parse(req.body);
    const tenantId = req.user.tenantId; // Assuming tenantId is set in the request context
    const brand = await brandService.create(dto, tenantId);
    res.status(201).json(brand);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const dto = UpdateBrandSchema.parse(req.body);
     const tenantId = req.user.tenantId; 
    const brand = await brandService.update(req.params.id, dto, tenantId);
    res.json(brand);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await brandService.delete(req.params.id, req.user.tenantId);
    res.sendStatus(204);
  }),

  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    const brand = await brandService.toggleStatus(req.params.id);
    res.json(brand);
  }),
};