import prisma from "@shared/infra/database/prisma";
import { 
  UpdateTenantDto, 
  TenantResponseDto,
  TenantWithRelationsDto,
  TenantOnboardingDto
} from "../types/tenant.dto";
import bcrypt from "bcryptjs";
import { ROLES } from "../../../prisma/permissionsAndRoles";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4} from "uuid"
import { EVENTS } from "@events/events";
import { eventBus } from "@events/eventBus";
import { add } from "date-fns";



export class TenantService {
  /**
   * Onboards an entire Tenant in one atomic transaction:
   *   1) Tenant
   *   2) BusinessEntity
   *   3) Store
   *   4) Warehouse (default)
   *   5) Admin User
   *   6) tenant_admin Role + assignment
   */
  async atomicOnboard(dto: TenantOnboardingDto) {
    return prisma.$transaction(async (tx) => {
      // 1) Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenant.name,
          slug: dto.tenant.slug,
          legalName: dto.tenant.legalName,
          contactEmail: dto.tenant.contactEmail,
        },
      });

      // 2) Create BusinessEntity
      const businessEntity = await tx.businessEntity.create({
        data: {
          tenantId:    tenant.id,
          name:        dto.businessEntity.name,
          taxId:       dto.businessEntity.taxId,
          legalAddress:dto.businessEntity.legalAddress,
        },
      });

      // 3) Create default Store
      const store = await tx.store.create({
        data: {
          tenantId:           tenant.id,
          businessEntityId:   businessEntity.id,
          name:               dto.store.name,
          code:               dto.store.code,
          address:            dto.store.address,
          type:               dto.store.type,
          isMain:             dto.store.isMain ?? true,
          status:             'active'
        },
      });

      // 4) Create default Warehouse for this BusinessEntity
      //    Name it “<StoreName> Warehouse” by convention
      const warehouse = await tx.warehouse.create({
        data: {
          tenantId: tenant.id,
          businessEntityId: businessEntity.id,
          name: dto.warehouse?.name || `${dto.store.name} Warehouse`,
          address: dto.warehouse?.address || dto.store.address,
          status: 'ACTIVE',
          code: dto.warehouse.code,
        },
      });

      // 5) Create the Admin User
      const hashedPwd = await bcrypt.hash(dto.adminUser.password, 10);
      const user = await tx.user.create({
        data: {
          name:     dto.adminUser.name,
          email:    dto.adminUser.email,
          phone:    dto.adminUser.phone,
          password: hashedPwd,
          isActive: true,
          tenant:   { connect: { id: tenant.id } },
          store:    { connect: { id: store.id } },
        },
      });

      // 6) Seed or fetch the tenant_admin Role and assign to the new user
      let adminRole = await tx.role.findFirst({
        where: { name: 'tenantAdmin', tenantId: tenant.id },
      });

      if (!adminRole) {
        // Build connect-array from our ROLES constant
        const permsToConnect = ROLES.tenantAdmin.permissions.map((p) => ({ name: p }));

        adminRole = await tx.role.create({
          data: {
            name:    'tenantAdmin',
            tenant:  { connect: { id: tenant.id } },
            permissions: {
              connect: permsToConnect,
            },
          },
        });
      }

      await tx.userRole.create({
        data: {
          user: { connect: { id: user.id } },
          role: { connect: { id: adminRole.id } },
          tenant: {connect: {id: tenant.id}}
        },
      });

      // Generate verification token
    const verifyToken = uuidv4();
    const verifyExpires = add(new Date(), { hours: 24 });

    // Update user with verification token
    await tx.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyExpires }
    });

    // Emit event for welcome email and email verification
    eventBus.emit(EVENTS.TENANT_ONBOARDED, {
      tenantId: tenant.id,
      adminEmail: user.email,
      verifyToken,
      verifyExpires
    });

      return { tenant, businessEntity, store, warehouse, user };
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
        branding: dto.branding as Prisma.InputJsonValue,
        settings: dto.settings as Prisma.InputJsonValue,
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
      updatedBy: updatedBy || null
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
            legalAddress: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
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
      users: tenant.users,
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