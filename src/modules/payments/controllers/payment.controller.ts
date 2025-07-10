import { Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { createPaymentSchema, createRefundSchema, RefundPaymentSchema, ReversePaymentSchema, reversePaymentSchema, updatePaymentSchema } from "../validations";
import { CreatePaymentDto, CreateRefundDto, RefundPaymentDto, ReversePaymentDto } from "../types/payment.dto";
import { asyncHandler } from "@middleware/errorHandler";

export class PaymentController {

   //V1 Controllers

  list = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    res.json(await paymentService.list(tenantId));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    res.json(await paymentService.getById(tenantId, req.params.id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = createPaymentSchema.parse(req.body) as CreatePaymentDto;
    const rec      = await paymentService.create(tenantId, userId, dto);
    res.status(201).json(rec);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = updatePaymentSchema.parse(req.body);
    const rec      = await paymentService.update(tenantId, userId, req.params.id, dto);
    res.json(rec);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    await paymentService.delete(tenantId, userId, req.params.id);
    res.sendStatus(204);
  });

  reverse = asyncHandler(async (req: Request, res: Response) => {

    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = ReversePaymentSchema.parse(req.body);
    const rec      = await paymentService.reverse(tenantId, userId, req.params.id, dto);
    res.status(201).json(rec);
  });

  refund = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId;
    const userId   = req.user!.id;
    const dto      = RefundPaymentSchema.parse(req.body) as RefundPaymentDto;
    const rec      = await paymentService.refund(tenantId, userId, req.params.id, dto);
    res.status(201).json(rec);
  });

  //V2 Controllers
  

  // async getPayments(req: Request, res: Response) {
  //   const filters = req.query;
  //   const payments = await paymentService.getPayments(filters);
  //   res.json(payments);
  // }

  // async updatePayment(req: Request, res: Response) {
  //   try {
  //     const { id } = req.params;
  //     const validated = updatePaymentSchema.parse(req.body);
  //     const payment = await paymentService.updatePayment(id, validated);
  //     res.json(payment);
  //   } catch (err) {
  //     res.status(400).json({ message: err.errors || err.message });
  //   }
  // }

  //  async reversePayment(req: Request, res: Response) {
  //   try {
  //     const { id } = req.params;
  //     const userId = req.user?.id;
  //     const tenantId = req.user?.tenantId;
  //     const { reason } = reversePaymentSchema.parse(req.body);
  //     const payment = await paymentService.reversePayment(id, reason, userId, tenantId);
  //     res.json(payment);
  //   } catch (err) {
  //     res.status(400).json({ message: err.errors || err.message });
  //   }
  // }

  // async createRefund(req: Request, res: Response) {
  //   try {
  //     const validated = createRefundSchema.parse(req.body) as CreateRefundDto;
  //     const refund = await paymentService.createRefund(validated);
  //     res.status(201).json(refund);
  //   } catch (err) {
  //     res.status(400).json({ message: err.errors || err.message });
  //   }
  // }

}

export const paymentController = new PaymentController();
