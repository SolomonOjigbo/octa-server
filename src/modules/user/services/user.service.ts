import { PrismaClient} from "@prisma/client";
import { CreateUserDto, UpdateUserDto } from "../types/user.dto";
import bcrypt from "bcryptjs";
import { NotFoundError } from "../../../middleware/errors";


const prisma = new PrismaClient();


export class UserService {
  async createUser(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    return prisma.user.create({
      data: { 
        ...dto, 
        password: hashedPassword,
        isActive: true 
      },
      include: { 
        roles: {
          include: {
            role: true
          }
        },
        store: true 
      }
    });
  }

  async updateUser(id: string, tenantId: string, dto: UpdateUserDto) {
    const existingUser = await this.verifyUserExists(id, tenantId);
    
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    return prisma.user.update({ 
      where: { id },
      data: dto,
      include: { 
        roles: {
          include: {
            role: true
          }
        },
        store: true 
      }
    });
  }

  async getUsers(params: {
    tenantId: string;
    page: number;
    limit: number;
    search?: string;
  }) {
    const { tenantId, page, limit, search } = params;
    const skip = (page - 1) * limit;
    
    const where = { tenantId };
    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { 
          roles: {
            include: {
              role: true
            }
          },
          store: true 
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id: string, tenantId: string) {
    const user = await prisma.user.findUnique({
      where: { id, tenantId },
      include: { 
        roles: {
          include: {
            role: true
          }
        },
        store: true 
      }
    });
    
    if (!user) {
      throw new NotFoundError("User not found");
    }
    
    return user;
  }

  async deactivateUser(id: string, tenantId: string) {
    await this.verifyUserExists(id, tenantId);
    
    return prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async deleteUser(id: string, tenantId: string) {
    await this.verifyUserExists(id, tenantId);
    
    const result = await prisma.user.delete({ 
      where: { id, tenantId }
    });
    
    if (!result) {
      throw new NotFoundError("User not found");
    }
    
    return result;
  }

  private async verifyUserExists(id: string, tenantId: string){
    const user = await prisma.user.findUnique({
      where: { id, tenantId }
    });
    
    if (!user) {
      throw new NotFoundError("User not found");
    }
    
    return user;
  }
}

export const userService = new UserService();