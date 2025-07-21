// src/cache/cache.service.ts
import Redis from "ioredis";

export class CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_PROD_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set(key: string, value: any, ttlSeconds = 3600) {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async flush() {
    await this.client.flushdb();
  }
}

export const cacheService = new CacheService();
