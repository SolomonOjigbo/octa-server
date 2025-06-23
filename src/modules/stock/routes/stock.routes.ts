import { Router } from "express";
import { stockController } from "../controllers/stock.controller";

const router = Router();

router.get("/", stockController.getStockLevels.bind(stockController)); // Query/filter stock
router.get("/:productId", stockController.getStock.bind(stockController)); // Get stock for a product at a location
router.post("/adjust", stockController.adjustStockLevel.bind(stockController)); // Set absolute quantity
router.post("/increment", stockController.incrementStockLevel.bind(stockController)); // Add/subtract quantity
router.delete("/:productId", stockController.deleteStock.bind(stockController)); // Delete stock record

export default router;
