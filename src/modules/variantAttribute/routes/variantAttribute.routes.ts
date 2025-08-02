// src/modules/variantAttribute/routes.ts
import { Router } from "express";
import  {variantAttributeController}  from "../controllers/variantAttribute.controller";
import { requireAuth } from "@middleware/requireAuth";

const router = Router();

router.get("/", variantAttributeController.list);
router.get("/:id", variantAttributeController.getById);
router.post("/", requireAuth, variantAttributeController.create);
router.put("/:id", requireAuth, variantAttributeController.update);
router.delete("/:id", requireAuth, variantAttributeController.delete);
router.patch("/:id/toggle-status", requireAuth, variantAttributeController.toggleStatus);

export default router;