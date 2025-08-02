// src/modules/variantAttribute/controllers/variantAttribute.controller.ts
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import {
  CreateVariantAttributeSchema,
  UpdateVariantAttributeSchema,
} from "../validations";
import { variantAttributeService } from "../services/variantAttribute.service";

export const variantAttributeController = {
  list: asyncHandler(async (_: Request, res: Response) => {
    const attributes = await variantAttributeService.list();
    res.json(attributes);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const attribute = await variantAttributeService.getById(req.params.id);
    res.json(attribute);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateVariantAttributeSchema.parse(req.body);
    const tenantId = req.user.tenantId; // Assuming tenantId is set in the request context
    const attribute = await variantAttributeService.create(dto, tenantId);
    res.status(201).json(attribute);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const dto = UpdateVariantAttributeSchema.parse(req.body);
    const tenantId = req.user.tenantId; // Assuming tenantId is set in the request context
    const attribute = await variantAttributeService.update(req.params.id, dto, tenantId);
    res.json(attribute);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await variantAttributeService.delete(req.params.id, req.user.tenantId);
    res.sendStatus(204);
  }),

  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    const attribute = await variantAttributeService.toggleStatus(req.params.id);
    res.json(attribute);
  }),
};