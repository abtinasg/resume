/**
 * Layer 1 - Evaluation Engine
 * Caching Module
 *
 * Provides in-memory caching for evaluation results with TTL support.
 * Caches generic scores to avoid recomputation during fit evaluation.
 */

import type { EvaluationResult, CachedEvaluationResult, ContentHash } from './types';
import { CACHE_CONFIG } from './config/weights';
import * as crypto from 'crypto';

// ==================== Cache Store ====================

/**
 * In-memory cache store
 */
const cache = new Map<ContentHash, CachedEvaluationResult>();

/**
 * Cache statistics (optional, for monitoring)
 */
const stats = {
  hits: 0,
  misses: 0,
  evictions: 0,
};

// ==================== Public API ====================

/**
 * Generate a hash for resume content
 */
export function generateContentHash(content: Buffer | string): ContentHash {
  const data = typeof content === 'string' ? content : content.toString('base64');
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Get cached evaluation result
 */
export function getCachedScore(hash: ContentHash): EvaluationResult | null {
  const entry = cache.get(hash);

  if (!entry) {
    stats.misses++;
    return null;
  }

  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_CONFIG.ttl) {
    cache.delete(hash);
    stats.evictions++;
    stats.misses++;
    return null;
  }

  stats.hits++;
  return entry.score;
}

/**
 * Cache an evaluation result
 */
export function setCachedScore(
  hash: ContentHash,
  score: EvaluationResult
): void {
  // Enforce max size by evicting oldest entries
  if (cache.size >= CACHE_CONFIG.maxSize) {
    const oldestKey = findOldestEntry();
    if (oldestKey) {
      cache.delete(oldestKey);
      stats.evictions++;
    }
  }

  cache.set(hash, {
    score,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate a cached result
 */
export function invalidateCache(hash: ContentHash): boolean {
  return cache.delete(hash);
}

/**
 * Clear all cached results
 */
export function clearCache(): void {
  cache.clear();
  stats.hits = 0;
  stats.misses = 0;
  stats.evictions = 0;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
} {
  const total = stats.hits + stats.misses;
  return {
    size: cache.size,
    maxSize: CACHE_CONFIG.maxSize,
    hits: stats.hits,
    misses: stats.misses,
    evictions: stats.evictions,
    hitRate: total > 0 ? stats.hits / total : 0,
  };
}

// ==================== Internal Helpers ====================

/**
 * Find the oldest cache entry
 */
function findOldestEntry(): ContentHash | null {
  let oldest: ContentHash | null = null;
  let oldestTime = Infinity;

  for (const [key, value] of cache.entries()) {
    if (value.timestamp < oldestTime) {
      oldestTime = value.timestamp;
      oldest = key;
    }
  }

  return oldest;
}

/**
 * Remove expired entries (can be called periodically)
 */
export function pruneExpired(): number {
  const now = Date.now();
  let pruned = 0;

  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_CONFIG.ttl) {
      cache.delete(key);
      pruned++;
    }
  }

  stats.evictions += pruned;
  return pruned;
}

// ==================== Cache Wrapper Function ====================

/**
 * Wrap an evaluation function with caching
 */
export async function withCache<T extends EvaluationResult>(
  hash: ContentHash,
  evaluateFn: () => Promise<T> | T
): Promise<T> {
  // Check cache first
  const cached = getCachedScore(hash);
  if (cached) {
    return cached as T;
  }

  // Execute evaluation
  const result = await evaluateFn();

  // Cache the result
  setCachedScore(hash, result);

  return result;
}
