import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';
import { globalProductController } from '../controllers/globalProduct.controller';


const router = Router();
router.use(requireAuth);


router.post('/global-products', requirePermission('globalCatalog:create'), globalProductController.create);
// router.get('/global-products/category/:categoryId', globalProductController.listByCategory);
router.get('/global-products/:id', globalProductController.getById);
router.patch('/global-products/:id', requirePermission('globalCatalog:update'), globalProductController.update);
router.delete('/global-products/:id', requirePermission('globalCatalog:delete'), globalProductController.delete);

export default router;