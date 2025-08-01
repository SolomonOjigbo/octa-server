import bcrypt from "bcryptjs";
import { 
  PERMISSION_DEFINITIONS,
  ROLES
} from "./permissionsAndRoles";
import prisma from "../shared/infra/database/prisma";

async function main() {
  // 1. Seed permissions
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        group: permission.group,
        description: permission.description,
      },
      create: {
        name: permission.name,
        group: permission.group,
        description: permission.description,
      },
    });
  }

  // 2. Create root tenant
  const rootTenant = await prisma.tenant.upsert({
    where: { slug: "octa-root" },
    update: {},
    create: {
      name: "Octa Root System",
      slug: "octa-root",
      contactEmail: "ojigbosolomon@gmail.com",
      isSystem: true,
    },
  });

  // 3. Seed global roles (system-level)
  for (const [roleName, roleDef] of Object.entries(ROLES)) {
    if (roleDef.context === 'global') {
       await seedRole(roleName, roleDef, rootTenant.id);
    }

  }

  // Ensure root tenant has all global roles  

  // 4. Seed root business entity
  const rootEntity = await prisma.businessEntity.upsert({
    where: { name: "Octa Root Entity" },
    update: {},
    create: {
      name: "Octa Root Entity",
      tenantId: rootTenant.id,
    },
  });

  // 5. Seed root store and warehouse
  const rootStore = await prisma.store.upsert({
    where: { code: "ROOT-STORE" },
    update: {},
    create: {
      name: "Octa Root Store",
      code: "ROOT-STORE",
      type: "system",
      status: "active",
      tenantId: rootTenant.id,
      businessEntityId: rootEntity.id,
    },
  });

  const rootWarehouse = await prisma.warehouse.upsert({
    where: { code: "ROOT-WAREHOUSE" },
    update: {},
    create: {
      name: "Octa Root Warehouse",
      code: "ROOT-WAREHOUSE",
      status: "active",
      tenantId: rootTenant.id,
      businessEntityId: rootEntity.id,
    },
  });

  // 6. Create super admin user
  await seedUser({
    name: "Root Superuser",
    email: "solomonojigbo@gmail.com",
    password: "password123",
    role: "superAdmin",
    tenantId: rootTenant.id,
    storeId: rootStore.id,
    warehouseId: rootWarehouse.id,
    isEmailVerified: true,
    isSystem: true,
  });

  // 7. Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "octa-pharma-demo" },
    update: {},
    create: {
      name: "Octa Pharma Demo",
      slug: "octa-pharma-demo",
      contactEmail: "solomonojigbo6888@gmail.com",
    },
  });

  // 8. Seed tenant-specific roles
  for (const [roleName, roleDef] of Object.entries(ROLES)) {
        // For tenant roles (step 8):
    if (roleDef.context !== 'global') {
      await seedRole(roleName, roleDef, demoTenant.id);
    }
  }

  // 9. Create demo business entity
  const demoEntity = await prisma.businessEntity.upsert({
    where: { name: "Octa Demo Entity" },
    update: {},
    create: {
      name: "Octa Demo Entity",
      tenantId: demoTenant.id,
    },
  });

  // 10. Create demo store and warehouse
  const demoStore = await prisma.store.upsert({
    where: { code: "OCTA-DEMO-STORE" },
    update: {},
    create: {
      name: "Octa Demo Store",
      code: "OCTA-DEMO-STORE",
      type: "retail",
      status: "active",
      tenantId: demoTenant.id,
      businessEntityId: demoEntity.id,
      address: "123 Demo Street",
    },
  });

  const demoWarehouse = await prisma.warehouse.upsert({
    where: { code: "OCTA-DEMO-WAREHOUSE" },
    update: {},
    create: {
      name: "Octa Demo Warehouse",
      code: "OCTA-DEMO-WAREHOUSE",
      status: "active",
      tenantId: demoTenant.id,
      businessEntityId: demoEntity.id,
      address: "456 Warehouse Road",
    },
  });

  // 11. Seed demo users
  const demoUsers = [
    {
      name: "Tenant Admin",
      email: "solomonojigbo6888@gmail.com",
      password: "password123",
      role: "tenantAdmin",
      tenantId: demoTenant.id,
      isEmailVerified: true,
    },
    {
      name: "Store Manager",
      email: "omonthelegend@gmail.com",
      password: "password123",
      role: "storeManager",
      tenantId: demoTenant.id,
      storeId: demoStore.id,
      isEmailVerified: true,
    },
    {
      name: "Cashier",
      email: "cashier@demo-pharmacy.com",
      password: "password123",
      role: "cashier",
      tenantId: demoTenant.id,
      storeId: demoStore.id,
      isEmailVerified: true,
    },
    {
      name: "Warehouse Manager",
      email: "warehouse@demo-pharmacy.com",
      password: "password123",
      role: "warehouseManager",
      tenantId: demoTenant.id,
      warehouseId: demoWarehouse.id,
      isEmailVerified: true,
    },
    {
      name: "Auditor",
      email: "auditor@demo-pharmacy.com",
      password: "password123",
      role: "auditor",
      tenantId: demoTenant.id,
      isEmailVerified: true,
    },
  ];

  for (const userData of demoUsers) {
    await seedUser(userData);
  }
}

async function seedRole(
  roleName: string, 
  roleDef: typeof ROLES[string],
  tenantId: string
) {
  const permissions = await prisma.permission.findMany({
    where: { name: { in: roleDef.permissions } },
  });

  const roleData = {
    name: roleName,
    context: roleDef.context,
    description: `System-defined ${roleName} role`,
    isSystem: true,
    tenant: { connect: { id: tenantId } } 
  };

  const role = await prisma.role.upsert({
    where: {
      name_context: {  // Matches @@unique([name, context])
        name: roleName,
        context: roleDef.context || null,
      }
    },
    update: roleData,
    create: roleData,
  });

  // Connect permissions
  await prisma.role.update({
    where: { id: role.id },
    data: {
      permissions: {
        connect: permissions.map(p => ({ id: p.id })),
      },
    },
  });

  console.log(`Seeded ${roleName} role with ${permissions.length} permissions`);
}

async function seedUser(userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  tenantId: string;
  storeId?: string;
  warehouseId?: string;
  isEmailVerified?: boolean;
  isSystem?: boolean;
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      isEmailVerified: userData.isEmailVerified || false,
      tenantId: userData.tenantId,
      storeId: userData.storeId,
      warehouseId: userData.warehouseId,
      isActive: true,
    },
  });

  
  const role = await prisma.role.findFirst({
    where: {
      name: userData.role,
      tenantId: userData.tenantId
    },
  });

  if (!role) {
    console.warn(`Role "${userData.role}" not found for ${userData.email}`);
    return;
  }

  await prisma.userRole.upsert({
    where: { 
        userId_roleId_tenantId: { // Matches @@unique([userId, roleId, tenantId])
        userId: user.id,
        roleId: role.id,
        tenantId: userData.tenantId
        } 
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
      tenantId: userData.tenantId,
      assignedBy: "system",
    },
  });

  console.log(`Seeded user ${userData.email} as ${userData.role}`);
}

main()
  .then(() => {
    console.log("Database seeding completed successfully!");
    process.exit(0);
  })
  .catch(e => {
    console.error("Error during seeding:", e);
    process.exit(1);
  }).finally(() => prisma.$disconnect());