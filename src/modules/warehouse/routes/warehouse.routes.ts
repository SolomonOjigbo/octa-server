import { Router } from 'express';
import { warehouseController } from '../controllers/warehouse.controller';
import { requireAuth } from '@middleware/requireAuth';
import { requirePermission } from '@middleware/requirePermission';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('warehouse:create'),
  warehouseController.create
);

router.put(
  '/:id',
  requireAuth,
  requirePermission('warehouse:update'),
  warehouseController.update
);

router.get(
  '/:id',
  requireAuth,
  requirePermission('warehouse:view'),
  warehouseController.getById
);

router.get(
  '/',
  requireAuth,
  requirePermission('warehouse:view'),
  warehouseController.list
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('warehouse:delete'),
  warehouseController.delete
);

export default router;