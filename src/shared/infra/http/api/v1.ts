import express from 'express';
import tenantRoutes from '../../../../modules/tenant/tenant.module';
import userRoutes from '../../../../modules/user/user.module';
import authRoutes, { sessionRoutes } from '../../../../modules/auth/auth.module';
import storeRoutes from '../../../../modules/store/store.module';
import businessEntityRoutes from '../../../../modules/businessEntity/businessEntity.module';
import stockRoutes from '../../../../modules/stock/stock.module';
import inventoryRoutes from '../../../../modules/inventory/inventory.module';
import stockTransferRoutes from '../../../../modules/stockTransfer/stockTransfer.module';
import b2bConnectionRoutes from '../../../../modules/b2b/b2b.module';
import supplierRoutes, { productSupplierRoutes } from '../../../../modules/supplier/supplier.module';
import transactionRoutes from '../../../../modules/transactions/transactions.module';
import paymentRoutes from '../../../../modules/payments/payments.module';
import posRoutes from '../../../../modules/pos/pos.module';
import purchaseOrderRoutes from '../../../../modules/purchaseOrder/purchaseOrder.module';
import customerRoutes, { communicationLogRoutes, crmReportingRoutes } from '../../../../modules/crm/crm.module';
import { roleRoutes } from '../../../../modules/role/role.module';
import auditRoutes from '../../../../modules/audit/audit.module';
import tenantProductRoutes, { tenantCategoryRoutes, tenantVariantRoutes } from '@modules/tenantCatalog/tenantCatalog.module';
import invoiceRoutes from '@modules/invoice/invove.module';
import reconciliationRoutes from '@modules/reconciliation/reconciliation.module';
import globalProductRoutes, { globalCategoryRoutes, globalVariantRoutes } from '@modules/globalCatalog/globalCatalog.module';
import refundRoutes from '@modules/refunds/refund.module';
import userRoleRoutes from '@modules/userRole/userRole.module';


const v1Router = express.Router();

v1Router.get('/', (req, res) => {
  return res.json({ message: "Yo! we're up" });
});


v1Router.use('/auth', authRoutes);
v1Router.use('/user', userRoutes);
v1Router.use('/roles', roleRoutes);
v1Router.use('/user-roles', userRoleRoutes);

v1Router.use('/tenants', tenantRoutes);
v1Router.use('/stores', storeRoutes);
v1Router.use('/business-entity', businessEntityRoutes);
v1Router.use('/b2b-connection', b2bConnectionRoutes);

v1Router.use('/pos', posRoutes);
v1Router.use('/sessions', sessionRoutes);

v1Router.use('/global-products', globalProductRoutes);
v1Router.use('/global-product-categories', globalCategoryRoutes);
v1Router.use('/global-product-variants', globalVariantRoutes);

v1Router.use('/tenant-products', tenantProductRoutes);
v1Router.use('/tenant-product-categories', tenantCategoryRoutes);
v1Router.use('/tenant-product-variants', tenantVariantRoutes);


v1Router.use('/stocks', stockRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/stock-transfers', stockTransferRoutes);

v1Router.use('/customers', customerRoutes);
v1Router.use('/suppliers', supplierRoutes);
v1Router.use('/product-suppliers', productSupplierRoutes);

v1Router.use('/purchase-orders', purchaseOrderRoutes);
v1Router.use('/invoices', invoiceRoutes);
v1Router.use('/transactions', transactionRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/refunds', refundRoutes);
v1Router.use('/reconciliations', reconciliationRoutes);

v1Router.use('/crm-reports', crmReportingRoutes);
v1Router.use('/crm-communications', communicationLogRoutes);
v1Router.use('/audit-logs', auditRoutes);








export { v1Router };
