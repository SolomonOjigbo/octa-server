import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
export const logError = (error: Error) => {
  logger.error(error.message);
};
export const logInfo = (message: string) => {
  logger.info(message);
}
export const logDebug = (message: string) => {
  logger.debug(message);
}
export const logWarn = (message: string) => {
  logger.warn(message);
}