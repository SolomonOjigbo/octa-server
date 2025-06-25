import { Router } from "express";
import { userController } from "../controllers/user.controller";

const router = Router();
router.post("/", userController.createUser.bind(userController));
router.get("/", userController.getUsers.bind(userController));
router.get("/:id", userController.getUserById.bind(userController));
router.put("/:id", userController.updateUser.bind(userController));
export default router;
