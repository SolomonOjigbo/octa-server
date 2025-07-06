import { Request, Response } from "express";
import { tenantService } from "../services/tenant.service";
import { tenantOnboardingSchema, updateTenantSchema } from "../validations";
import {  UpdateTenantDto, TenantResponseDto, TenantOnboardingDto } from "../types/tenant.dto";
import { auditService } from "../../audit/services/audit.service";
import { AuditAction } from "../../audit/types/audit.dto";

export class TenantController {
  async atomicTenantOnboarding(req: Request, res: Response) {
    try {
      const validated = tenantOnboardingSchema.parse(req.body) as TenantOnboardingDto;
      const result = await tenantService.atomicOnboard(validated);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: err.errors || err.message });
    }
  }

  async getTenants(req: Request, res: Response) {
    try {
      const tenants = await tenantService.getTenants();
      res.json(tenants);
    } catch (err) {
      res.status(500).json({ 
        code: "SERVER_ERROR",
        message: "Failed to fetch tenants" 
      });
    }
  }

  async getTenantById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenant = await tenantService.getTenantById(id);
      
      if (!tenant) {
        return res.status(404).json({ 
          code: "NOT_FOUND",
          message: "Tenant not found" 
        });
      }

      res.json(tenant);
    } catch (err) {
      res.status(500).json({ 
        code: "SERVER_ERROR",
        message: "Failed to fetch tenant" 
      });
    }
  }

  async updateTenant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateTenantSchema.parse({ ...req.body, id }) as UpdateTenantDto;
      const tenant = await tenantService.updateTenant(validated);
      
      await auditService.log({
        userId: req.user?.id,
        tenantId: id,
        action: AuditAction.TENANT_UPDATED,
        entityType: "Tenant",
        entityId: id
      });

      res.json(tenant);
    } catch (err) {
      res.status(400).json({ 
        code: "VALIDATION_ERROR",
        message: err.errors || err.message 
      });
    }
  }

  async deleteTenant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await tenantService.deleteTenant(id);
      
      await auditService.log({
        userId: req.user?.id,
        tenantId: id,
        action: AuditAction.TENANT_DELETED,
        entityType: "Tenant",
        entityId: id
      });

      res.status(204).send();
    } catch (err) {
      res.status(400).json({ 
        code: "DELETE_FAILED",
        message: err.message 
      });
    }
  }

   async getTenantsWithB2B(req: Request, res: Response) {
    try {
      const tenants = await tenantService.getTenantsWithB2B();
      res.json(tenants);
    } catch (err) {
      res.status(500).json({ 
        code: "SERVER_ERROR",
        message: "Failed to fetch tenants with B2B" 
      });
    }
  }
}
export const tenantController = new TenantController();