/**
 * Simple in-memory cache implementation for API responses
 * For production, consider using Redis or similar distributed cache
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Set a value in the cache with TTL (Time To Live)
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds TTL in seconds (default 5 minutes)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });

    console.log(`[CACHE] Set key: ${key} (TTL: ${ttlSeconds}s, Size: ${this.cache.size})`);
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      console.log(`[CACHE] Miss: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      console.log(`[CACHE] Expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`[CACHE] Hit: ${key}`);
    return item.data as T;
  }

  /**
   * Delete a specific key from cache
   * @param key Cache key to delete
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`[CACHE] Deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[CACHE] Cleared all ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate a cache key from parameters
   * @param prefix Key prefix (e.g., 'blogs', 'users')
   * @param params Parameters to include in key
   * @returns Generated cache key
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${prefix}:${sortedParams}`;
  }

  /**
   * Invalidate cache keys matching a pattern
   * @param pattern String pattern to match (simple string contains)
   */
  invalidatePattern(pattern: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    console.log(`[CACHE] Invalidated ${deleted} keys matching pattern: ${pattern}`);
    return deleted;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[CACHE] Cleaned up ${removed} expired entries`);
    }

    return removed;
  }
}

// Create singleton cache instance
const cache = new SimpleCache(200); // Max 200 cached items

// Optional: Set up periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 60000); // Cleanup every minute
}

export default cache;

// Helper function for blog list caching
export const getBlogListCacheKey = (params: {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: string;
}): string => {
  return cache.generateKey('blogs:list', params);
};

// Helper function for user details caching
export const getUserDetailsCacheKey = (userIds: string[]): string => {
  return cache.generateKey('users:details', {
    ids: userIds.sort().join(',')
  });
};

// Helper function for project details caching
export const getProjectDetailsCacheKey = (projectIds: string[]): string => {
  return cache.generateKey('projects:details', {
    ids: projectIds.sort().join(',')
  });
};
