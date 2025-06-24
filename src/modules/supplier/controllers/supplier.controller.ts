import { Request, Response } from "express";
import { SupplierService } from "../services/supplier.service";
import { createSupplierSchema, updateSupplierSchema } from "../validations";

export class SupplierController {
  async createSupplier(req: Request, res: Response) {
    try {
      const validated = createSupplierSchema.parse(req.body);
      const supplier = await SupplierService.createSupplier(validated);
      res.status(201).json(supplier);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getSuppliers(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const suppliers = await SupplierService.getSuppliers(tenantId);
    res.json(suppliers);
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateSupplierSchema.parse(req.body);
      const supplier = await SupplierService.updateSupplier(id, validated);
      if (supplier == null) return res.status(404).json({ message: "Not found" });
      res.json(supplier);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await SupplierService.deleteSupplier(id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
}
export const supplierController = new SupplierController();
