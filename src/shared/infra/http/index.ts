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
import logger from '../../../config/logger';



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

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Health check
app.use('/api/v1', v1Router);



const middleware = new Middleware(authService);
const requestMiddleware = new RequestMiddleware();
export { middleware,requestMiddleware }

app.use(errorHandler);