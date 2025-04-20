import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResultCache, memoize, getOrComputeCachedResult } from '../../../src/cache/result-cache';

describe('Result Cache', () => {
  describe('ResultCache', () => {
    it('should cache and retrieve values', () => {
      const cache = new ResultCache<string, number>(10, 1000);
      
      // Set a value
      cache.set('key1', 42);
      
      // Get the value
      const value = cache.get('key1');
      
      // Value should be retrieved from the cache
      expect(value).toBe(42);
      
      // Hit rate should be 1
      expect(cache.getHitRate()).toBe(1);
    });
    
    it('should respect the time-to-live', async () => {
      const cache = new ResultCache<string, number>(10, 50);
      
      // Set a value
      cache.set('key1', 42);
      
      // Get the value immediately
      const value1 = cache.get('key1');
      expect(value1).toBe(42);
      
      // Wait for the TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the value after TTL has expired
      const value2 = cache.get('key1');
      expect(value2).toBeUndefined();
      
      // Hit rate should be 0.5
      expect(cache.getHitRate()).toBeCloseTo(0.5, 2);
    });
    
    it('should respect the maximum size', () => {
      const cache = new ResultCache<string, number>(3, 1000);
      
      // Set values
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      // Get values to update their timestamps
      cache.get('key1');
      cache.get('key2');
      cache.get('key3');
      
      // Set a new value, which should evict the least recently used value
      cache.set('key4', 4);
      
      // The cache should contain the most recently used values
      expect(cache.get('key1')).toBeDefined();
      expect(cache.get('key2')).toBeDefined();
      expect(cache.get('key3')).toBeDefined();
      expect(cache.get('key4')).toBeUndefined();
      
      // Cache size should be limited to 3
      expect(cache.getSize()).toBe(3);
    });
    
    it('should clear the cache', () => {
      const cache = new ResultCache<string, number>(10, 1000);
      
      // Set values
      cache.set('key1', 1);
      cache.set('key2', 2);
      
      // Clear the cache
      cache.clear();
      
      // Cache should be empty
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.getSize()).toBe(0);
      expect(cache.getHitRate()).toBe(0);
    });
    
    it('should resize the cache', () => {
      const cache = new ResultCache<string, number>(5, 1000);
      
      // Set values
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      cache.set('key4', 4);
      cache.set('key5', 5);
      
      // Resize the cache
      cache.resize(3);
      
      // Cache size should be reduced
      expect(cache.getSize()).toBe(3);
    });
    
    it('should compute values on demand', () => {
      const cache = new ResultCache<string, number>(10, 1000);
      const compute = vi.fn(() => 42);
      
      // Get or compute a value
      const value1 = cache.getOrCompute('key1', compute);
      
      // Value should be computed
      expect(value1).toBe(42);
      expect(compute).toHaveBeenCalledTimes(1);
      
      // Get or compute the same value again
      const value2 = cache.getOrCompute('key1', compute);
      
      // Value should be retrieved from the cache
      expect(value2).toBe(42);
      expect(compute).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('memoize', () => {
    it('should memoize function results', () => {
      const fn = vi.fn((a: number, b: number) => a + b);
      const memoizedFn = memoize(fn);
      
      // Call the function
      const result1 = memoizedFn(1, 2);
      
      // Result should be correct
      expect(result1).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Call the function with the same arguments
      const result2 = memoizedFn(1, 2);
      
      // Result should be retrieved from the cache
      expect(result2).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Call the function with different arguments
      const result3 = memoizedFn(2, 3);
      
      // Result should be computed
      expect(result3).toBe(5);
      expect(fn).toHaveBeenCalledTimes(2);
    });
    
    it('should use a custom key serializer', () => {
      const fn = vi.fn((obj: { a: number, b: number }) => obj.a + obj.b);
      const keySerializer = (obj: { a: number, b: number }) => `${obj.a}-${obj.b}`;
      const memoizedFn = memoize(fn, 10, 1000, keySerializer);
      
      // Call the function
      const result1 = memoizedFn({ a: 1, b: 2 });
      
      // Result should be correct
      expect(result1).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
      
      // Call the function with an equivalent object
      const result2 = memoizedFn({ a: 1, b: 2 });
      
      // Result should be retrieved from the cache
      expect(result2).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Global Result Cache', () => {
    beforeEach(() => {
      // Clear the global result cache before each test
      const cache = new ResultCache<string, any>();
      cache.clear();
    });
    
    it('should get or compute values from the global cache', () => {
      const compute = vi.fn(() => 42);
      
      // Get or compute a value
      const value1 = getOrComputeCachedResult('key1', compute);
      
      // Value should be computed
      expect(value1).toBe(42);
      expect(compute).toHaveBeenCalledTimes(1);
      
      // Get or compute the same value again
      const value2 = getOrComputeCachedResult('key1', compute);
      
      // Value should be retrieved from the cache
      expect(value2).toBe(42);
      expect(compute).toHaveBeenCalledTimes(1);
    });
  });
});
