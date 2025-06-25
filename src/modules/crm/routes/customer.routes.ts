import { Router } from "express";
import { customerController } from "../controllers/customer.controller";

const router = Router();
router.post("/", customerController.createCustomer.bind(customerController));
router.get("/", customerController.getCustomers.bind(customerController));
router.get("/:id", customerController.getCustomerById.bind(customerController));
router.put("/:id", customerController.updateCustomer.bind(customerController));
export default router;
