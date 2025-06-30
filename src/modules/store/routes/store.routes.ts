import { Router } from "express";
import { storeController } from "../controllers/store.controller";
import { requireAuth } from "../../../middleware/requireAuth";
import { requirePermission } from "../../../middleware/requirePermission";


const router = Router();

// Store CRUD routes
router.post(
  "/",
  requireAuth,
  requirePermission("store:create"),
  storeController.createStore.bind(storeController)
);

router.get(
  "/",
  requireAuth,
  requirePermission("store:read"),
  storeController.getStores.bind(storeController)
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("store:read"),
  storeController.getStoreById.bind(storeController)
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("store:update"),
  storeController.updateStore.bind(storeController)
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("store:delete"),
  storeController.deleteStore.bind(storeController)
);

export default router;