import { Router } from 'express';

import { tenantCategoryController } from '../controllers/tenantCategory.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();
router.use(requireAuth);

router.post('/tenant-categories', requirePermission('tenantCatalog:create'), tenantCategoryController.create);
router.get('/tenant-categories', requirePermission('tenantCatalog:read'), tenantCategoryController.list);
router.get('/tenant-categories/:id', requirePermission('tenantCatalog:read'), tenantCategoryController.getById);
router.patch('/tenant-categories/:id', requirePermission('tenantCatalog:update'), tenantCategoryController.update);
router.delete('/tenant-categories/:id', requirePermission('tenantCatalog:delete'), tenantCategoryController.delete);

export default router;