import { Request, Response } from "express";
import { customerService } from "../services/customer.service";
import { createCustomerSchema, updateCustomerSchema } from "../validations";
import { CreateCustomerDto } from "../types/crm.dto";

export class CustomerController {
  async createCustomer(req: Request, res: Response) {
    try {
      const validated = createCustomerSchema.parse(req.body) as CreateCustomerDto;
      const customer = await customerService.createCustomer(validated);
      res.status(201).json(customer);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
  async getCustomers(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    const customers = await customerService.getCustomers(tenantId);
    res.json(customers);
  }
  async getCustomerById(req: Request, res: Response) {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json(customer);
  }
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateCustomerSchema.parse(req.body);
      const customer = await customerService.updateCustomer(id, validated);
      res.json(customer);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
}
export const customerController = new CustomerController();











// import { Request, Response } from "express";
// import { CustomerService } from "../services/customer.service";

// const customerService = new CustomerService();

// export const createCustomer = async (req: Request, res: Response) => {
//   try {
//     const customer = await customerService.createCustomer(req.body);
//     res.status(201).json(customer);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getCustomerById = async (req: Request, res: Response) => {
//   try {
//     const customer = await customerService.getCustomerById(req.params.id);
//     if (!customer) return res.status(404).json({ error: "Customer not found" });
//     res.json(customer);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const updateCustomer = async (req: Request, res: Response) => {
//   try {
//     const customer = await customerService.updateCustomer(req.params.id, req.body);
//     res.json(customer);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const deleteCustomer = async (req: Request, res: Response) => {
//   try {
//     await customerService.deleteCustomer(req.params.id);
//     res.status(204).send();
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// export const listCustomersByTenant = async (req: Request, res: Response) => {
//   try {
//     const customers = await customerService.listCustomersByTenant(req.params.tenantId);
//     res.json(customers);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };
