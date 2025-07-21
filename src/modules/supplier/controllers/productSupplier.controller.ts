// src/modules/supplier/controllers/productSupplier.controller.ts

import { Request, Response, NextFunction } from 'express';
import { productSupplierService } from '../services/productSupplier.service';
import {
  CreateProductSupplierDtoSchema,
  UpdateProductSupplierDtoSchema,
} from '../types/productSupplier.dto';

export class ProductSupplierController {
  async linkProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreateProductSupplierDtoSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const link = await productSupplierService.linkProductToSupplier(
        tenantId,
        dto
      );
      res.status(201).json(link);
    } catch (err) {
      next(err);
    }
  }

  async updateLink(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = UpdateProductSupplierDtoSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      const updated = await productSupplierService.updateLink(
        tenantId,
        id,
        dto
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async unlinkProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;
      await productSupplierService.unlinkProduct(tenantId, id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getLinksForProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user.tenantId;
      const { tenantProductId, globalProductId } = req.query as {
        tenantProductId?: string;
        globalProductId?: string;
      };

      // exactly one must be provided
      if (
        Boolean(tenantProductId) === Boolean(globalProductId)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Must provide exactly one of 'tenantProductId' or 'globalProductId' in query",
          });
      }

      const links = await productSupplierService.getLinksForProduct(
        tenantId,
        {
          tenantProductId,
          globalProductId,
        }
      );
      res.json(links);
    } catch (err) {
      next(err);
    }
  }
}

export const productSupplierController = new ProductSupplierController();

