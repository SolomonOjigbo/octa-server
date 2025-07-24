// src/shared/infra/http/permissionsAndRoles.ts

/**----------------------------------------------------------------------
 * 1) Groups for organizing permissions in the UI
 *----------------------------------------------------------------------*/
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT:          'User Management',
  TENANT_MANAGEMENT:        'Tenant Management',
  BUSINESS_ENTITY_MANAGEMENT: 'Business Entity Management',
  STORE_MANAGEMENT:          'Store Management',
  WAREHOUSE_MANAGEMENT:      'Warehouse Management',
  PRODUCT_MANAGEMENT:        'Product Management',
  INVENTORY_MANAGEMENT:      'Inventory Management',
  SUPPLIER_MANAGEMENT:       'Supplier Management',
  PURCHASE_MANAGEMENT:       'Purchase Management',
  SALES_MANAGEMENT:          'Sales Management',
  CUSTOMER_MANAGEMENT:       'Customer Management',
  COMMUNICATION_MANAGEMENT:  'Communication Management',
  CRM_REPORTING:             'CRM Reporting',
  PAYMENT_MANAGEMENT:        'Payment Management',
  ROLE_MANAGEMENT:           'Role Management',
  AUDIT_MANAGEMENT:          'Audit Management',
  REPORTING:                 'Reporting',
} as const;                                                           

export type PermissionGroup = typeof PERMISSION_GROUPS[keyof typeof PERMISSION_GROUPS];

/**----------------------------------------------------------------------
 * 2) Master list of all permission *names* in the system
 *----------------------------------------------------------------------*/
export const PERMISSIONS = [
  // User
  'user:create','user:update','user:view','user:delete','user:assign_role',

  // Tenant
  'tenant:create','tenant:update','tenant:view','tenant:delete',

  // Business Entity
  'business_entity:create','business_entity:update','business_entity:view',

  // Store
  'store:create','store:update','store:view','store:settings',

  // Warehouse
  'warehouse:create','warehouse:update','warehouse:view',

  // Product / Catalog
  'globalCategory:read','globalCategory:create','globalCategory:update','globalCategory:delete','globalCategory:view',
  'globalProduct:read','globalProduct:create','globalProduct:update','globalProduct:delete','globalProduct:view',
  'tenantCategory:read','tenantCategory:create','tenantCategory:update','tenantCategory:delete','tenantCategory:view',
  'tenantProduct:read','tenantProduct:create','tenantProduct:update','tenantProduct:delete','tenantProduct:view',
  'tenantProductVariant:read','tenantProductVariant:create','tenantProductVariant:update','tenantProductVariant:delete','tenantProductVariant:view',

  // Inventory & Stock
  'inventory:read','inventory:create','inventory:update','inventory:delete','inventory:view','inventory:adjust',
  'stock:read','stock:adjust','stock:update','stock:delete','stock:view',

  // StockTransfer
  'stockTransfer:read','stockTransfer:create','stockTransfer:update','stockTransfer:view',

  // B2B
  'b2b:read','b2b:create','b2b:update','b2b:delete','b2b:view',

  // PurchaseOrder
  'purchaseOrder:read','purchaseOrder:create','purchaseOrder:update','purchaseOrder:cancel','purchaseOrder:linkPayment','purchaseOrder:view',

  // POS
  'pos:session:create','pos:session:update','pos:session:read','pos:session:view',
  'pos:transaction:create','pos:payment:create','pos:return:create','pos:cashdrop:create','pos:reconcile:create',

  // Sales (generic)
  'sales:create','sales:read','sales:update','sales:delete','sales:view','sale:process','sale:reverse','discount:manage','tax:manage','loyalty:apply','loyalty:view',

  // Supplier
  'supplier:create','supplier:update','supplier:view','supplier:delete',

  // Customer / CRM
  'crm:customer:create','crm:customer:update','crm:customer:view','crm:customer:delete','crm:customer:history',
  'crm:communication:create','crm:communication:view','crm:communication:delete',
  'crm:report:create','crm:report:view','crm:report:update',

  // Payments & Refunds
  'payment:create','payment:read','payment:update','payment:delete','payment:refund','payment:reverse','payment:view',
  'refund:create','refund:read','refund:update','refund:delete','refund:view',
  'cash:reconcile',

  // Transactions
  'transaction:create','transaction:read','transaction:update','transaction:delete','transaction:view',

  // Reporting
  'reporting:sales','reporting:inventory','reporting:purchaseOrders','reporting:transactions','reporting:payments','reporting:b2bConnections',
  'report:view','report:export',

  // Audit
  'audit:view',

  // Role management
  'role:manage','permission:assign',
] as const;                                                       

