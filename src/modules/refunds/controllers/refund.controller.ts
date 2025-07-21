import { Request, Response, NextFunction } from 'express';
import { CreateRefundDto } from '../types/refund.dto';
import { refundService } from '../services/refund.service'; // assumes you have this
import { CreateRefundDtoSchema } from '../validations';

export const createRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dto = CreateRefundDtoSchema.parse(req.body);
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const refund = await refundService.createRefund(
      tenantId,
      userId,
      dto,
    );

    res.status(201).json(refund);
  } catch (err) {
    next(err);
  }
};

export const getRefundById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const refund = await refundService.getRefundById(tenantId, id);
    res.json(refund);
  } catch (err) {
    next(err);
  }
};

export const listRefunds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user.tenantId;
    const { transactionId, purchaseOrderId } = req.query;
    const refunds = await refundService.listRefunds(tenantId,{
      transactionId: transactionId as string,
      purchaseOrderId: purchaseOrderId as string,
    });
    res.json(refunds);
  } catch (err) {
    next(err);
  }
};
