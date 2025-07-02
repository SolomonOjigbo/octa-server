// src/events/event.emitter.ts
import { EventEmitter as NodeEventEmitter } from 'events';
import { logger } from '../logging/logger';
import { StockMovementEvent } from '../common/types/stockMovement.dto';

export class EventEmitter {
  public static instance: EventEmitter;
  public emitter: NodeEventEmitter;

  private constructor() {
    this.emitter = new NodeEventEmitter();
    this.emitter.setMaxListeners(50); // Increase for pharmacy workflow needs
  }

  static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  emit(event: string, data: any): boolean {
    logger.debug(`Emitting event: ${event}`, { data });
    return this.emitter.emit(event, data);
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.emitter.on(event, listener);
  }

  // Pharmacy-specific event handlers
  onStockMovement(handler: (event: StockMovementEvent) => Promise<void>): void {
    this.on('stock:movement', handler);
  }

  emitStockMovement(event: StockMovementEvent): boolean {
    return this.emit('stock:movement', event);
  }

  // Audit logging integration
  onAuditLog(handler: (logData: any) => Promise<void>): void {
    this.on('audit:log', handler);
  }

  // System health events
  onSystemError(handler: (error: Error) => Promise<void>): void {
    this.on('system:error', handler);
  }
}

export const eventEmitter = EventEmitter.getInstance();

// Initialize core event listeners
eventEmitter.on('error', (error) => {
  logger.error('Event emitter error:', error);
});