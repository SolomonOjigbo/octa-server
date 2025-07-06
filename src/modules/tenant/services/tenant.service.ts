import { PrismaClient } from "@prisma/client";
import { 
  UpdateTenantDto, 
  TenantResponseDto,
  TenantWithRelationsDto,
  TenantOnboardingDto
} from "../types/tenant.dto";
import bcrypt from "bcryptjs";
import { permissionGroups } from "@prisma/permissionsAndRoles";

const prisma = new PrismaClient();

export class TenantService {
  
  async atomicOnboard(dto: TenantOnboardingDto) {
    return await prisma.$transaction(async (tx) => {
      // 1. Tenant
      const tenant = await tx.tenant.create({ data: dto.tenant });

      // 2. BusinessEntity
      const businessEntity = await tx.businessEntity.create({
        data: { ...dto.businessEntity, tenantId: tenant.id },
      });

      // 3. Store
      const store = await tx.store.create({
        data: {
          ...dto.store,
          tenantId: tenant.id,
          businessEntityId: businessEntity.id,
          isMain: dto.store.isMain ?? true,
        },
      });

      // 4. Admin user
      const hashedPwd = await bcrypt.hash(dto.adminUser.password, 10);
      const user = await tx.user.create({
        data: {
          ...dto.adminUser,
          tenantId: tenant.id,
          storeId: store.id,
          password: hashedPwd,
          isActive: true,
        },
      });

      // 5. Assign admin role (ensure role exists)
      let adminRole = await tx.role.findFirst({
        where: { name: "tenant_admin", tenantId: tenant.id },
      });
      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: "tenant_admin",
            tenantId: tenant.id,
            permissions: {
              connect: [
                // Connect all permissions or a defined set
                permissionGroups.TENANT_MANAGEMENT,
                permissionGroups.BUSINESS_ENTITY_MANAGEMENT,
                permissionGroups.STORE_MANAGEMENT,
                permissionGroups.USER_MANAGEMENT,
                permissionGroups.ROLE_MANAGEMENT,
                permissionGroups.AUDIT_MANAGEMENT,
                permissionGroups.REPORTING,
              ],
            },
          },
        });
      }
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      return { tenant, businessEntity, store, user };
    });
  }

  async updateTenant(dto: UpdateTenantDto, updatedBy?: string): Promise<TenantResponseDto> {
    const tenant = await prisma.tenant.update({ 
      where: { id: dto.id },
      data: {
        name: dto.name,
        slug: dto.slug,
        legalName: dto.legalName,
        contactEmail: dto.contactEmail,
        branding: dto.branding,
        settings: dto.settings,
      }
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      legalName: tenant.legalName || undefined,
      contactEmail: tenant.contactEmail || undefined,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      updatedBy: updatedBy || null //User's ID if provided
    };
  }

  async getTenants(userId?: string): Promise<TenantResponseDto[]> {
    const where = userId ? { 
      users: { some: { id: userId } } 
    } : {};

    const tenants = await prisma.tenant.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        legalName: true,
        contactEmail: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    });

    return tenants.map(t => ({
      ...t,
      legalName: t.legalName || undefined,
      contactEmail: t.contactEmail || undefined
    }));
  }

  async getTenantById(id: string, userId?: string): Promise<TenantWithRelationsDto | null> {
    const where = userId ? { 
      id, 
      users: { some: { id: userId } } 
    } : { id };

    const tenant = await prisma.tenant.findUnique({
      where,
      include: {
        businessEntities: {
          select: {
            id: true,
            name: true,
            taxId: true,
            legalAddress: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      }
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      legalName: tenant.legalName || undefined,
      contactEmail: tenant.contactEmail || undefined,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      businessEntities: tenant.businessEntities,
      users: tenant.users
    };
  }

  async deleteTenant(id: string, deletedBy?: string): Promise<void> {
    await prisma.tenant.delete({ 
      where: { id } 
    });
  }

  async getTenantsWithB2B(userId?: string): Promise<TenantWithRelationsDto[]> {
    const where = userId ? { 
      users: { some: { id: userId } } 
    } : {};

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        b2bConnectionsA: true,
        b2bConnectionsB: true,
        businessEntities: true
      }
    });

    return tenants.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      legalName: t.legalName || undefined,
      contactEmail: t.contactEmail || undefined,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      businessEntities: t.businessEntities,
      users: [] // Not loaded in this query
    }));
  }
}

export const tenantService = new TenantService();