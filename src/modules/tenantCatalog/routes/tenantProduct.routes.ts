import { Router } from 'express';


import { tenantProductController } from '../controllers/tenantProduct.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();
router.use(requireAuth);


router.post('/tenant-products', requirePermission('tenantCatalog:create'), tenantProductController.create);
router.get('/tenant-products', requirePermission('tenantCatalog:read'), tenantProductController.getProducts);
router.get('/tenant-products/:id', requirePermission('tenantCatalog:read'), tenantProductController.getById);
router.patch('/tenant-products/:id', requirePermission('tenantCatalog:update'), tenantProductController.update);
router.delete('/tenant-products/:id', requirePermission('tenantCatalog:delete'), tenantProductController.delete);

export default router;