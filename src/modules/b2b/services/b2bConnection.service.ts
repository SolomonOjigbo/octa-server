import { CreateB2BConnectionDto, ConnectionActionDto } from '../types/b2bConnection.dto';
import { cacheService } from '@cache/cache.service';
import { auditService } from '@modules/audit/services/audit.service';
import { eventBus } from '@events/eventBus';
import { EVENTS } from '@events/events';
import { AppError } from '@common/constants/app.errors';
import prisma from '@shared/infra/database/prisma';
import { HttpStatusCode } from '@common/constants/http';
import { customerService } from '@modules/crm/services/customer.service';


export class B2BConnectionService {
  private cacheKey(tenantId: string) {
    return `b2b_connections:${tenantId}`;
  }

  async list(tenantId: string) {
    const key = this.cacheKey(tenantId);
    const cached = await cacheService.get(key);
    if (cached) return cached;
    const conns = await prisma.b2BConnection.findMany({
      where: { OR: [{ tenantAId: tenantId }, { tenantBId: tenantId }] },
    });
    await cacheService.set(key, conns, 300);
    return conns;
  }

  async getById(tenantId: string, id: string) {
    const conn = await prisma.b2BConnection.findUnique({ where: { id } });
    if (!conn) throw new AppError('Connection not found', 404);
    if (conn.tenantAId !== tenantId && conn.tenantBId !== tenantId)
      throw new AppError('Forbidden', 403);
    return conn;
  }

  async create(tenantAId: string, userId: string, dto: CreateB2BConnectionDto) {
    if (tenantAId === dto.tenantBId) throw new AppError('Cannot connect to self', 400);
    const exists = await prisma.b2BConnection.findFirst({
      where: {
        OR: [
          { tenantAId, tenantBId: dto.tenantBId },
          { tenantAId: dto.tenantBId, tenantBId: tenantAId },
        ],
        status: { in: ['pending', 'approved'] },
      },
    });
    if (exists) throw new AppError('Connection already exists', 400);

    const conn = await prisma.b2BConnection.create({
      data: { tenantAId, tenantBId: dto.tenantBId, status: 'pending', settings: dto.settings },
    });

    await cacheService.del(this.cacheKey(tenantAId));
    await cacheService.del(this.cacheKey(dto.tenantBId));

    await auditService.log({
      tenantId: tenantAId,
      userId,
      module: 'B2BConnection',
      action: 'create',
      entityId: conn.id,
      details: dto,
    });

    eventBus.emit(EVENTS.B2B_CONNECTION_CREATED, conn);
    return conn;
  }

  async approve(tenantId: string, userId: string, id: string) {
    const conn = await this.getById(tenantId, id);
    if (conn.status !== 'pending') throw new AppError('Not pending', 400);
    if (conn.tenantBId !== tenantId) throw new AppError('Only requested party can approve', 403);

    const updated = await prisma.b2BConnection.update({
      where: { id },
      data: { status: 'approved' },
    });
    
    const tenantA = await prisma.tenant.findUnique({ where: { id: conn.tenantAId  } });

    await customerService.createCustomerForTenantB(tenantA, tenantId);

    await cacheService.del(this.cacheKey(conn.tenantAId));
    await cacheService.del(this.cacheKey(conn.tenantBId));

    await auditService.log({
      tenantId,
      userId,
      module: 'B2BConnection',
      action: 'approve',
      entityId: id,
      details: {},
    });

    eventBus.emit(EVENTS.B2B_CONNECTION_APPROVED, updated);
    return updated;
  }

  async reject(tenantId: string, userId: string, id: string, dto: ConnectionActionDto) {
    const conn = await this.getById(tenantId, id);
    if (conn.status !== 'pending') throw new AppError('Not pending', 400);
    if (conn.tenantBId !== tenantId) throw new AppError('Only requested party can reject', 403);

    const updated = await prisma.b2BConnection.update({
      where: { id },
      data: { status: 'rejected' },
    });

    await cacheService.del(this.cacheKey(conn.tenantAId));
    await cacheService.del(this.cacheKey(conn.tenantBId));

    await auditService.log({
      tenantId,
      userId,
      module: 'B2BConnection',
      action: 'reject',
      entityId: id,
      details: dto,
    });

    eventBus.emit(EVENTS.B2B_CONNECTION_REJECTED, updated);
    return updated;
  }

  async revoke(tenantId: string, userId: string, id: string, reason : string) {
    const conn = await this.getById(tenantId, id);
    if (!['pending', 'approved'].includes(conn.status))
      throw new AppError('Cannot revoke in current state', 400);
    if (conn.tenantAId !== tenantId && conn.tenantBId !== tenantId)
      throw new AppError('Forbidden', 403);

    const updated = await prisma.b2BConnection.update({
      where: { id },
      data: { status: 'revoked' },
    });

    await cacheService.del(this.cacheKey(conn.tenantAId));
    await cacheService.del(this.cacheKey(conn.tenantBId));

    await auditService.log({
      tenantId,
      userId,
      module: 'B2BConnection',
      action: 'revoke',
      entityId: id,
      details: {reason},
    });

    eventBus.emit(EVENTS.B2B_CONNECTION_REVOKED, updated);
    return updated;
  }

/** Finds a single connection between two tenants, regardless of ordering */
async findConnection(tenantAId: string, tenantBId: string) {
  return prisma.b2BConnection.findFirst({
    where: {
      OR: [
        { tenantAId, tenantBId },
        { tenantAId: tenantBId, tenantBId: tenantAId },
      ],
    },
  });
}

async ensureConnectionExists(tenantAId: string, tenantBId: string) {
  const connection = await prisma.b2BConnection.findFirst({
    where: {
      OR: [
        { tenantAId, tenantBId },
        { tenantAId: tenantBId, tenantBId: tenantAId }
      ],
      status: 'approved',
    }
  });

  if (!connection) {
    throw new AppError(
      `No approved B2B connection between tenants: ${tenantAId} and ${tenantBId}`, HttpStatusCode.FORBIDDEN

    );
  }

  return connection;
}

// async createOrUpdateWithSupplierProduct(tenantAId, tenantBId, productId, supplierId) {
//   const connection = await prisma.b2BConnection.upsert({
//     where: {
//       uniqueConnection: {
//         tenantAId,
//         tenantBId
//       }
//     },
//     update: {
//       updatedAt: new Date(),
//     },
//     create: {
//       tenantAId,
//       tenantBId,
//       status: 'approved',
//     }
//   });

//   // Link the product to supplier under B2B context
//   await prisma.productSupplier.upsert({
//     where: {
//       unique_supplier_product: {
//         productId,
//         supplierId,
//       },
//     },
//     update: {},
//     create: {
//       tenantId: tenantAId,
//       productId,
//       supplierId,
//     },
//   });

//   return connection;
// }


}

export const b2bConnectionService = new B2BConnectionService();
