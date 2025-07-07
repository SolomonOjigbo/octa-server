// src/modules/supplier/controllers/productSupplier.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { productSupplierService } from '../services/productSupplier.service';
import { createProductSupplierSchema, updateProductSupplierSchema } from '../validations';
import { auditService } from '@modules/audit/types/audit.service';
import { eventEmitter } from '@events/event.emitter';
import { CreateProductSupplierDto } from '../types/supplier.dto';


export class ProductSupplierController {
  linkProduct = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId, userId = req.user!.id;
    const dto = { ...createProductSupplierSchema.parse(req.body), tenantId } as CreateProductSupplierDto;
    const ps = await productSupplierService.linkProductToSupplier(dto);

    await auditService.log({ tenantId, userId, action:'PRODUCT_SUPPLIER_LINKED', entityType:'ProductSupplier', entityId:ps.id, metadata:dto });
    eventEmitter.emit('productSupplier:linked', ps);

    res.status(201).json(ps);
  });

  updateLink = asyncHandler(async (req, res) => {
    const dto = updateProductSupplierSchema.parse(req.body);
    const ps = await productSupplierService.updateLink(req.params.id, dto);
    res.json(ps);
  });

  unlinkProduct = asyncHandler(async (req, res) => {
    await productSupplierService.unlinkProduct(req.params.id);
    res.status(204).send();
  });

  getLinksForProduct = asyncHandler(async (req, res) => {
    res.json(await productSupplierService.getLinksForProduct(req.params.productId, req.user!.tenantId));
  });
}

export const productSupplierController = new ProductSupplierController();
