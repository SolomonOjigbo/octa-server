import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CreateUserDto, UpdateUserDto } from "../types/user.dto";

const prisma = new PrismaClient();

export class UserService {
  async createUser(dto: CreateUserDto) {
    // 1. Tenant must exist
    const tenant = await prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new Error("Invalid tenantId.");

    // 2. If store provided, it must belong to that tenant
    if (dto.storeId) {
      const store = await prisma.store.findUnique({ where: { id: dto.storeId } });
      if (!store || store.tenantId !== dto.tenantId) {
        throw new Error("storeId is invalid for this tenant.");
      }
    }

    // 3. Email must be unique within the tenant
    const conflict = await prisma.user.findFirst({
      where: { email: dto.email, tenantId: dto.tenantId },
    });
    if (conflict) throw new Error("Email already in use for this tenant.");

    // 4. Hash password
    const hashed = await bcrypt.hash(dto.password, 10);

    // 5. Create
    return prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        storeId: dto.storeId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashed,
        isRoot: dto.isRoot ?? false,
        isActive: true,
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    // 1. If changing store, validate
    if (dto.storeId) {
      const store = await prisma.store.findUnique({ where: { id: dto.storeId } });
      if (!store) throw new Error("Invalid storeId.");
    }
    // 2. If changing email, enforce uniqueness
    if (dto.email) {
      const conflict = await prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (conflict) throw new Error("Email already in use.");
    }
    // 3. If changing password, hash it
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    // 4. Update
    return prisma.user.update({ where: { id }, data: dto as any });
  }

  async getUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      include: { roles: { include: { role: true } } },
    });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }
}

export const userService = new UserService();
