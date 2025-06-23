import { Router } from "express";
import { productController } from "../controllers/product.controller";

const router = Router();

router.post("/", productController.createProduct.bind(productController));
router.get("/", productController.getProducts.bind(productController));
router.get("/:id", productController.getProductById.bind(productController));
router.put("/:id", productController.updateProduct.bind(productController));
router.delete("/:id", productController.deleteProduct.bind(productController));

export default router;
