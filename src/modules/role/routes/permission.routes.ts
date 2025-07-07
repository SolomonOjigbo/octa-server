import { Router } from "express";
import { permissionController } from "../controllers/permission.controller";

const router = Router();
router.post("/", permissionController.createPermission.bind(permissionController));
router.get("/", permissionController.getPermissions.bind(permissionController));
export default router;
