export const permissionGroups = {
  USER_MANAGEMENT: 'User Management',
  TENANT_MANAGEMENT: 'Tenant Management',
  BUSINESS_ENTITY_MANAGEMENT: 'Business Entity',
  STORE_MANAGEMENT: 'Store Management',
  WAREHOUSE_MANAGEMENT: 'Warehouse Management',
  PRODUCT_MANAGEMENT: 'Product Management',
  INVENTORY_MANAGEMENT: 'Inventory Management',
  SUPPLIER_MANAGEMENT: 'Supplier Management',
  PURCHASE_MANAGEMENT: 'Purchase Management',
  SALES_MANAGEMENT: 'Sales Management',
  CUSTOMER_MANAGEMENT: 'Customer Management',
  COMMUNICATION_MANAGEMENT: 'Communication Management',
  CRM_REPORTING: 'CRM Reporting',
  PAYMENT_MANAGEMENT: 'Payment Management',
  ROLE_MANAGEMENT: 'Role Management',
  AUDIT_MANAGEMENT: 'Audit Management',
  REPORTING: 'Reporting'
};

export const permissions = [
  // User Management
  { name: "user:create", group: permissionGroups.USER_MANAGEMENT, description: "Create new users" },
  { name: "user:update", group: permissionGroups.USER_MANAGEMENT, description: "Update user details" },
  { name: "user:view", group: permissionGroups.USER_MANAGEMENT, description: "View user information" },
  { name: "user:delete", group: permissionGroups.USER_MANAGEMENT, description: "Deactivate/delete users" },
  { name: "user:assign_role", group: permissionGroups.USER_MANAGEMENT, description: "Assign roles to users" },
  
  // Tenant Management
  { name: "tenant:create", group: permissionGroups.TENANT_MANAGEMENT, isSystem: true, description: "Create new tenants" },
  { name: "tenant:update", group: permissionGroups.TENANT_MANAGEMENT, description: "Update tenant details" },
  { name: "tenant:view", group: permissionGroups.TENANT_MANAGEMENT, description: "View tenant information" },
  
  // Business Entity
  { name: "business_entity:create", group: permissionGroups.BUSINESS_ENTITY_MANAGEMENT, description: "Create business entities" },
  { name: "business_entity:update", group: permissionGroups.BUSINESS_ENTITY_MANAGEMENT, description: "Update business entities" },
  { name: "business_entity:view", group: permissionGroups.BUSINESS_ENTITY_MANAGEMENT, description: "View business entities" },
  
  // Store Management
  { name: "store:create", group: permissionGroups.STORE_MANAGEMENT, description: "Create stores" },
  { name: "store:update", group: permissionGroups.STORE_MANAGEMENT, description: "Update stores" },
  { name: "store:view", group: permissionGroups.STORE_MANAGEMENT, description: "View stores" },
  { name: "store:settings", group: permissionGroups.STORE_MANAGEMENT, description: "Manage store settings" },
  
  // Warehouse Management
  { name: "warehouse:create", group: permissionGroups.WAREHOUSE_MANAGEMENT, description: "Create warehouses" },
  { name: "warehouse:update", group: permissionGroups.WAREHOUSE_MANAGEMENT, description: "Update warehouses" },
  { name: "warehouse:view", group: permissionGroups.WAREHOUSE_MANAGEMENT, description: "View warehouses" },
  
  // Product Management
  { name: "product:create", group: permissionGroups.PRODUCT_MANAGEMENT, description: "Create products" },
  { name: "product:update", group: permissionGroups.PRODUCT_MANAGEMENT, description: "Update products" },
  { name: "product:view", group: permissionGroups.PRODUCT_MANAGEMENT, description: "View products" },
  { name: "product:delete", group: permissionGroups.PRODUCT_MANAGEMENT, description: "Delete products" },
  { name: "category:create", group: permissionGroups.PRODUCT_MANAGEMENT, description: "Create product categories" },
  { name: "category:update", group: permissionGroups.PRODUCT_MANAGEMENT, description: "Update product categories" },
  { name: "category:view", group: permissionGroups.PRODUCT_MANAGEMENT, description: "View product categories" },
  
  // Inventory Management
  { name: "inventory:create", group: permissionGroups.INVENTORY_MANAGEMENT, description: "Create inventory records" },
  { name: "inventory:update", group: permissionGroups.INVENTORY_MANAGEMENT, description: "Update inventory records" },
  { name: "inventory:view", group: permissionGroups.INVENTORY_MANAGEMENT, description: "View inventory records" },
  { name: "inventory:adjust", group: permissionGroups.INVENTORY_MANAGEMENT, description: "Adjust inventory levels" },
  { name: "stock:transfer", group: permissionGroups.INVENTORY_MANAGEMENT, description: "Manage stock transfers" },
  
  // Supplier Management
  { name: "supplier:create", group: permissionGroups.SUPPLIER_MANAGEMENT, description: "Create suppliers" },
  { name: "supplier:update", group: permissionGroups.SUPPLIER_MANAGEMENT, description: "Update suppliers" },
  { name: "supplier:view", group: permissionGroups.SUPPLIER_MANAGEMENT, description: "View suppliers" },
  
  // Purchase Management
  { name: "purchase_order:create", group: permissionGroups.PURCHASE_MANAGEMENT, description: "Create purchase orders" },
  { name: "purchase_order:update", group: permissionGroups.PURCHASE_MANAGEMENT, description: "Update purchase orders" },
  { name: "purchase_order:view", group: permissionGroups.PURCHASE_MANAGEMENT, description: "View purchase orders" },
  { name: "purchase_payment:manage", group: permissionGroups.PURCHASE_MANAGEMENT, description: "Manage purchase payments" },
  
  // Sales Management
  { name: "sale:process", group: permissionGroups.SALES_MANAGEMENT, description: "Process sales" },
  { name: "sale:reverse", group: permissionGroups.SALES_MANAGEMENT, description: "Reverse sales" },
  { name: "discount:manage", group: permissionGroups.SALES_MANAGEMENT, description: "Manage discounts" },
  { name: "tax:manage", group: permissionGroups.SALES_MANAGEMENT, description: "Manage taxes" },
  { name: "loyalty:apply", group: permissionGroups.SALES_MANAGEMENT, description: "Apply loyalty points" },
  { name: "loyalty:view", group: permissionGroups.SALES_MANAGEMENT, description: "View loyalty programs" },

//<----CRM MANAGEMENT ----->
  
  // Customer Management
  { name: "crm:customer:create", group: permissionGroups.CUSTOMER_MANAGEMENT, description: "Create customers" },
  { name: "crm:customer:update", group: permissionGroups.CUSTOMER_MANAGEMENT, description: "Update customers" },
  { name: "crm:customer:view", group: permissionGroups.CUSTOMER_MANAGEMENT, description: "View customers" },
  { name: "crm:customer:delete", group: permissionGroups.CUSTOMER_MANAGEMENT, description: "Delete customer" },
  { name: "crm:customer:history", group: permissionGroups.CUSTOMER_MANAGEMENT, description: "View customer history" },
  { name: "crm:communication:manage", group: permissionGroups.CUSTOMER_MANAGEMENT, description: "Manage communication logs" },
  
  
  //Communication Logs
  { name: "crm:communication:create", group: permissionGroups.COMMUNICATION_MANAGEMENT, description: "Create communication logs" },
  { name: "crm:communication:view", group: permissionGroups.COMMUNICATION_MANAGEMENT, description: "Manage communication logs" },
  { name: "crm:communication:delete", group: permissionGroups.COMMUNICATION_MANAGEMENT, description: "Manage communication logs" },


  //CRM Report 
  { name: "crm:report:create", group: permissionGroups.CRM_REPORTING, description: "Create CRM Reports" },
  { name: "crm:report:view", group: permissionGroups.CRM_REPORTING, description: "View CRM report" },
  { name: "crm:report:update", group: permissionGroups.CRM_REPORTING, description: "Manage CRM Reporting" },
  
  // Payment Management
  { name: "payment:manage", group: permissionGroups.PAYMENT_MANAGEMENT, description: "Manage payments" },
  { name: "payment:view", group: permissionGroups.PAYMENT_MANAGEMENT, description: "View payments" },
  { name: "refund:process", group: permissionGroups.PAYMENT_MANAGEMENT, description: "Process refunds" },
  { name: "cash:reconcile", group: permissionGroups.PAYMENT_MANAGEMENT, description: "Reconcile cash" },
  
  // Role Management
  { name: "role:manage", group: permissionGroups.ROLE_MANAGEMENT, description: "Manage roles" },
  { name: "permission:assign", group: permissionGroups.ROLE_MANAGEMENT, description: "Assign permissions" },
  
  // Audit Management
  { name: "audit:view", group: permissionGroups.AUDIT_MANAGEMENT, description: "View audit logs" },
  
  // Reporting
  { name: "report:view", group: permissionGroups.REPORTING, description: "View reports" },
  { name: "report:export", group: permissionGroups.REPORTING, description: "Export reports" }
];

