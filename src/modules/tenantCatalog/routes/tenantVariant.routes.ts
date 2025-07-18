import { Router } from 'express';

import { tenantVariantController } from '../controllers/tenantVariant.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();
router.use(requireAuth);



router.post('/tenant-variants', requirePermission('tenantCatalog:create'), tenantVariantController.create);
router.get('/tenant-variants/product/:tenantProductId', requirePermission('tenantCatalog:read'), tenantVariantController.listByProduct);
router.get('/tenant-variants/:id', requirePermission('tenantCatalog:read'), tenantVariantController.getById);
router.patch('/tenant-variants/:id', requirePermission('tenantCatalog:update'), tenantVariantController.update);
router.delete('/tenant-variants/:id', requirePermission('tenantCatalog:delete'), tenantVariantController.delete);

export default router;