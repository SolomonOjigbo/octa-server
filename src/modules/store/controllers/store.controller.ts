import { Request, Response } from "express";
import { storeService } from "../services/store.service";
import { 
  createStoreSchema, 
  updateStoreSchema 
} from "../validations";
import { 
  CreateStoreDto, 
  UpdateStoreDto 
} from "../types/store.dto";
import { auditService } from "../../audit/services/audit.service";
import { AuditAction } from "../../audit/types/audit.dto";

export class StoreController {
  async createStore(req: Request, res: Response) {
    try {
      const validated = createStoreSchema.parse({
        ...req.body,
        tenantId: req.user?.tenantId
      }) as CreateStoreDto;
      
      const store = await storeService.createStore(
        validated,
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: validated.tenantId,
        action: AuditAction.STORE_CREATED,
        entityType: "Store",
        entityId: store.id,
        metadata: {
          ...store,
          name: store.name,
          type: store.type
        }
      });

      res.status(201).json(store);
    } catch (err) {
      res.status(400).json({ 
        code: "VALIDATION_ERROR",
        message: err.errors || err.message 
      });
    }
  }

  async getStores(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          code: "TENANT_REQUIRED",
          message: "Tenant context is required"
        });
      }

      const includeManager = req.query.includeManager === 'true';
      const stores = await storeService.getStores(tenantId, { 
        includeManager 
      });

      res.json(stores);
    } catch (err) {
      res.status(500).json({ 
        code: "SERVER_ERROR",
        message: "Failed to fetch stores" 
      });
    }
  }

  async getStoreById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      const store = await storeService.getStoreById(id, tenantId, {
        includeManager: req.query.includeManager === 'true',
        includeBusinessEntity: req.query.includeBusinessEntity === 'true'
      });

      if (!store) {
        return res.status(404).json({ 
          code: "NOT_FOUND",
          message: "Store not found" 
        });
      }

      res.json(store);
    } catch (err) {
      res.status(500).json({ 
        code: "SERVER_ERROR",
        message: "Failed to fetch store" 
      });
    }
  }

  async updateStore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateStoreSchema.parse({ 
        ...req.body, 
        id 
      }) as UpdateStoreDto;
      
      const store = await storeService.updateStore(
        validated,
        req.user?.tenantId || '',
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        action: AuditAction.STORE_UPDATED,
        entityType: "Store",
        entityId: id,
        metadata: {
          changes: req.body
        }
      });

      res.json(store);
    } catch (err) {
      res.status(400).json({ 
        code: "VALIDATION_ERROR",
        message: err.errors || err.message 
      });
    }
  }

  async deleteStore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      
      await storeService.deleteStore(
        id, 
        tenantId || '',
        req.user?.id
      );

      await auditService.log({
        userId: req.user?.id,
        tenantId: tenantId,
        action: AuditAction.STORE_DELETED,
        entityType: "Store",
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
}

export const storeController = new StoreController();