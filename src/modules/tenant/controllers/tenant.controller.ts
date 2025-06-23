import { Request, Response } from "express";
import { TenantService } from "../services/tenant.service";

const tenantService = new TenantService();

export const createTenant = async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json(tenant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getTenantById = async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.json(tenant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  try {
    await tenantService.deleteTenant(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await tenantService.listTenants();
    res.json(tenants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
