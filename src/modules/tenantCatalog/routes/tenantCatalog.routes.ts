import { Router } from 'express';

import { tenantCategoryController } from '../controllers/tenantCategory.controller';
import { tenantProductController } from '../controllers/tenantProduct.controller';
import { tenantVariantController } from '../controllers/tenantVariant.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();
router.use(requireAuth);

router.post('/tenant-categories', requirePermission('tenantCatalog:create'), tenantCategoryController.create);
router.get('/tenant-categories', requirePermission('tenantCatalog:read'), tenantCategoryController.list);
router.get('/tenant-categories/:id', requirePermission('tenantCatalog:read'), tenantCategoryController.getById);
router.patch('/tenant-categories/:id', requirePermission('tenantCatalog:update'), tenantCategoryController.update);
router.delete('/tenant-categories/:id', requirePermission('tenantCatalog:delete'), tenantCategoryController.delete);

router.post('/tenant-products', requirePermission('tenantCatalog:create'), tenantProductController.create);
router.get('/tenant-products', requirePermission('tenantCatalog:read'), tenantProductController.getProducts);
router.get('/tenant-products/:id', requirePermission('tenantCatalog:read'), tenantProductController.getById);
router.patch('/tenant-products/:id', requirePermission('tenantCatalog:update'), tenantProductController.update);
router.delete('/tenant-products/:id', requirePermission('tenantCatalog:delete'), tenantProductController.delete);

router.post('/tenant-variants', requirePermission('tenantCatalog:create'), tenantVariantController.create);
router.get('/tenant-variants/product/:tenantProductId', requirePermission('tenantCatalog:read'), tenantVariantController.listByProduct);
router.patch('/tenant-variants/:id', requirePermission('tenantCatalog:update'), tenantVariantController.update);
router.delete('/tenant-variants/:id', requirePermission('tenantCatalog:delete'), tenantVariantController.delete);

export default router;
