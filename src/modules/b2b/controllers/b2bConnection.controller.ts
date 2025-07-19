import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { b2bConnectionService } from '../services/b2bConnection.service';
import {
  createB2BConnectionSchema,
  connectionActionSchema,
} from '../validations';
import { CreateB2BConnectionDto } from '../types/b2bConnection.dto';

export class B2BConnectionController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const conns = await b2bConnectionService.list(tenantId);
    res.json(conns);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const conn = await b2bConnectionService.getById(tenantId, req.params.id);
    res.json(conn);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const tenantAId = req.user!.tenantId;
    const userId    = req.user!.id;
    const dto       = createB2BConnectionSchema.parse(req.body) as CreateB2BConnectionDto;
    const conn      = await b2bConnectionService.create(tenantAId, userId, dto);
    res.status(201).json(conn);
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const conn     = await b2bConnectionService.approve(tenantId, userId, req.params.id);
    res.json(conn);
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = connectionActionSchema.parse(req.body);
    const conn     = await b2bConnectionService.reject(tenantId, userId, req.params.id, dto);
    res.json(conn);
  });

  revoke = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const {reason}      = connectionActionSchema.parse(req.body);
    const conn     = await b2bConnectionService.revoke(tenantId, userId, req.params.id, reason);
    res.json(conn);
  });
}

export const b2bConnectionController = new B2BConnectionController();
