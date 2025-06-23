import { PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();


type StockTransfer = Awaited<ReturnType<typeof prisma.stockTransfer.create>>;

export class StockTransferService {
  async requestTransfer(data: Partial<StockTransfer>): Promise<StockTransfer> {
    return prisma.stockTransfer.create({ data });
  }

  async approveTransfer(id: string, approvedBy: string): Promise<StockTransfer> {
    return prisma.stockTransfer.update({
      where: { id },
      data: { status: "approved", approvedBy }
    });
  }

  async completeTransfer(id: string): Promise<StockTransfer> {
    return prisma.stockTransfer.update({
      where: { id },
      data: { status: "completed" }
    });
  }

  async listPendingTransfers(storeId: string): Promise<StockTransfer[]> {
    return prisma.stockTransfer.findMany({
      where: {
        toStoreId: storeId,
        status: "pending"
      }
    });
  }

  async getTransferById(id: string): Promise<StockTransfer | null> {
    return prisma.stockTransfer.findUnique({ where: { id } });
  }
}
