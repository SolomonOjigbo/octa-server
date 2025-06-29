import { PrismaClient } from "@prisma/client";
import { 
  CreateTenantDto, 
  UpdateTenantDto, 
  TenantResponseDto,
  TenantWithRelationsDto
} from "../types/tenant.dto";
import { userService } from "../../user/services/user.service";
import { businessEntityService } from "../../businessEntity/services/businessEntity.service";
import { roleService } from "../../roles/services/role.service";

const prisma = new PrismaClient();

export class TenantService {
  async createTenant(dto: CreateTenantDto, createdBy?: string): Promise<TenantResponseDto> {
    return prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({ 
        data: {
          name: dto.name,
          slug: dto.slug,
          legalName: dto.legalName,
          contactEmail: dto.contactEmail,
          branding: dto.branding,
          settings: dto.settings
        }
      });

      // Create default business entity
      await businessEntityService.createEntity({
        tenantId: tenant.id,
        name: dto.name,
        legalAddress: dto.legalName ? `${dto.legalName} Headquarters` : undefined
      });

      // Create default roles for tenant
      await roleService.createRole(tenant.id);

      // Create admin user if provided
      if (dto.adminUser) {
        await userService.createUser({
          tenantId: tenant.id,
          email: dto.adminUser.email,
          name: dto.adminUser.name,
          password: dto.adminUser.password,
          isActive: true,
          roles: ['Tenant Admin'] // Assign default admin role
        });
      }

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        legalName: tenant.legalName || undefined,
        contactEmail: tenant.contactEmail || undefined,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      };
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
        settings: dto.settings
      }
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      legalName: tenant.legalName || undefined,
      contactEmail: tenant.contactEmail || undefined,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
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