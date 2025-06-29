import { PrismaClient } from "@prisma/client";
import { 
  CreateB2BConnectionDto, 
  UpdateB2BConnectionDto,
  B2BConnectionResponseDto,
  B2BConnectionWithRelationsDto,
  B2BConnectionStatus
} from "../types/b2bConnection.dto";

const prisma = new PrismaClient();

export class B2BConnectionService {
  async createConnection(
    dto: CreateB2BConnectionDto,
    createdBy?: string
  ): Promise<B2BConnectionResponseDto> {
    // Prevent duplicate connections
    const existingConnection = await prisma.b2BConnection.findFirst({
      where: {
        OR: [
          { tenantAId: dto.tenantAId, tenantBId: dto.tenantBId },
          { tenantAId: dto.tenantBId, tenantBId: dto.tenantAId }
        ]
      }
    });

    if (existingConnection) {
      throw new Error("B2B connection already exists between these tenants");
    }

    return prisma.b2BConnection.create({
      data: {
        tenantAId: dto.tenantAId,
        tenantBId: dto.tenantBId,
        status: dto.status || "pending",
        settings: dto.settings,
        metadata: {
          createdBy
        }
      },
      select: this.defaultSelectFields()
    });
  }

  async getConnectionById(
    id: string,
    requestingTenantId?: string
  ): Promise<B2BConnectionWithRelationsDto | null> {
    const where = requestingTenantId ? { 
      id,
      OR: [
        { tenantAId: requestingTenantId },
        { tenantBId: requestingTenantId }
      ]
    } : { id };

    return prisma.b2BConnection.findUnique({
      where,
      select: {
        ...this.defaultSelectFields(),
        purchaseOrders: {
          select: {
            id: true,
            status: true,
            orderDate: true
          },
          take: 5,
          orderBy: { orderDate: 'desc' }
        },
        stockTransfers: {
          select: {
            id: true,
            status: true,
            transferType: true
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async updateConnection(
    dto: UpdateB2BConnectionDto,
    updatedBy?: string
  ): Promise<B2BConnectionResponseDto> {
    return prisma.b2BConnection.update({
      where: { id: dto.id },
      data: {
        status: dto.status,
        settings: dto.settings,
        metadata: {
          updatedBy
        }
      },
      select: this.defaultSelectFields()
    });
  }

  async deleteConnection(
    id: string,
    requestingTenantId?: string
  ): Promise<void> {
    const where = requestingTenantId ? { 
      id,
      OR: [
        { tenantAId: requestingTenantId },
        { tenantBId: requestingTenantId }
      ]
    } : { id };

    await prisma.b2BConnection.deleteMany({ where });
  }

  async listConnectionsForTenant(
    tenantId: string,
    status?: B2BConnectionStatus
  ): Promise<B2BConnectionResponseDto[]> {
    const where = {
      OR: [
        { tenantAId: tenantId },
        { tenantBId: tenantId }
      ],
      ...(status && { status })
    };

    return prisma.b2BConnection.findMany({
      where,
      select: this.defaultSelectFields(),
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveConnection(
    id: string,
    approvingTenantId: string,
    approvedBy?: string
  ): Promise<B2BConnectionResponseDto> {
    // Verify the approving tenant is part of this connection
    const connection = await prisma.b2BConnection.findUnique({
      where: { 
        id,
        OR: [
          { tenantAId: approvingTenantId },
          { tenantBId: approvingTenantId }
        ],
        status: 'pending'
      }
    });

    if (!connection) {
      throw new Error("Connection not found or not pending approval");
    }

    return this.updateConnection({
      id,
      status: 'approved'
    }, approvedBy);
  }

  private defaultSelectFields() {
    return {
      id: true,
      tenantAId: true,
      tenantBId: true,
      status: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
      tenantA: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      tenantB: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    };
  }
}

export const b2bConnectionService = new B2BConnectionService();