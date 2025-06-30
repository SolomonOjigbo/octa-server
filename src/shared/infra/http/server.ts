import { app } from './index'; // Your Express app
import { loadEnv } from '../../../config/env'; // Env loader (see below)
import logger from '../../../config/logger';

loadEnv();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Octa API running on port ${PORT}`);
});