export const defaultPermissions = [
  "user:view",
  "tenant:view",
  "store:view",
  "warehouse:view",
  "product:view",
  "category:view",
  "inventory:view",
  "supplier:view",
  "purchase_order:view",
  "sale:process",
  "customer:view",
  "payment:manage",
  "report:view"
];

export const defaultRoles = [
  {
    name: "System Admin",
    description: "Full system access with all permissions",
    isSystem: true,
    permissions: permissions.map(p => p.name),
    context: "global"
  },
  {
    name: "Tenant Admin",
    description: "Full access to all tenant operations",
    permissions: permissions
      .filter(p => !p.isSystem)
      .map(p => p.name),
    context: "tenant"
  },
  {
    name: "Store Manager",
    description: "Manage store operations and staff",
    permissions: [
      ...defaultPermissions,
      "store:update",
      "store:settings",
      "product:create",
      "product:update",
      "category:create",
      "category:update",
      "inventory:create",
      "inventory:update",
      "supplier:create",
      "supplier:update",
      "purchase_order:create",
      "purchase_order:update",
      "customer:create",
      "customer:update",
      "communication:manage",
      "report:export"
    ],
    context: "store"
  },
  {
    name: "Pharmacist",
    description: "Dispense medications and manage pharmacy operations",
    permissions: [
      ...defaultPermissions.filter(p => !p.startsWith("payment:")),
      "product:create",
      "product:update",
      "inventory:create",
      "inventory:update",
      "customer:create",
      "customer:update",
      "communication:manage"
    ],
    context: "store"
  },
  {
    name: "Cashier",
    description: "Process sales and handle payments",
    permissions: [
      "sale:process",
      "sale:reverse",
      "discount:manage",
      "customer:create",
      "customer:view",
      "payment:manage",
      "cash:reconcile"
    ],
    context: "store"
  },
  {
    name: "Warehouse Manager",
    description: "Manage inventory and warehouse operations",
    permissions: [
      "warehouse:view",
      "warehouse:update",
      "product:view",
      "inventory:create",
      "inventory:update",
      "inventory:adjust",
      "stock:transfer",
      "purchase_order:view",
      "report:view"
    ],
    context: "warehouse"
  },
  {
    name: "Auditor",
    description: "View all data for auditing purposes",
    permissions: [
      ...permissions
        .filter(p => p.name.startsWith("view:") || p.name.endsWith(":view"))
        .map(p => p.name),
      "audit:view",
      "report:export"
    ],
    context: "tenant"
  }
];