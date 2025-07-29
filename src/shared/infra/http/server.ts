import 'module-alias/register';

import { app } from './index'; // Your Express app
import { loadEnv } from '../config/env'; // Env loader (see below)
import logger from '../config/logger';
import { loadTemplates } from '@modules/notification/templates';

const PORT = process.env.PORT || 3000;


loadEnv();

loadTemplates()


app.listen(PORT, () => {
  logger.info(`🚀 Octa API running on port ${PORT}`);
});

