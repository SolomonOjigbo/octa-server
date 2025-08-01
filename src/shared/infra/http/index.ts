import 'module-alias/register';
import { authService } from "../../../modules/auth/services/auth.service";
import { Middleware } from "./middleware/Middleware";
import { RequestMiddleware } from "./middleware/RequestMiddleware";
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v1Router } from './api/v1';
import { errorHandler } from '../../../middleware/errorHandler';
import logger from '../config/logger';
import { swaggerUiHandler, swaggerUiSetup } from "../config/swagger";
import "@modules/tenantCatalog/tenantCatalog.subscriber";
import "@modules/globalCatalog/globalCatalog.subscriber";
import "@modules/pos/posSession.subscriber";
import "@modules/invoice/invoice.subscriber";
import "@modules/reconciliation/reconciliation.subscriber";
import "@modules/stockTransfer/stockTransfer.subscriber";
import "@modules/auth/auth.subscriber";
import "@modules/tenant/tenant.subscriber";
import "@modules/payments/payments.subscriber";
import "@modules/transactions/transactions.subscriber";
import { PrismaClient } from '@prisma/client';
import { eventBus } from '@events/eventBus';
import { notificationService } from '@modules/notification/services/notification.service';
import { userRoleService } from '@modules/userRole/services/userRole.service';
import { createInventorySubscriber } from '@modules/inventory/inventory.subscriber';
import { createStockTransferSubscriber } from '@modules/stockTransfer/stockTransfer.subscriber';
import { inventoryService } from '@modules/inventory/services/inventory.service';
import { inventoryFlowService } from '@modules/inventory/services/inventoryFlow.service';


// Now visit http://localhost:3000/api/docs

const origin = {
    // origin: isProduction ? 'https://octa.app' : '*',
    origin: '*'
};


export const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(origin));
app.use(compression());
app.use(helmet());
app.use(morgan('combined'));
app.use(morgan('dev', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use("/api/docs", swaggerUiHandler, swaggerUiSetup);



// Create a Prisma client instance
const prisma = new PrismaClient();

// Health check
async function checkDatabase() {
  try {
    // Try to execute a simple query
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection error:', error);
    return false;
  } finally {
    // Close the connection
    await prisma.$disconnect();
  }
}

// Update your health check endpoint
app.get('/health', async (_, res) => {
    const dbStatus = await checkDatabase()
    ? 'connected'
    : 'disconnected';
    
    res.json({ 
        status: 'ok',
        db: dbStatus,
        version: process.env.npm_package_version
    });
});
app.use('/api/v1', v1Router);

// Initialize Subscribers =====================================================

// Inventory Subscriber
    createInventorySubscriber(eventBus, {
    notificationService,
    userRoleService
    });

// Stock Transfer Subscriber
    createStockTransferSubscriber(eventBus, {
    notificationService,
    inventoryService: inventoryFlowService,
    userRoleService
    });

// Start background services ==================================================
    inventoryService.startLowStockMonitor();

const middleware = new Middleware(authService);
const requestMiddleware = new RequestMiddleware();
export { middleware,requestMiddleware }

app.use(errorHandler);