import { Request, Response } from "express";
import { productService } from "../services/product.service";
import {
  createProductSchema, updateProductSchema,
  createProductCategorySchema, updateProductCategorySchema,
  createProductVariantSchema, updateProductVariantSchema
} from "../validations";
import { CreateProductCategoryDto, CreateProductDto, CreateProductVariantDto, UpdateProductDto } from "../types/product.dto";

export class ProductController {
  // -------- Product Category --------
  async createCategory(req: Request, res: Response) {
    try {
      const validated = createProductCategorySchema.parse(req.body) as CreateProductCategoryDto;
      const category = await productService.createCategory(validated);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getCategories(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const categories = await productService.getCategories(tenantId);
    res.json(categories);
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const { id } = req.params;
      const validated = updateProductCategorySchema.parse(req.body);
      const result = await productService.updateCategory(tenantId, id, validated);
      if (result.count === 0) return res.status(404).json({ message: "Category not found" });
      res.json({ message: "Category updated" });
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const result = await productService.deleteCategory(tenantId, id);
    if (result.count === 0) return res.status(404).json({ message: "Category not found" });
    res.status(204).send();
  }

  // -------- Product --------
  async createProduct(req: Request, res: Response) {
    try {
      const validated = createProductSchema.parse(req.body) as CreateProductDto;
      const product = await productService.createProduct(validated);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getProducts(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const filters = {
      name: req.query.name as string,
      sku: req.query.sku as string,
      categoryId: req.query.categoryId as string,
    };
    const products = await productService.getProducts(tenantId, filters);
    res.json(products);
  }

  async getProductById(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const product = await productService.getProductById(tenantId, id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const { id } = req.params;
      const validated = updateProductSchema.parse(req.body) as UpdateProductDto;
      const result = await productService.updateProduct(tenantId, id, validated);
      if (result.count === 0) return res.status(404).json({ message: "Product not found" });
      res.json({ message: "Product updated" });
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const result = await productService.deleteProduct(tenantId, id);
    if (result.count === 0) return res.status(404).json({ message: "Product not found" });
    res.status(204).send();
  }

  // -------- Product Variant --------
  async createVariant(req: Request, res: Response) {
    try {
      const validated = createProductVariantSchema.parse(req.body) as CreateProductVariantDto;
      const variant = await productService.createVariant(validated);
      res.status(201).json(variant);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getVariants(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const productId = req.query.productId as string;
    const variants = await productService.getVariants(tenantId, productId);
    res.json(variants);
  }

  async updateVariant(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const { id } = req.params;
      const validated = updateProductVariantSchema.parse(req.body);
      const result = await productService.updateVariant(tenantId, id, validated);
      if (result.count === 0) return res.status(404).json({ message: "Variant not found" });
      res.json({ message: "Variant updated" });
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async deleteVariant(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const { id } = req.params;
    const result = await productService.deleteVariant(tenantId, id);
    if (result.count === 0) return res.status(404).json({ message: "Variant not found" });
    res.status(204).send();
  }
}

export const productController = new ProductController();
