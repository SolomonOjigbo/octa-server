import winston from 'winston';
import { LogEntry, LoggerConfig, HttpRequestLog } from './types';
import prisma from '@shared/infra/database/prisma';



export const createConsoleTransport = (config: LoggerConfig) => {
  if (!config.logToConsole) return null;

  return new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      })
    ),
    level: config.logLevel,
  });
};

export const createFileTransport = (config: LoggerConfig) => {
  if (!config.logToFile) return null;

  return [
    new winston.transports.File({
      filename: `${config.logDirectory}/combined.log`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: config.logLevel,
    }),
    new winston.transports.File({
      filename: `${config.logDirectory}/errors.log`,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: 'error',
    }),
  ];
};

export const createDatabaseTransport = (config: LoggerConfig) => {
  if (!config.logToDatabase) return null;

  return new winston.transports.Stream({
    stream: new (require('stream').Writable)({
      write(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
        try {
          const logEntry: LogEntry = JSON.parse(chunk.toString());
          prisma.systemLog.create({
            data: {
              level: logEntry.level,
              message: logEntry.message,
              meta: logEntry.meta ? JSON.stringify(logEntry.meta) : null,
              timestamp: new Date(logEntry.timestamp || Date.now()),
            },
          }).catch((err) => {
            // Optionally log or handle the error here
            console.error('Failed to log to database:', err);
          });
        } catch (err) {
          // Optionally log or handle the error here
            console.error('Failed to parse log entry:', err);
        }
        callback();
      }
    }),
    level: config.logLevel,
  });
};

export const createHttpTransport = (config: LoggerConfig) => {
  return new winston.transports.File({
    filename: `${config.logDirectory}/http.log`,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    level: 'http',
  });
};