export type Permission = typeof PERMISSIONS[number];

/**----------------------------------------------------------------------
 * 3) Detailed definitions for each permission (ties name→group→description)
 *----------------------------------------------------------------------*/
export interface PermissionDefinition {
  name:        Permission;
  group:       PermissionGroup;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // User Management
  { name:'user:create',  group:PERMISSION_GROUPS.USER_MANAGEMENT,        description:'Create new users' },
  { name:'user:update',  group:PERMISSION_GROUPS.USER_MANAGEMENT,        description:'Update user details' },
  { name:'user:view',    group:PERMISSION_GROUPS.USER_MANAGEMENT,        description:'View user information' },
  { name:'user:delete',  group:PERMISSION_GROUPS.USER_MANAGEMENT,        description:'Deactivate/delete users' },
  { name:'user:assign_role', group:PERMISSION_GROUPS.USER_MANAGEMENT,    description:'Assign roles to users' },

  // Tenant Management
  { name:'tenant:create', group:PERMISSION_GROUPS.TENANT_MANAGEMENT,       description:'Create new tenants' },
  { name:'tenant:update', group:PERMISSION_GROUPS.TENANT_MANAGEMENT,       description:'Update tenant details' },
  { name:'tenant:view',   group:PERMISSION_GROUPS.TENANT_MANAGEMENT,       description:'View tenant information' },
  { name:'tenant:delete', group:PERMISSION_GROUPS.TENANT_MANAGEMENT,       description:'Delete tenants' },

  // Business Entity Management
  { name:'business_entity:create', group:PERMISSION_GROUPS.BUSINESS_ENTITY_MANAGEMENT, description:'Create new business entities' },
  { name:'business_entity:update', group:PERMISSION_GROUPS.BUSINESS_ENTITY_MANAGEMENT, description:'Update business entity details' },
  { name:'business_entity:view',   group:PERMISSION_GROUPS.BUSINESS_ENTITY_MANAGEMENT, description:'View business entity information' },

  // Store Management
  { name:'store:create', group:PERMISSION_GROUPS.STORE_MANAGEMENT, description:'Create new stores' },
  { name:'store:update', group:PERMISSION_GROUPS.STORE_MANAGEMENT, description:'Update store details' },
  { name:'store:view',   group:PERMISSION_GROUPS.STORE_MANAGEMENT, description:'View store information' },
  { name:'store:settings', group:PERMISSION_GROUPS.STORE_MANAGEMENT, description:'Modify store settings' },

  // Warehouse Management
  { name:'warehouse:create', group:PERMISSION_GROUPS.WAREHOUSE_MANAGEMENT, description:'Create new warehouses' },
  { name:'warehouse:update', group:PERMISSION_GROUPS.WAREHOUSE_MANAGEMENT, description:'Update warehouse details' },
  { name:'warehouse:view',   group:PERMISSION_GROUPS.WAREHOUSE_MANAGEMENT, description:'View warehouse information' },

