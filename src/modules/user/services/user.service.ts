import { PrismaClient } from "@prisma/client";
import { CreateUserDto, UpdateUserDto } from "../types/user.dto";
import bcrypt from "bcryptjs"; // For password hashing

const prisma = new PrismaClient();

export class UserService {
  async createUser(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return prisma.user.create({
      data: { ...dto, password: hashedPassword },
    });
  }
  async updateUser(id: string, dto: UpdateUserDto) {
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    return prisma.user.update({ where: { id }, data: dto });
  }
  async getUsers(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      include: { roles: true, store: true },
    });
  }
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { roles: true, store: true },
    });
  }
  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}

export const userService = new UserService();


// type User = Awaited<ReturnType<typeof prisma.user.create>>;

// export class UserService {
//   async createUser(data: Partial<User>): Promise<User> {
//     return prisma.user.create({ data });
//   }

//   async getUserById(id: string): Promise<User | null> {
//     return prisma.user.findUnique({ where: { id } });
//   }

//   async updateUser(id: string, data: Partial<User>): Promise<User> {
//     return prisma.user.update({ where: { id }, data });
//   }

//   async deleteUser(id: string): Promise<User> {
//     return prisma.user.delete({ where: { id } });
//   }

//   async listUsersByTenant(tenantId: string): Promise<User[]> {
//     return prisma.user.findMany({ where: { tenantId } });
//   }
// }
