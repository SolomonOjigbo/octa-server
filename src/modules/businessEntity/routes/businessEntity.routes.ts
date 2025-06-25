import { Router } from "express";
import { businessEntityController } from "../controllers/businessEntity.controller";

const router = Router();
router.post("/", businessEntityController.createEntity.bind(businessEntityController));
router.get("/", businessEntityController.getEntities.bind(businessEntityController));
router.get("/:id", businessEntityController.getEntityById.bind(businessEntityController));
router.put("/:id", businessEntityController.updateEntity.bind(businessEntityController));
router.delete("/:id", businessEntityController.deleteEntity.bind(businessEntityController));

export default router;
