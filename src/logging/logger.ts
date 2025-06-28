import winston from 'winston';
import { LoggerConfig, LogEntry } from './types';
import {
  createConsoleTransport,
  createFileTransport,
  createDatabaseTransport,
} from './transports';

export class Logger {
  private logger: winston.Logger;
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      logToConsole: true,
      logToFile: true,
      logToDatabase: false,
      logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      logDirectory: 'logs',
      ...config,
    };

    this.initializeLogger();
  }

  private initializeLogger() {
    const transports = [
      createConsoleTransport(this.config),
      ...(createFileTransport(this.config) || []),
      createDatabaseTransport(this.config),
    ].filter(Boolean) as winston.transport[];

    this.logger = winston.createLogger({
      level: this.config.logLevel,
      transports,
      exceptionHandlers: transports,
      rejectionHandlers: transports,
    });
  }

  public log(entry: LogEntry) {
    this.logger.log(entry);
  }

  public error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }

  public info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
  }

  public http(message: string, meta?: Record<string, unknown>) {
    this.logger.http(message, meta);
  }

  public debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }

  public verbose(message: string, meta?: Record<string, unknown>) {
    this.logger.verbose(message, meta);
  }

  public silly(message: string, meta?: Record<string, unknown>) {
    this.logger.silly(message, meta);
  }
}

// Default logger instance
export const logger = new Logger({
  logToDatabase: process.env.LOG_TO_DB === 'true',
});