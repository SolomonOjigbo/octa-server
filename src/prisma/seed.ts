import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { 
  permissionGroups,
  permissions, 
  defaultRoles 
} from "./permissionsAndRoles";

const prisma = new PrismaClient();

async function main() {
  // Seed permissions with groups and descriptions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        group: permission.group,
        description: permission.description,
        isSystem: permission.isSystem || false
      },
      create: {
        name: permission.name,
        group: permission.group,
        description: permission.description,
        isSystem: permission.isSystem || false
      },
    });
  }

  // Seed system roles (global context)
  for (const roleDef of defaultRoles.filter(r => r.isSystem)) {
    await seedRole(roleDef);
  }

  // Demo tenant (create if not exists)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-pharmacy" },
    update: {},
    create: {
      name: "Demo Pharmacy Chain",
      slug: "demo-pharmacy",
      contactEmail: "info@demo-pharmacy.com",
    },
  });

  // Seed tenant-specific roles
  for (const roleDef of defaultRoles.filter(r => !r.isSystem)) {
    await seedRole(roleDef, tenant.id);
  }

  // Demo store
  const store = await prisma.store.upsert({
    where: { code: "DEMOSTORE" },
    update: {},
    create: {
      name: "Demo Main Store",
      code: "DEMOSTORE",
      type: "retail",
      status: "active",
      tenantId: tenant.id,
      address: "123 Demo Street",
      phone: "+1234567890",
      email: "store@demo-pharmacy.com"
    },
  });

  // Demo warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: "DEMOWH" },
    update: {},
    create: {
      name: "Demo Warehouse",
      code: "DEMOWH",
      tenantId: tenant.id,
      address: "456 Warehouse Road"
    },
  });

  // Users with roles to assign (passwords: all "password123" for demo)
  const demoUsers = [
    {
      name: "Root Superuser",
      email: "solomonojigbo@gmail.com",
      password: "password123",
      isRoot: true,
      role: "System Admin",
      note: "Full access to all tenants, superadmin.",
    },
    {
      name: "Tenant Admin",
      email: "admin@demo-pharmacy.com",
      password: "password123",
      isRoot: false,
      role: "Tenant Admin",
      note: "Admin of demo tenant.",
    },
    {
      name: "Store Manager",
      email: "manager@demo-pharmacy.com",
      password: "password123",
      isRoot: false,
      role: "Store Manager",
      storeId: store.id,
    },
    {
      name: "Pharmacist",
      email: "pharmacist@demo-pharmacy.com",
      password: "password123",
      isRoot: false,
      role: "Pharmacist",
      storeId: store.id,
    },
    {
      name: "Cashier",
      email: "cashier@demo-pharmacy.com",
      password: "password123",
      isRoot: false,
      role: "Cashier",
      storeId: store.id,
    },
    {
      name: "Warehouse Manager",
      email: "whmanager@demo-pharmacy.com",
      password: "password123",
      isRoot: false,
      role: "Warehouse Manager",
      warehouseId: warehouse.id,
    },
    {
      name: "Auditor",
      email: "auditor@demo-pharmacy.com",
      password: "password123",
      isRoot: false,
      role: "Auditor",
    },
  ];

  for (const demo of demoUsers) {
    await seedUser(demo, tenant.id);
  }
}

async function seedRole(roleDef: typeof defaultRoles[0], tenantId?: string) {
  // Create Role
  const role = await prisma.role.upsert({
    where: { 
      name_context: {
        name: roleDef.name,
        context: roleDef.context || null
      }
    },
    update: {
      description: roleDef.description,
      isSystem: roleDef.isSystem || false,
      tenantId: tenantId || null
    },
    create: {
      name: roleDef.name,
      description: roleDef.description,
      isSystem: roleDef.isSystem || false,
      context: roleDef.context || null,
      tenantId: tenantId || null
    },
  });

  // Get permissions for this role
  const perms = await prisma.permission.findMany({
    where: { name: { in: roleDef.permissions } },
  });

  // Set role-permissions relation
  await prisma.role.update({
    where: { id: role.id },
    data: {
      permissions: {
        set: perms.map(p => ({ id: p.id })),
      },
    },
  });

  console.log(`Seeded role ${role.name} with ${perms.length} permissions`);
}

async function seedUser(userData: {
  name: string;
  email: string;
  password: string;
  isRoot: boolean;
  role: string;
  storeId?: string;
  warehouseId?: string;
  note?: string;
}, tenantId: string) {
  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Upsert user
  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      isRoot: userData.isRoot,
      tenantId: tenantId,
      storeId: userData.storeId || null,
      warehouseId: userData.warehouseId || null,
      isActive: true,
    },
  });

  // Find role (by name and context)
  const role = await prisma.role.findFirst({
    where: {
      name: userData.role,
      // System roles have no tenant, others are tenant-specific
      tenantId: userData.isRoot ? null : tenantId
    },
  });

  if (!role) {
    console.warn(`Role "${userData.role}" not found for user ${userData.email}!`);
    return;
  }

  // Upsert UserRole
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: user.id, roleId: role.id },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
      tenantId: tenantId,
      assignedBy: "system",
    },
  });

  console.log(`Seeded user ${userData.email} with role ${userData.role}`);
}

main()
  .then(() => {
    console.log("Database seeding completed successfully!");
    process.exit(0);
  })
  .catch(e => {
    console.error("Error during seeding:", e);
    process.exit(1);
  });