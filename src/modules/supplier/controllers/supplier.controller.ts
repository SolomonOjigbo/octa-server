// src/modules/supplier/controllers/supplier.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { supplierService } from '../services/supplier.service';
import { createSupplierSchema, updateSupplierSchema } from '../validations';
import { auditService } from '@modules/audit/services/audit.service';
import { eventEmitter } from '@events/event.emitter';
import { CreateSupplierDto } from '../types/supplier.dto';


export class SupplierController {
  createSupplier = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId, userId = req.user!.id;
    const dto = { ...createSupplierSchema.parse(req.body), tenantId } as CreateSupplierDto;
    const supplier = await supplierService.createSupplier(dto);

    await auditService.log({ tenantId, userId, action:'SUPPLIER_CREATED', entityType:'Supplier', entityId:supplier.id, metadata:dto });
    eventEmitter.emit('supplier:created', supplier);

    res.status(201).json(supplier);
  });

  getSuppliers = asyncHandler(async (req, res) => {
    res.json(await supplierService.getSuppliers(req.user!.tenantId));
  });

  updateSupplier = asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const dto = updateSupplierSchema.parse(req.body);
    const supplier = await supplierService.updateSupplier(req.params.id, dto);

    await auditService.log({ tenantId: supplier.tenantId, userId, action:'SUPPLIER_UPDATED', entityType:'Supplier', entityId:supplier.id, metadata:dto });
    eventEmitter.emit('supplier:updated', supplier);

    res.json(supplier);
  });

  deleteSupplier = asyncHandler(async (req, res) => {
    const deleted = await supplierService.deleteSupplier(req.params.id);
    await auditService.log({ tenantId: deleted.tenantId, userId:req.user!.id, action:'SUPPLIER_DELETED', entityType:'Supplier', entityId:deleted.id });
    eventEmitter.emit('supplier:deleted', deleted);
    res.status(204).send();
  });
}

export const supplierController = new SupplierController();
