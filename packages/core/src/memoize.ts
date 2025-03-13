/**
 * Memoization utilities
 *
 * This module provides utilities for caching function results to improve performance.
 *
 * @packageDocumentation
 */

/**
 * Options for memoization
 */
export interface MemoizeOptions {
  /**
   * Maximum cache size, if specified, least recently used entries will be removed when exceeded
   */
  maxSize?: number;
}

/**
 * Memoizes a function, caching its results for repeated calls with the same arguments
 *
 * @example
 * ```typescript
 * const expensiveCalculation = (x: number) => {
 *   console.log(`Computing for ${x}`);
 *   return x * x;
 * };
 *
 * const memoizedCalculation = memoize(expensiveCalculation);
 * memoizedCalculation(4); // logs: Computing for 4, returns: 16
 * memoizedCalculation(4); // No log, returns: 16 (cached)
 * ```
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const cache = new Map<string, any>();
  const maxSize = options.maxSize ?? Infinity;
  const recentKeys: string[] = [];

  const memoized = function(this: any, ...args: any[]): any {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      // Move this key to the end of recent keys (most recently used)
      const keyIndex = recentKeys.indexOf(key);
      if (keyIndex >= 0) {
        recentKeys.splice(keyIndex, 1);
      }
      recentKeys.push(key);

      return cache.get(key);
    }

    const result = fn.apply(this, args);

    // Evict least recently used item if we're at capacity
    if (cache.size >= maxSize && recentKeys.length > 0) {
      const oldestKey = recentKeys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, result);
    recentKeys.push(key);

    return result;
  };

  return memoized as T;
}

/**
 * Memoizes a function with a custom key generator function
 *
 * @example
 * ```typescript
 * interface User { id: number; name: string; }
 *
 * const getUserData = (user: User) => {
 *   console.log(`Fetching data for ${user.name}`);
 *   return { ...user, lastLogin: new Date() };
 * };
 *
 * const memoizedGetUserData = memoizeWith(
 *   (user) => String(user.id),
 *   getUserData
 * );
 * ```
 */
export function memoizeWith<T extends (...args: any[]) => any>(
  keyFn: (...args: Parameters<T>) => string,
  fn: T,
  options: MemoizeOptions = {}
): T {
  const cache = new Map<string, any>();
  const maxSize = options.maxSize ?? Infinity;
  const recentKeys: string[] = [];

  const memoized = function(this: any, ...args: Parameters<T>): any {
    const key = keyFn(...args);

    if (cache.has(key)) {
      // Move this key to the end of recent keys (most recently used)
      const keyIndex = recentKeys.indexOf(key);
      if (keyIndex >= 0) {
        recentKeys.splice(keyIndex, 1);
      }
      recentKeys.push(key);

      return cache.get(key);
    }

    const result = fn.apply(this, args);

    // Evict least recently used item if we're at capacity
    if (cache.size >= maxSize && recentKeys.length > 0) {
      const oldestKey = recentKeys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, result);
    recentKeys.push(key);

    return result;
  };

  return memoized as T;
}
