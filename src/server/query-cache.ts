/**
 * Query Result Cache with LRU eviction and performance metrics
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

export class QueryCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get cached result or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      this.evictions++;
      this.misses++;
      return null;
    }

    // Cache hit - update statistics
    entry.hits++;
    this.hits++;
    return entry.data;
  }

  /**
   * Store result in cache with LRU eviction
   */
  set(key: string, data: T): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  /**
   * Get detailed cache statistics for monitoring
   */
  getDetailedStats() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      hits: entry.hits
    }));

    // Sort by hits descending
    entries.sort((a, b) => b.hits - a.hits);

    return {
      metrics: this.getMetrics(),
      topEntries: entries.slice(0, 10),
      oldestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.age)) : 0
    };
  }
}

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(method: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${method}:${sortedParams}`;
}
