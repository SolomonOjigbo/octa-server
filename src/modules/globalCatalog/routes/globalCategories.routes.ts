import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';
import { globalCategoryController } from '../controllers/globalCategory.controller';

const router = Router();
router.use(requireAuth);

router.use('/global-categories', requirePermission('globalCatalog:read'), router);
router.post('/global-categories', requirePermission('globalCatalog:create'), globalCategoryController.create);
router.get('/global-categories', globalCategoryController.list);
router.get('/global-categories/:id', globalCategoryController.getById);
router.patch('/global-categories/:id', requirePermission('globalCatalog:update'), globalCategoryController.update);
router.delete('/global-categories/:id', requirePermission('globalCatalog:delete'), globalCategoryController.delete);

export default router;