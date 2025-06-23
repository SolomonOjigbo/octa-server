
import { PrismaUserRepo } from './prismaUserRepo';
import { PrismaTenantRepo } from './prismaTenantRepo';
import prisma from '../../../shared/infra/database/prisma';


const userRepo  = new PrismaUserRepo(prisma);
const tenantRepo = new PrismaTenantRepo(prisma);

export { userRepo ,tenantRepo};
