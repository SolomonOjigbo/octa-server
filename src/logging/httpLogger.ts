import winston from 'winston';
import { LoggerConfig, HttpRequestLog } from './types';
import { createHttpTransport } from './transports';

export class HttpLogger {
  private logger: winston.Logger;
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      logToConsole: true,
      logToFile: true,
      logToDatabase: false,
      logLevel: 'http',
      logDirectory: 'logs',
      ...config,
    };

    this.initializeLogger();
  }

  private initializeLogger() {
    this.logger = winston.createLogger({
      level: 'http',
      transports: [createHttpTransport(this.config)],
    });
  }

  public logRequest(logData: HttpRequestLog) {
    this.logger.info('HTTP Request', {
      ...logData,
      timestamp: new Date().toISOString(),
    });
  }
}

// Default HTTP logger instance
export const httpLogger = new HttpLogger();