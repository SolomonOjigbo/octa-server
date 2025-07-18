import { Router } from 'express';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';
import { globalVariantController } from '../controllers/globalVariant.controller';


const router = Router();
router.use(requireAuth);


router.post('/global-variants', requirePermission('globalCatalog:create'), globalVariantController.create);
router.get('/global-variants/product/:globalProductId', globalVariantController.listByProduct);
router.patch('/global-variants/:id', requirePermission('globalCatalog:update'), globalVariantController.update);
router.delete('/global-variants/:id', requirePermission('globalCatalog:delete'), globalVariantController.delete);

export default router;