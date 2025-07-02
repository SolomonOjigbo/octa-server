import express from 'express';
import tenantRoutes from '../../../../modules/tenant/tenant.module';
import userRoutes from '../../../../modules/user/user.module';
import authRoutes, { sessionRoutes } from '../../../../modules/auth/auth.module';
import storeRoutes from '../../../../modules/store/store.module';
import businessEntityRoutes from '../../../../modules/businessEntity/businessEntity.module';
import stockRoutes from '../../../../modules/stock/stock.module';
import productRoutes, { categoryRoutes, productVariantRoutes } from '../../../../modules/product/product.module';
import inventoryRoutes from '../../../../modules/inventory/inventory.module';
import stockTransferRoutes from '../../../../modules/stockTransfer/stockTransfer.module';
import b2bConnectionRoutes from '../../../../modules/b2b/b2b.module';
import supplierRoutes from '../../../../modules/supplier/supplier.module';
import transactionRoutes from '../../../../modules/transactions/transactions.module';
import paymentRoutes from '../../../../modules/payments/payments.module';
import posRoutes from '../../../../modules/pos/pos.module';
import purchaseOrderRoutes from '../../../../modules/purchaseOrder/purchaseOrder.module';
import customerRoutes, { communicationLogRoutes, crmReportingRoutes } from '../../../../modules/crm/crm.module';
import { roleRoutes } from '../../../../modules/roles/role.module';
import auditRoutes from '../../../../modules/audit/audit.module';


const v1Router = express.Router();

v1Router.get('/', (req, res) => {
  return res.json({ message: "Yo! we're up" });
});


v1Router.use('/tenant', tenantRoutes);
v1Router.use('/user', userRoutes);
v1Router.use('/business-entity', businessEntityRoutes);
v1Router.use('/store', storeRoutes);
v1Router.use('/roles', roleRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/session', sessionRoutes);
v1Router.use('/products', productRoutes);
v1Router.use('/product-categories', categoryRoutes);
v1Router.use('/product-variants', productVariantRoutes);
v1Router.use('/stocks', stockRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/stock-transfer', stockTransferRoutes);
v1Router.use('/suppliers', supplierRoutes);
v1Router.use('/b2b-connection', b2bConnectionRoutes);
v1Router.use('/transactions', transactionRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/pos', posRoutes);
v1Router.use('/purchase-orders', purchaseOrderRoutes);
v1Router.use('/customers', customerRoutes);
v1Router.use('/crm-reports', crmReportingRoutes);
v1Router.use('/crm-communication', communicationLogRoutes);
v1Router.use('/audit-logs', auditRoutes);





export { v1Router };
