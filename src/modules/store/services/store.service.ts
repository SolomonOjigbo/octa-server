import { PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

type Store = Awaited<ReturnType<typeof prisma.store.create>>;

export class StoreService {
  async createStore(data: Partial<Store>): Promise<Store> {
    return prisma.store.create({ data });
  }

  async getStoreById(id: string): Promise<Store | null> {
    return prisma.store.findUnique({ where: { id } });
  }

  async updateStore(id: string, data: Partial<Store>): Promise<Store> {
    return prisma.store.update({ where: { id }, data });
  }

  async deleteStore(id: string): Promise<Store> {
    return prisma.store.delete({ where: { id } });
  }

  async listStoresByTenant(tenantId: string): Promise<Store[]> {
    return prisma.store.findMany({ where: { tenantId } });
  }
}
