/**
 * Caching Strategy Implementation
 *
 * Provides a flexible caching layer that supports:
 * - Next.js built-in caching (default)
 * - Redis caching (if configured)
 * - In-memory caching (fallback)
 *
 * Usage:
 * - Cache resume analysis results
 * - Cache user subscription data
 * - Cache AI responses
 * - Rate limiting
 */

import { unstable_cache } from 'next/cache';

// Cache configuration
const CACHE_CONFIG = {
  // Cache durations (in seconds)
  durations: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
  // Cache key prefixes
  prefixes: {
    USER: 'user:',
    SUBSCRIPTION: 'sub:',
    USAGE: 'usage:',
    RESUME: 'resume:',
    ANALYSIS: 'analysis:',
    AI_RESPONSE: 'ai:',
    RATE_LIMIT: 'ratelimit:',
    JOB_MATCH: 'jobmatch:',
  },
};

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

// Check if Redis is configured
const REDIS_ENABLED = !!process.env.REDIS_URL;

// Redis client (lazy loaded)
let redisClient: any = null;

/**
 * Initialize Redis client if configured
 */
async function getRedisClient() {
  if (!REDIS_ENABLED) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    // Dynamically import redis only if needed
    // Using require to avoid bundling issues
    const redis = await (async () => {
      try {
        // Only attempt to load redis in Node.js environment
        if (typeof window !== 'undefined') {
          return null;
        }
        return require('redis');
      } catch {
        return null;
      }
    })();
    
    if (!redis) {
      console.warn('Redis package not installed, using in-memory cache');
      return null;
    }

    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('Redis not available, falling back to in-memory cache:', error);
    return null;
  }
}

/**
 * Get value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first if enabled
    if (REDIS_ENABLED) {
      const client = await getRedisClient();
      if (client) {
        const value = await client.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      }
    }

    // Fallback to in-memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    // Clean up expired entry
    if (cached) {
      memoryCache.delete(key);
    }

    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_CONFIG.durations.MEDIUM
): Promise<void> {
  try {
    // Store in Redis if enabled
    if (REDIS_ENABLED) {
      const client = await getRedisClient();
      if (client) {
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
      }
    }

    // Always store in memory cache as fallback
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    // Delete from Redis if enabled
    if (REDIS_ENABLED) {
      const client = await getRedisClient();
      if (client) {
        await client.del(key);
      }
    }

    // Delete from memory cache
    memoryCache.delete(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  try {
    // Delete from Redis if enabled
    if (REDIS_ENABLED) {
      const client = await getRedisClient();
      if (client) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(keys);
        }
      }
    }

    // Delete from memory cache
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

/**
 * Check if key exists in cache
 */
export async function existsCached(key: string): Promise<boolean> {
  try {
    // Check Redis if enabled
    if (REDIS_ENABLED) {
      const client = await getRedisClient();
      if (client) {
        const exists = await client.exists(key);
        return exists === 1;
      }
    }

    // Check memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
}

/**
 * Increment a counter in cache (useful for rate limiting)
 */
export async function incrementCached(
  key: string,
  ttlSeconds: number = 60
): Promise<number> {
  try {
    // Use Redis if enabled
    if (REDIS_ENABLED) {
      const client = await getRedisClient();
      if (client) {
        const value = await client.incr(key);
        // Set expiry only on first increment
        if (value === 1) {
          await client.expire(key, ttlSeconds);
        }
        return value;
      }
    }

    // Fallback to memory cache
    const cached = memoryCache.get(key);
    const currentValue = cached?.value || 0;
    const newValue = currentValue + 1;

    memoryCache.set(key, {
      value: newValue,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return newValue;
  } catch (error) {
    console.error('Cache increment error:', error);
    return 0;
  }
}

/**
 * Clean up expired entries from memory cache
 */
export function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000);
}

/**
 * Cache helpers for specific use cases
 */

/**
 * Cache user subscription data
 */
export async function cacheUserSubscription(userId: string | number, data: any): Promise<void> {
  const key = `${CACHE_CONFIG.prefixes.SUBSCRIPTION}${userId}`;
  await setCached(key, data, CACHE_CONFIG.durations.MEDIUM);
}

export async function getCachedUserSubscription(userId: string | number): Promise<any | null> {
  const key = `${CACHE_CONFIG.prefixes.SUBSCRIPTION}${userId}`;
  return await getCached(key);
}

export async function invalidateUserSubscription(userId: string | number): Promise<void> {
  const key = `${CACHE_CONFIG.prefixes.SUBSCRIPTION}${userId}`;
  await deleteCached(key);
}

/**
 * Cache usage limits
 */
export async function cacheUsageLimits(userId: string | number, data: any): Promise<void> {
  const key = `${CACHE_CONFIG.prefixes.USAGE}${userId}`;
  await setCached(key, data, CACHE_CONFIG.durations.SHORT);
}

export async function getCachedUsageLimits(userId: string | number): Promise<any | null> {
  const key = `${CACHE_CONFIG.prefixes.USAGE}${userId}`;
  return await getCached(key);
}

export async function invalidateUsageLimits(userId: string | number): Promise<void> {
  const key = `${CACHE_CONFIG.prefixes.USAGE}${userId}`;
  await deleteCached(key);
}

/**
 * Cache resume analysis results
 */
export async function cacheResumeAnalysis(resumeId: string | number, data: any): Promise<void> {
  const key = `${CACHE_CONFIG.prefixes.ANALYSIS}${resumeId}`;
  await setCached(key, data, CACHE_CONFIG.durations.LONG);
}

export async function getCachedResumeAnalysis(resumeId: string | number): Promise<any | null> {
  const key = `${CACHE_CONFIG.prefixes.ANALYSIS}${resumeId}`;
  return await getCached(key);
}

/**
 * Cache job matching results
 */
export async function cacheJobMatch(
  userId: string | number,
  jobDescriptionHash: string,
  data: any
): Promise<void> {
  const key = `${CACHE_CONFIG.prefixes.JOB_MATCH}${userId}:${jobDescriptionHash}`;
  await setCached(key, data, CACHE_CONFIG.durations.VERY_LONG);
}

export async function getCachedJobMatch(
  userId: string | number,
  jobDescriptionHash: string
): Promise<any | null> {
  const key = `${CACHE_CONFIG.prefixes.JOB_MATCH}${userId}:${jobDescriptionHash}`;
  return await getCached(key);
}

/**
 * Rate limiting helper
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `${CACHE_CONFIG.prefixes.RATE_LIMIT}${identifier}`;
  const count = await incrementCached(key, windowSeconds);

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetAt: new Date(Date.now() + windowSeconds * 1000),
  };
}

/**
 * Next.js unstable_cache wrapper for static data
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  revalidateSeconds: number = CACHE_CONFIG.durations.MEDIUM
): T {
  return unstable_cache(fn, [keyPrefix], {
    revalidate: revalidateSeconds,
    tags: [keyPrefix],
  }) as T;
}

/**
 * Memoize function with custom cache key generator
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlSeconds: number = CACHE_CONFIG.durations.MEDIUM
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);

    // Check cache
    const cached = await getCached(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Store in cache
    await setCached(key, result, ttlSeconds);

    return result;
  }) as T;
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats() {
  const stats = {
    memoryCache: {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
    },
    redis: {
      enabled: REDIS_ENABLED,
      connected: false,
    },
  };

  if (REDIS_ENABLED) {
    try {
      const client = await getRedisClient();
      if (client) {
        stats.redis.connected = client.isReady;
      }
    } catch (error) {
      // Ignore
    }
  }

  return stats;
}

export { CACHE_CONFIG };
