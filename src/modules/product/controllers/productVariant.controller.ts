// src/modules/product/controllers/productVariants.controller.ts
import { Request, Response } from "express";
import { productVariantService } from "../services/productVariant.service";
import { variantSchema } from "../validations";
import { ProductVariantDto } from "../types/product.dto";

export class ProductVariantsController {
  /**
   * @swagger
   * /products/{productId}/variants:
   *   post:
   *     summary: Create a variant for a product
   *     tags: [ProductVariant]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         schema:
   *           type: string
   *         required: true
   *         description: Parent product ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProductVariant'
   *     responses:
   *       201:
   *         description: Created variant object
   */
  async createVariant(req: Request, res: Response) {
    try {
      const productId = req.params.productId;
      const dto = variantSchema.parse(req.body) as ProductVariantDto;
      const actorId = req.user.id;
      const v = await productVariantService.createVariant(productId, dto, actorId);
      res.status(201).json(v);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  /**
   * @swagger
   * /products/{productId}/variants:
   *   get:
   *     summary: List variants of a product
   *     tags: [ProductVariant]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: List of variants
   */
  async getVariants(req: Request, res: Response) {
    try {
      const productId = req.params.productId;
      const list = await productVariantService.getVariants(productId);
      res.json(list);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * @swagger
   * /products/{productId}/variants/{id}:
   *   get:
   *     summary: Get a variant by ID
   *     tags: [ProductVariant]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Variant object
   */
  async getVariantById(req: Request, res: Response) {
    try {
      const { productId, id } = req.params;
      const v = await productVariantService.getVariantById(id, productId);
      res.json(v);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  /**
   * @swagger
   * /products/{productId}/variants/{id}:
   *   put:
   *     summary: Update a product variant
   *     tags: [ProductVariant]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProductVariant'
   *     responses:
   *       200:
   *         description: Updated variant object
   */
  async updateVariant(req: Request, res: Response) {
    try {
      const { productId, id } = req.params;
      const dto = variantSchema.partial().parse(req.body);
      const actorId = req.user?.id;
      const v = await productVariantService.updateVariant(id, productId, dto, actorId);
      res.json(v);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  /**
   * @swagger
   * /products/{productId}/variants/{id}:
   *   delete:
   *     summary: Delete a product variant
   *     tags: [ProductVariant]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         schema:
   *           type: string
   *         required: true
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Deletion success
   */
  async deleteVariant(req: Request, res: Response) {
    try {
      const { productId, id } = req.params;
      const actorId = req.user?.id;
      const result = await productVariantService.deleteVariant(id, productId, actorId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const productVariantsController = new ProductVariantsController();
