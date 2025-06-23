import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";

const router = Router();

router.post("/", inventoryController.createMovement.bind(inventoryController));
router.get("/", inventoryController.getMovements.bind(inventoryController));
router.get("/:id", inventoryController.getMovementById.bind(inventoryController));
router.put("/:id", inventoryController.updateMovement.bind(inventoryController));
router.delete("/:id", inventoryController.deleteMovement.bind(inventoryController));

export default router;
