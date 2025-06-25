import { Request, Response } from "express";
import { tenantService } from "../services/tenant.service";
import { createTenantSchema } from "../validations";
import { CreateTenantDto } from "../types/tenant.dto";

export class TenantController {
  async createTenant(req: Request, res: Response) {
    try {
      const validated = createTenantSchema.parse(req.body) as CreateTenantDto;
      const tenant = await tenantService.createTenant(validated);
      res.status(201).json(tenant);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
  async getTenants(req: Request, res: Response) {
    const tenants = await tenantService.getTenants();
    res.json(tenants);
  }
  async getTenantById(req: Request, res: Response) {
    const { id } = req.params;
    const tenant = await tenantService.getTenantById(id);
    if (!tenant) return res.status(404).json({ message: "Not found" });
    res.json(tenant);
  }
  async updateTenant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = createTenantSchema.partial().parse(req.body);
      const tenant = await tenantService.updateTenant(id, validated);
      res.json(tenant);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }
}
export const tenantController = new TenantController();
