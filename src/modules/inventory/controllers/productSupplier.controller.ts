import { Request, Response } from "express";
import { ProductSupplierService } from "../services/productSupplier.service";

const supplierLinkService = new ProductSupplierService();

export const linkProductSupplier = async (req: Request, res: Response) => {
  try {
    const link = await supplierLinkService.linkProductSupplier(req.body);
    res.status(201).json(link);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const unlinkProductSupplier = async (req: Request, res: Response) => {
  try {
    await supplierLinkService.unlinkProductSupplier(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listSuppliersForProduct = async (req: Request, res: Response) => {
  try {
    const suppliers = await supplierLinkService.listSuppliersForProduct(req.params.productId);
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listProductsForSupplier = async (req: Request, res: Response) => {
  try {
    const products = await supplierLinkService.listProductsForSupplier(req.params.supplierId);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
