import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { BaseError } from './errors';
import { logger } from '../logging/logger';


class CacheError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, 500, details);
    this.name = 'CacheError';
  }
}

export class RedisClient {
  private static instance: RedisClient;
  private client: ReturnType<typeof createClient>;
  private isConnected: boolean = false;
    keys: any;

  private constructor(options?: RedisClientOptions) {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Redis connection retries exhausted');
            return new Error('Redis connection retries exhausted');
          }
          return Math.min(retries * 100, 5000); // Exponential backoff up to 5s
        }
      },
      ...options
    });

    this.setupEventListeners();
  }

  public static getInstance(options?: RedisClientOptions): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(options);
    }
    return RedisClient.instance;
  }

  private setupEventListeners() {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    try {
      await this.client.connect();
    } catch (err) {
      throw new CacheError('Failed to connect to Redis', err);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.quit();
      this.isConnected = false;
    } catch (err) {
      throw new CacheError('Failed to disconnect from Redis', err);
    }
  }

  // Basic Key-Value Operations
  public async set(
    key: string,
    value: string | object,
    options?: { ttl?: number }
  ): Promise<void> {
    try {
      const val = typeof value === 'object' ? JSON.stringify(value) : value;
      if (options?.ttl) {
        await this.client.setEx(key, options.ttl, val);
      } else {
        await this.client.set(key, val);
      }
    } catch (err) {
      throw new CacheError('Redis set operation failed', { key, err });
    }
  }

  public async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value === null) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (err) {
      throw new CacheError('Redis get operation failed', { key, err });
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      throw new CacheError('Redis delete operation failed', { key, err });
    }
  }

  // Hash Operations
  public async hSet(key: string, field: string, value: string | object): Promise<void> {
    try {
      const val = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.client.hSet(key, field, val);
    } catch (err) {
      throw new CacheError('Redis hSet operation failed', { key, field, err });
    }
  }

  public async hGet<T = string>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hGet(key, field);
      if (value === null) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (err) {
      throw new CacheError('Redis hGet operation failed', { key, field, err });
    }
  }

  // Set Operations
  public async sAdd(key: string, members: string[]): Promise<void> {
    try {
      await this.client.sAdd(key, members);
    } catch (err) {
      throw new CacheError('Redis sAdd operation failed', { key, members, err });
    }
  }

  public async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (err) {
      throw new CacheError('Redis sMembers operation failed', { key, err });
    }
  }

  // List Operations
  public async lPush(key: string, elements: string[]): Promise<void> {
    try {
      await this.client.lPush(key, elements);
    } catch (err) {
      throw new CacheError('Redis lPush operation failed', { key, elements, err });
    }
  }

  public async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop);
    } catch (err) {
      throw new CacheError('Redis lRange operation failed', { key, start, stop, err });
    }
  }

  // Atomic Operations
  public async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      throw new CacheError('Redis incr operation failed', { key, err });
    }
  }

  public async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (err) {
      throw new CacheError('Redis decr operation failed', { key, err });
    }
  }

  // TTL Operations
  public async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (err) {
      throw new CacheError('Redis expire operation failed', { key, seconds, err });
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (err) {
      throw new CacheError('Redis ttl operation failed', { key, err });
    }
  }

  // Cache Patterns
  public async cachedOperation<T>(
    key: string,
    operation: () => Promise<T>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T> {
    try {
      if (!options?.forceRefresh) {
        const cached = await this.get<T>(key);
        if (cached !== null) return cached;
      }

      const result = await operation();
      await this.set(key, result as string | object, { ttl: options?.ttl });
      return result;
    } catch (err) {
      if (err instanceof CacheError) {
        // If cache fails, still try the operation
        logger.warn('Cache operation failed, falling back to direct operation', { err });
        return operation();
      }
      throw err;
    }
  }

  // Pub/Sub
  public async publish(channel: string, message: string | object): Promise<void> {
    try {
      const msg = typeof message === 'object' ? JSON.stringify(message) : message;
      await this.client.publish(channel, msg);
    } catch (err) {
      throw new CacheError('Redis publish operation failed', { channel, err });
    }
  }

  public async subscribe(
    channel: string,
    callback: (message: string, channel: string) => void
  ): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, (message, ch) => callback(message, ch));
    } catch (err) {
      throw new CacheError('Redis subscribe operation failed', { channel, err });
    }
  }

  // Health Check
  public async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (err) {
      throw new CacheError('Redis ping failed', err);
    }
  }

  // Get native client (for advanced operations)
  public getClient(): ReturnType<typeof createClient> {
    return this.client;
  }
}

// Singleton instance
export const redisClient = RedisClient.getInstance();

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisClient.disconnect();
  process.exit(0);
});