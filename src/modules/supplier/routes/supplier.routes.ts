import { Router } from "express";
import { supplierController } from "../controllers/supplier.controller";

const router = Router();

router.post("/", supplierController.createSupplier.bind(supplierController));
router.get("/", supplierController.getSuppliers.bind(supplierController));
router.put("/:id", supplierController.updateSupplier.bind(supplierController));
router.delete("/:id", supplierController.deleteSupplier.bind(supplierController));

export default router;
