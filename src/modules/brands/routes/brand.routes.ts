// src/modules/brand/routes.ts
import { Router } from "express";
import { brandController } from "../controllers/brand.controller";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();

router.get("/", brandController.list);
router.get("/:id", brandController.getById);
router.post("/", requireAuth, brandController.create);
router.put("/:id", requireAuth, brandController.update);
router.delete("/:id", requireAuth, brandController.delete);
router.patch("/:id/toggle-status", requireAuth, brandController.toggleStatus);

export default router;