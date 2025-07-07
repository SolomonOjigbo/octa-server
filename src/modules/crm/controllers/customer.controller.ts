// src/modules/crm/controllers/customer.controller.ts

import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { customerService } from '../services/customer.service';
import { createCustomerSchema, updateCustomerSchema } from '../validations';
import { CreateCustomerDto, UpdateCustomerDto } from '../types/crm.dto';
import { AuditLogCreateParams } from '@modules/audit/types/audit.dto';
import { auditService } from '@modules/audit/types/audit.service';
import { eventEmitter } from '@events/event.emitter';

export class CustomerController {
  createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const validated = createCustomerSchema.parse(req.body) as CreateCustomerDto;
    const dto = { ...validated, tenantId };
    const customer = await customerService.createCustomer(dto);

    // Audit & Event
    await auditService.log<Partial<CreateCustomerDto>>({
      tenantId, userId,
      action: 'CUSTOMER_CREATED', entityType: 'Customer', entityId: customer.id,
      metadata: dto
    });
    eventEmitter.emit('customer:created', customer);

    res.status(201).json(customer);
  });

  getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const tenants = req.user!.tenantId;
    const customers = await customerService.getCustomers(tenants);
    res.json(customers);
  });

 async  getCustomerById (req: Request, res: Response) {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Not found' });
    res.json(customer);
  };

  updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const validated = updateCustomerSchema.parse(req.body) as UpdateCustomerDto;
    const customer = await customerService.updateCustomer(req.params.id, validated);

    await auditService.log<Partial<UpdateCustomerDto>>({
      tenantId: customer.tenantId, userId,
      action: 'CUSTOMER_UPDATED', entityType: 'Customer', entityId: customer.id,
      metadata: validated
    });
    eventEmitter.emit('customer:updated', customer);

    res.json(customer);
  });

  deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await customerService.deleteCustomer(req.params.id);
    await auditService.log({ 
      tenantId: deleted.tenantId, userId: req.user!.id,
      action: 'CUSTOMER_DELETED', entityType: 'Customer', entityId: deleted.id
    });
    eventEmitter.emit('customer:deleted', deleted);
    res.status(204).send();
  });
}

export const customerController = new CustomerController();
