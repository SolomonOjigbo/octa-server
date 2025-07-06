import { Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { createPaymentSchema, createRefundSchema, reversePaymentSchema, updatePaymentSchema } from "../validations";
import { CreatePaymentDto, CreateRefundDto } from "../types/payment.dto";

export class PaymentController {
  async createPayment(req: Request, res: Response) {
    try {
      const validated = createPaymentSchema.parse(req.body) as CreatePaymentDto;
      const payment = await paymentService.createPayment(validated);
      res.status(201).json(payment);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getPayments(req: Request, res: Response) {
    const filters = req.query;
    const payments = await paymentService.getPayments(filters);
    res.json(payments);
  }

  async updatePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updatePaymentSchema.parse(req.body);
      const payment = await paymentService.updatePayment(id, validated);
      res.json(payment);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

   async reversePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      const { reason } = reversePaymentSchema.parse(req.body);
      const payment = await paymentService.reversePayment(id, reason, userId, tenantId);
      res.json(payment);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async createRefund(req: Request, res: Response) {
    try {
      const validated = createRefundSchema.parse(req.body) as CreateRefundDto;
      const refund = await paymentService.createRefund(validated);
      res.status(201).json(refund);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
}

export const paymentController = new PaymentController();
