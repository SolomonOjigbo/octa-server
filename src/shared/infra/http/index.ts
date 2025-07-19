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

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Health check
app.use('/api/v1', v1Router);



const middleware = new Middleware(authService);
const requestMiddleware = new RequestMiddleware();
export { middleware,requestMiddleware }

app.use(errorHandler);