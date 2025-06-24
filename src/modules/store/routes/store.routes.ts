import { Router } from "express";
import { storeController } from "../controllers/store.controller";

const router = Router();

router.post("/", storeController.createStore.bind(storeController));
router.get("/", storeController.getStores.bind(storeController));
router.get("/:id", storeController.getStoreById.bind(storeController));
router.put("/:id", storeController.updateStore.bind(storeController));
router.delete("/:id", storeController.deleteStore.bind(storeController));

export default router;
