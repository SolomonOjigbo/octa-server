import { Request, Response, NextFunction } from 'express';
import {redisClient} from './cache';
import { RateLimitError } from './errors';


/**
 * Rate limiter middleware using Redis
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @param keyGenerator - Function to generate rate limit key (default: IP + endpoint)
 * @param skip - Function to determine if request should be skipped
 */
export function rateLimiter(
  limit: number,
  windowMs: number,
  options?: {
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
    message?: string;
  }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting if configured
      if (options?.skip?.(req)) {
        return next();
      }

      // Generate unique key for rate limiting
      const key = options?.keyGenerator
        ? options.keyGenerator(req)
        : `rate_limit:${req.ip}:${req.method}:${req.path}`;

      // Use Redis multi for atomic operations
      const multi = redisClient.getClient().multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(windowMs / 1000));

      const results = await multi.exec();
      const currentCount = results?.[0] as number;

      if (!currentCount) {
        throw new Error('Failed to execute rate limit operations');
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, limit - currentCount).toString(),
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + windowMs / 1000).toString()
      });

      // Check if limit exceeded
      if (currentCount > limit) {
        throw new RateLimitError(
          options?.message || 'Too many requests, please try again later',
          {
            limit,
            remaining: 0,
            reset: Math.ceil(Date.now() / 1000 + windowMs / 1000)
          }
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Rate limiter for authenticated users
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 */
export function userRateLimiter(limit: number, windowMs: number) {
  return rateLimiter(limit, windowMs, {
    keyGenerator: (req) => `rate_limit:user:${req.user?.id || 'unknown'}:${req.method}:${req.path}`,
    message: 'You have exceeded your request limit'
  });
}

/**
 * Rate limiter for API keys
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 */
export function apiKeyRateLimiter(limit: number, windowMs: number) {
  return rateLimiter(limit, windowMs, {
    keyGenerator: (req) => {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      return `rate_limit:api_key:${apiKey || 'unknown'}:${req.method}:${req.path}`;
    },
    message: 'API rate limit exceeded'
  });
}