// src/cache/cache.service.ts

import { redisClient } from '@middleware/cache';
import { logger } from '../logging/logger';
import { StockLevelDto } from '../modules/stock/types/stock.dto';

export class CacheService {
    private readonly DEFAULT_TTL = 60 * 5; // 5 minutes
  delete(arg0: string) {
    throw new Error("Method not implemented.");
  }
  async invalidate(arg0: string) {
     // This method is a placeholder for future cache invalidation logic
    // Currently, it does nothing but can be extended as needed
    try {
        
        // Placeholder for cache invalidation logic
        logger.info('Cache invalidation called, but no specific logic implemented');
        // You can implement specific cache invalidation logic here if needed
        // For example, you might want to delete a specific key or perform some other action
        // await this.redis.del(arg0);
        logger.info(`Cache invalidation for key: ${arg0}`);
        
    } catch (error) {
      logger.error('Cache invalidation error', { key: arg0, error });
      throw new Error("Method not implemented.");
        
    }
  }

  constructor(private readonly redis = redisClient) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        { ttl: ttl || this.DEFAULT_TTL }
      );
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error });
    }
  }

  async invalidateStock(
    tenantId: string,
    productId: string,
    variantId?: string,
    location?: { storeId?: string; warehouseId?: string }
  ): Promise<void> {
    try {
      const baseKey = `stock:${tenantId}:${productId}`;
      const variantPart = variantId ? `:${variantId}` : ':base';
      const locationPart = `:${location?.storeId || 'none'}:${location?.warehouseId || 'none'}`;
      
      const exactKey = `${baseKey}${variantPart}${locationPart}`;
      await this.del(exactKey);
      
      // Invalidate pattern for all variants if needed
      if (!variantId) {
        const pattern = `${baseKey}:*${locationPart}`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }
    } catch (error) {
      logger.error('Stock cache invalidation failed', { error });
    }
  }

  async getStockLevel(
    tenantId: string,
    productId: string,
    options: {
      variantId?: string;
      storeId?: string;
      warehouseId?: string;
    }
  ): Promise<StockLevelDto | null> {
    const cacheKey = this.generateStockKey(tenantId, productId, options);
    return this.get<StockLevelDto>(cacheKey);
  }

  async setStockLevel(
    stock: StockLevelDto,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.generateStockKey(
      stock.tenantId,
      stock.productId,
      {
        variantId: stock.variantId,
        storeId: stock.storeId,
        warehouseId: stock.warehouseId
      }
    );
    await this.set(cacheKey, stock, ttl);
  }

  public generateStockKey(
    tenantId: string,
    productId: string,
    options: {
      variantId?: string;
      storeId?: string;
      warehouseId?: string;
    }
  ): string {
    const { variantId, storeId, warehouseId } = options;
    return `stock:${tenantId}:${productId}:${variantId || 'base'}:${storeId || 'none'}:${warehouseId || 'none'}`;
  }
  async invalidateInventory(
    tenantId: string,
    productId: string,
    variantId?: string,
    storeId?: string,
    warehouseId?: string
  ): Promise<void> {
    try {
      const baseKey = `inventory:${tenantId}:${productId}`;
      const variantPart = variantId ? `:${variantId}` : ':base';
      const locationPart = `:${storeId || 'none'}:${warehouseId || 'none'}`;
      
      const exactKey = `${baseKey}${variantPart}${locationPart}`;
      await this.del(exactKey);
      
      // Invalidate pattern for all variants if needed
      if (!variantId) {
        const pattern = `${baseKey}:*${locationPart}`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }
    } catch (error) {
      logger.error('Inventory cache invalidation failed', { error });
    }
  }
//   async invalidate
}

export const cacheService = new CacheService();