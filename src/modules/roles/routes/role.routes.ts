import { Router } from "express";
import { roleController } from "../controllers/role.controller";

const router = Router();
router.post("/", roleController.createRole.bind(roleController));
router.post("/assign", roleController.assignRole.bind(roleController));
router.get("/permissions", roleController.getUserPermissions.bind(roleController));
export default router;
