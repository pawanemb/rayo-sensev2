/**
 * Simple in-memory cache implementation with TTL support
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set a value in the cache with a TTL
   * @param key The cache key
   * @param data The data to cache
   * @param ttl Time to live in seconds (default: 300 = 5 minutes)
   */
  set<T>(key: string, data: T, ttl: number = 300): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete a specific key from the cache
   * @param key The cache key to delete
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove all expired entries from the cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton instance
const cache = new Cache();

// Periodically cleanup expired entries (every 5 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

export default cache;

/**
 * Generate a cache key for blog list queries
 */
export function getBlogListCacheKey(params: {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: string;
}): string {
  const { page, limit, search = '', sort = 'created_at', order = 'desc' } = params;
  return `blogs:list:${page}:${limit}:${search}:${sort}:${order}`;
}

/**
 * Generate a cache key for a single blog
 */
export function getBlogCacheKey(id: string): string {
  return `blog:${id}`;
}

/**
 * Generate a cache key for user list queries
 */
export function getUserListCacheKey(params: {
  page: number;
  limit: number;
  search?: string;
}): string {
  const { page, limit, search = '' } = params;
  return `users:list:${page}:${limit}:${search}`;
}

/**
 * Generate a cache key for a single user
 */
export function getUserCacheKey(id: string): string {
  return `user:${id}`;
}

/**
 * Generate a cache key for project list queries
 */
export function getProjectListCacheKey(params: {
  page: number;
  limit: number;
  search?: string;
}): string {
  const { page, limit, search = '' } = params;
  return `projects:list:${page}:${limit}:${search}`;
}

/**
 * Generate a cache key for a single project
 */
export function getProjectCacheKey(id: string): string {
  return `project:${id}`;
}
