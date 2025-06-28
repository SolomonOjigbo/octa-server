export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  message: string;
  meta?: Record<string, unknown>;
  timestamp?: string;
}

export interface SystemLog extends LogEntry {
  id?: string;
  createdAt?: Date;
}

export interface LoggerConfig {
  logToConsole: boolean;
  logToFile: boolean;
  logToDatabase: boolean;
  logLevel: string;
  logDirectory: string;
}

export interface HttpRequestLog {
  method: string;
  url: string;
  status: number;
  responseTime: number;
  ip?: string;
  userAgent?: string;
  userId?: string;
  timestamp?: Date;
}