// src/modules/product/controllers/category.controller.ts
import { Request, Response } from "express";
import { categoryService } from "../services/category.service";
import { createCategorySchema, updateCategorySchema } from "../validations";
import { CreateCategoryDto } from "../types/product.dto";

export class CategoryController {
  /**
   * @swagger
   * /categories:
   *   post:
   *     summary: Create a product category
   *     tags: [ProductCategory]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategory'
   *     responses:
   *       201:
   *         $ref: '#/components/responses/Category'
   */
  async createCategory(req: Request, res: Response) {
    try {
      const dto = createCategorySchema.parse(req.body) as CreateCategoryDto;
      const userId = req.user.id;  //actorId
      const category = await categoryService.createCategory(dto, userId);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  /**
   * @swagger
   * /categories:
   *   get:
   *     summary: Get all product categories for a tenant
   *     tags: [ProductCategory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: List of categories
   */
  async getCategories(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const list = await categoryService.getCategories(tenantId);
      res.json(list);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * @swagger
   * /categories/{id}:
   *   get:
   *     summary: Get a category by ID
   *     tags: [ProductCategory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         $ref: '#/components/responses/Category'
   */
  async getCategoryById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const tenantId = req.query.tenantId as string;
      const cat = await categoryService.getCategoryById(id, tenantId);
      res.json(cat);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  /**
   * @swagger
   * /categories/{id}:
   *   put:
   *     summary: Update a category
   *     tags: [ProductCategory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *             $ref: '#/components/schemas/UpdateCategory'
   *     responses:
   *       200:
   *         $ref: '#/components/responses/Category'
   */
  async updateCategory(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const partial = updateCategorySchema.parse(req.body);
      const actorId = req.user?.id;
      const cat = await categoryService.updateCategory(id, partial, actorId);
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  /**
   * @swagger
   * /categories/{id}:
   *   delete:
   *     summary: Delete a category
   *     tags: [ProductCategory]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Deletion success
   */
  async deleteCategory(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const tenantId = req.query.tenantId as string;
      const actorId = req.user?.id;
      const cat = await categoryService.deleteCategory(id, tenantId, actorId);
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export const categoryController = new CategoryController();
