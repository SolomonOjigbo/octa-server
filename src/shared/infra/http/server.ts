// File: src/server.ts
import 'module-alias/register';
import { loadEnv } from '../config/env';
loadEnv();

import { app } from './index';
import logger from '../config/logger';
import { loadTemplates } from '@modules/notification/templates';

const PORT = process.env.PORT || 3000;

// Load email templates first
loadTemplates().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Octa API running on port ${PORT}`);
  });
}).catch(error => {
  logger.error('Failed to load templates:', error);
  process.exit(1);
});