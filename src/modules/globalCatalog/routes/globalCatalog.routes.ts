import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';
import { globalCategoryController } from '../controllers/globalCategory.controller';
import { globalProductController } from '../controllers/globalProduct.controller';
import { globalVariantController } from '../controllers/globalVariant.controller';

const router = Router();
router.use(requireAuth);

router.use('/global-categories', requirePermission('globalCatalog:read'), router);
router.post('/global-categories', requirePermission('globalCatalog:create'), globalCategoryController.create);
router.get('/global-categories', globalCategoryController.list);
router.get('/global-categories/:id', globalCategoryController.getById);
router.patch('/global-categories/:id', requirePermission('globalCatalog:update'), globalCategoryController.update);
router.delete('/global-categories/:id', requirePermission('globalCatalog:delete'), globalCategoryController.delete);

router.post('/global-products', requirePermission('globalCatalog:create'), globalProductController.create);
router.get('/global-products/category/:categoryId', globalProductController.listByCategory);
router.get('/global-products/:id', globalProductController.getById);
router.patch('/global-products/:id', requirePermission('globalCatalog:update'), globalProductController.update);
router.delete('/global-products/:id', requirePermission('globalCatalog:delete'), globalProductController.delete);

router.post('/global-variants', requirePermission('globalCatalog:create'), globalVariantController.create);
router.get('/global-variants/product/:globalProductId', globalVariantController.listByProduct);
router.patch('/global-variants/:id', requirePermission('globalCatalog:update'), globalVariantController.update);
router.delete('/global-variants/:id', requirePermission('globalCatalog:delete'), globalVariantController.delete);

export default router;