  // Product Management
  { name:'globalCategory:read', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View global product categories' },
  { name:'globalCategory:create', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Create global product categories' },
  { name:'globalCategory:update', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Update global product categories' },
  { name:'globalCategory:delete', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Delete global product categories' },
  { name:'globalCategory:view', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View global category details' },
  { name:'globalProduct:read', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View global products' },
  { name:'globalProduct:create', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Create global products' },
  { name:'globalProduct:update', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Update global products' },
  { name:'globalProduct:delete', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Delete global products' },
  { name:'globalProduct:view', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View global product details' },
  { name:'tenantCategory:read', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View tenant-specific categories' },
  { name:'tenantCategory:create', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Create tenant-specific categories' },
  { name:'tenantCategory:update', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Update tenant-specific categories' },
  { name:'tenantCategory:delete', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Delete tenant-specific categories' },
  { name:'tenantCategory:view', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View tenant category details' },
  { name:'tenantProduct:read', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View tenant-specific products' },
  { name:'tenantProduct:create', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Create tenant-specific products' },
  { name:'tenantProduct:update', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Update tenant-specific products' },
  { name:'tenantProduct:delete', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Delete tenant-specific products' },
  { name:'tenantProduct:view', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View tenant product details' },
  { name:'tenantProductVariant:read', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View tenant product variants' },
  { name:'tenantProductVariant:create', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Create tenant product variants' },
  { name:'tenantProductVariant:update', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Update tenant product variants' },
  { name:'tenantProductVariant:delete', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'Delete tenant product variants' },
  { name:'tenantProductVariant:view', group:PERMISSION_GROUPS.PRODUCT_MANAGEMENT, description:'View tenant product variant details' },

  // Inventory Management
  { name:'inventory:read', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'View inventory records' },
  { name:'inventory:create', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Create inventory records' },
  { name:'inventory:update', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Update inventory records' },
  { name:'inventory:delete', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Delete inventory records' },
  { name:'inventory:view', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'View inventory details' },
  { name:'inventory:adjust', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Adjust inventory quantities' },
  { name:'stock:read', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'View stock levels' },
  { name:'stock:adjust', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Adjust stock levels' },
  { name:'stock:update', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Update stock information' },
  { name:'stock:delete', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Delete stock records' },
  { name:'stock:view', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'View stock details' },

  // Stock Transfer
  { name:'stockTransfer:read', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'View stock transfers' },
  { name:'stockTransfer:create', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Create stock transfers' },
  { name:'stockTransfer:update', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'Update stock transfers' },
  { name:'stockTransfer:view', group:PERMISSION_GROUPS.INVENTORY_MANAGEMENT, description:'View stock transfer details' },

  // B2B
  { name:'b2b:read', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'View B2B connections' },
  { name:'b2b:create', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Create B2B connections' },
  { name:'b2b:update', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Update B2B connections' },
  { name:'b2b:delete', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Delete B2B connections' },
  { name:'b2b:view', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'View B2B connection details' },

  // Purchase Management
  { name:'purchaseOrder:read', group:PERMISSION_GROUPS.PURCHASE_MANAGEMENT, description:'View purchase orders' },
  { name:'purchaseOrder:create', group:PERMISSION_GROUPS.PURCHASE_MANAGEMENT, description:'Create purchase orders' },
  { name:'purchaseOrder:update', group:PERMISSION_GROUPS.PURCHASE_MANAGEMENT, description:'Update purchase orders' },
  { name:'purchaseOrder:cancel', group:PERMISSION_GROUPS.PURCHASE_MANAGEMENT, description:'Cancel purchase orders' },
  { name:'purchaseOrder:linkPayment', group:PERMISSION_GROUPS.PURCHASE_MANAGEMENT, description:'Link payments to purchase orders' },
  { name:'purchaseOrder:view', group:PERMISSION_GROUPS.PURCHASE_MANAGEMENT, description:'View purchase order details' },

  // POS
  { name:'pos:session:create', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Create POS sessions' },
  { name:'pos:session:update', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Update POS sessions' },
  { name:'pos:session:read', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'View POS sessions' },
  { name:'pos:session:view', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'View POS session details' },
  { name:'pos:transaction:create', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Create POS transactions' },
  { name:'pos:payment:create', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Process POS payments' },
  { name:'pos:return:create', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Process POS returns' },
  { name:'pos:cashdrop:create', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Record cash drops' },
  { name:'pos:reconcile:create', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Reconcile POS transactions' },

  // Sales Management
  { name:'sales:create', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Create sales records' },
  { name:'sales:read', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'View sales records' },
  { name:'sales:update', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Update sales records' },
  { name:'sales:delete', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Delete sales records' },
  { name:'sales:view', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'View sales details' },
  { name:'sale:process', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Process sales transactions' },
  { name:'sale:reverse', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Reverse sales transactions' },
  { name:'discount:manage', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Apply and manage discounts' },
  { name:'tax:manage', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Manage tax calculations' },
  { name:'loyalty:apply', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'Apply loyalty rewards' },
  { name:'loyalty:view', group:PERMISSION_GROUPS.SALES_MANAGEMENT, description:'View loyalty information' },

  // Supplier Management
  { name:'supplier:create', group:PERMISSION_GROUPS.SUPPLIER_MANAGEMENT, description:'Create supplier records' },
  { name:'supplier:update', group:PERMISSION_GROUPS.SUPPLIER_MANAGEMENT, description:'Update supplier details' },
  { name:'supplier:view', group:PERMISSION_GROUPS.SUPPLIER_MANAGEMENT, description:'View supplier information' },
  { name:'supplier:delete', group:PERMISSION_GROUPS.SUPPLIER_MANAGEMENT, description:'Delete supplier records' },

  // Customer Management
  { name:'crm:customer:create', group:PERMISSION_GROUPS.CUSTOMER_MANAGEMENT, description:'Create customer records' },
  { name:'crm:customer:update', group:PERMISSION_GROUPS.CUSTOMER_MANAGEMENT, description:'Update customer details' },
  { name:'crm:customer:view', group:PERMISSION_GROUPS.CUSTOMER_MANAGEMENT, description:'View customer information' },
  { name:'crm:customer:delete', group:PERMISSION_GROUPS.CUSTOMER_MANAGEMENT, description:'Delete customer records' },
  { name:'crm:customer:history', group:PERMISSION_GROUPS.CUSTOMER_MANAGEMENT, description:'View customer history' },

  // Communication Management
  { name:'crm:communication:create', group:PERMISSION_GROUPS.COMMUNICATION_MANAGEMENT, description:'Create customer communications' },
  { name:'crm:communication:view', group:PERMISSION_GROUPS.COMMUNICATION_MANAGEMENT, description:'View customer communications' },
  { name:'crm:communication:delete', group:PERMISSION_GROUPS.COMMUNICATION_MANAGEMENT, description:'Delete customer communications' },

  // CRM Reporting
  { name:'crm:report:create', group:PERMISSION_GROUPS.CRM_REPORTING, description:'Create CRM reports' },
  { name:'crm:report:view', group:PERMISSION_GROUPS.CRM_REPORTING, description:'View CRM reports' },
  { name:'crm:report:update', group:PERMISSION_GROUPS.CRM_REPORTING, description:'Update CRM reports' },

  // Payment Management
  { name:'payment:create', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Create payment records' },
  { name:'payment:read', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'View payment records' },
  { name:'payment:update', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Update payment records' },
  { name:'payment:delete', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Delete payment records' },
  { name:'payment:refund', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Process refunds' },
  { name:'payment:reverse', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Reverse payments' },
  { name:'payment:view', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'View payment details' },
  { name:'refund:create', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Create refund records' },
  { name:'refund:read', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'View refund records' },
  { name:'refund:update', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Update refund records' },
  { name:'refund:delete', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Delete refund records' },
  { name:'refund:view', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'View refund details' },
  { name:'cash:reconcile', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Reconcile cash transactions' },

  // Transactions
  { name:'transaction:create', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Create transaction records' },
  { name:'transaction:read', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'View transaction records' },
  { name:'transaction:update', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Update transaction records' },
  { name:'transaction:delete', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'Delete transaction records' },
  { name:'transaction:view', group:PERMISSION_GROUPS.PAYMENT_MANAGEMENT, description:'View transaction details' },

  // Reporting
  { name:'reporting:sales', group:PERMISSION_GROUPS.REPORTING, description:'Generate sales reports' },
  { name:'reporting:inventory', group:PERMISSION_GROUPS.REPORTING, description:'Generate inventory reports' },
  { name:'reporting:purchaseOrders', group:PERMISSION_GROUPS.REPORTING, description:'Generate purchase order reports' },
  { name:'reporting:transactions', group:PERMISSION_GROUPS.REPORTING, description:'Generate transaction reports' },
  { name:'reporting:payments', group:PERMISSION_GROUPS.REPORTING, description:'Generate payment reports' },
  { name:'reporting:b2bConnections', group:PERMISSION_GROUPS.REPORTING, description:'Generate B2B connection reports' },
  { name:'report:view', group:PERMISSION_GROUPS.REPORTING, description:'View system reports' },
  { name:'report:export', group:PERMISSION_GROUPS.REPORTING, description:'Export report data' },

  // Audit Management
  { name:'audit:view', group:PERMISSION_GROUPS.AUDIT_MANAGEMENT, description:'View audit logs' },

  // Role Management
  { name:'role:manage', group:PERMISSION_GROUPS.ROLE_MANAGEMENT, description:'Create and manage roles' },
  { name:'permission:assign', group:PERMISSION_GROUPS.ROLE_MANAGEMENT, description:'Assign permissions to roles' },
];

/**----------------------------------------------------------------------
 * 4) Role definitions, each role *extends* the master PERMISSIONS list
 *----------------------------------------------------------------------*/
export interface RoleDefinition {
  permissions: Permission[];
  isSuperAdmin?: boolean;   // global root
  isAdmin?:      boolean;   // tenant admin
  context?:      'global' | 'tenant' | 'store' | 'warehouse';
}

export const ROLES: Record<string, RoleDefinition> = {
  superAdmin: {
    permissions: [...PERMISSIONS],
    isSuperAdmin: true,
    isAdmin:      true,
    context:      'global',
  },

  globalAdmin: {
    permissions: [...PERMISSIONS],
    isSuperAdmin: false,
    isAdmin:      true,
    context:      'global',
  },

  tenantAdmin: {
    permissions: PERMISSIONS.filter(p => !p.startsWith('globalCategory') && !p.startsWith('globalProduct')),
    isAdmin:      true,
    context:      'tenant',
  },

  storeManager: {
    permissions: [
      // pull all "view" rights plus store-specific create/update
      ...PERMISSIONS.filter(p => p.endsWith(':view') || p.startsWith('tenant')),
      'store:update', 'store:settings',
      'tenantProduct:create', 'tenantProduct:update',
      'tenantCategory:create', 'tenantCategory:update',
      'inventory:create', 'inventory:update',
      'supplier:create', 'supplier:update',
      'purchaseOrder:create', 'purchaseOrder:update',
      'crm:customer:create', 'crm:customer:update',
      'crm:communication:create', 'crm:communication:view',
      'report:export',
    ],
    context: 'store',
  },

  cashier: {
    permissions: [
      'sale:process', 'sale:reverse', 'discount:manage', 'crm:customer:create', 'crm:customer:view',
      'payment:create', 'payment:read', 'payment:view',
      'cash:reconcile',
    ],
    context: 'store',
  },

  warehouseManager: {
    permissions: [
      'warehouse:view','warehouse:update',
      'inventory:create','inventory:update','inventory:adjust',
      'stockTransfer:create','stockTransfer:read','stockTransfer:update',
      'purchaseOrder:view',
    ],
    context: 'warehouse',
  },

  auditor: {
    permissions: [
      ...PERMISSIONS.filter(p => p.endsWith(':view')),
      'audit:view','report:export'
    ],
    context: 'tenant',
  },

  staff: {
    permissions: [
      'pos:transaction:create','pos:payment:create','pos:return:create',
      'pos:cashdrop:create','pos:reconcile:create',
      'stock:read','inventory:read',
    ],
    context: 'store',
  },
};




