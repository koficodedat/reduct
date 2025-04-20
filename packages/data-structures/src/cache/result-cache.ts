/**
 * Result caching for expensive operations
 * 
 * This module provides utilities for caching the results of expensive operations
 * to avoid redundant computations.
 */

/**
 * A cache entry
 * 
 * @template K The key type
 * @template V The value type
 */
interface CacheEntry<K, V> {
  key: K;
  value: V;
  timestamp: number;
  hits: number;
}

/**
 * A cache for storing operation results
 * 
 * @template K The key type
 * @template V The value type
 */
export class ResultCache<K, V> {
  private cache: Map<string, CacheEntry<K, V>> = new Map();
  private maxSize: number;
  private ttl: number;
  private keySerializer: (key: K) => string;
  private hits = 0;
  private misses = 0;

  /**
   * Create a new result cache
   * 
   * @param maxSize - The maximum size of the cache
   * @param ttl - The time-to-live in milliseconds
   * @param keySerializer - A function that serializes keys to strings
   */
  constructor(
    maxSize = 1000,
    ttl = 60000,
    keySerializer: (key: K) => string = JSON.stringify
  ) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.keySerializer = keySerializer;
  }

  /**
   * Get a value from the cache
   * 
   * @param key - The key to look up
   * @returns The cached value, or undefined if not found
   */
  get(key: K): V | undefined {
    const serializedKey = this.keySerializer(key);
    const entry = this.cache.get(serializedKey);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(serializedKey);
      this.misses++;
      return undefined;
    }

    entry.hits++;
    entry.timestamp = now;
    this.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   * 
   * @param key - The key to set
   * @param value - The value to cache
   */
  set(key: K, value: V): void {
    const serializedKey = this.keySerializer(key);
    
    // If the cache is full, evict the least recently used entry
    if (this.cache.size >= this.maxSize && !this.cache.has(serializedKey)) {
      this.evictLRU();
    }

    this.cache.set(serializedKey, {
      key,
      value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Check if a key exists in the cache
   * 
   * @param key - The key to check
   * @returns Whether the key exists in the cache
   */
  has(key: K): boolean {
    const serializedKey = this.keySerializer(key);
    const entry = this.cache.get(serializedKey);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(serializedKey);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   * 
   * @param key - The key to delete
   * @returns Whether the key was deleted
   */
  delete(key: K): boolean {
    const serializedKey = this.keySerializer(key);
    return this.cache.delete(serializedKey);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get the hit rate of the cache
   * 
   * @returns The hit rate as a number between 0 and 1
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  /**
   * Get the current size of the cache
   * 
   * @returns The current size of the cache
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Resize the cache
   * 
   * @param newMaxSize - The new maximum size of the cache
   */
  resize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    while (this.cache.size > newMaxSize) {
      this.evictLRU();
    }
  }

  /**
   * Set the time-to-live
   * 
   * @param newTTL - The new time-to-live in milliseconds
   */
  setTTL(newTTL: number): void {
    this.ttl = newTTL;
  }

  /**
   * Get or compute a value
   * 
   * @param key - The key to look up
   * @param compute - A function that computes the value if not found
   * @returns The cached or computed value
   */
  getOrCompute(key: K, compute: () => V): V {
    const cachedValue = this.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const computedValue = compute();
    this.set(key, computedValue);
    return computedValue;
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    let oldestTimestamp = Infinity;
    let oldestKey: string | undefined;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * A memoized function
 * 
 * @template Args The argument types
 * @template Result The result type
 */
export function memoize<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  maxSize = 1000,
  ttl = 60000,
  keySerializer: (...args: Args) => string = (...args) => JSON.stringify(args)
): (...args: Args) => Result {
  const cache = new ResultCache<string, Result>(maxSize, ttl, (key) => key);

  return (...args: Args): Result => {
    const key = keySerializer(...args);
    return cache.getOrCompute(key, () => fn(...args));
  };
}

/**
 * A singleton result cache for reusing across the application
 */
export const globalResultCache = new ResultCache<string, any>();

/**
 * Get a value from the global result cache
 * 
 * @param key - The key to look up
 * @returns The cached value, or undefined if not found
 */
export function getCachedResult<T>(key: string): T | undefined {
  return globalResultCache.get(key);
}

/**
 * Set a value in the global result cache
 * 
 * @param key - The key to set
 * @param value - The value to cache
 */
export function setCachedResult<T>(key: string, value: T): void {
  globalResultCache.set(key, value);
}

/**
 * Get or compute a value from the global result cache
 * 
 * @param key - The key to look up
 * @param compute - A function that computes the value if not found
 * @returns The cached or computed value
 */
export function getOrComputeCachedResult<T>(key: string, compute: () => T): T {
  return globalResultCache.getOrCompute(key, compute);
}
