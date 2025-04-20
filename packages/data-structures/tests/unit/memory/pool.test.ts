import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectPool, ArrayPool, getPooledArray, releasePooledArray } from '../../../src/memory/pool';

describe('Memory Pooling', () => {
  describe('ObjectPool', () => {
    it('should create and reuse objects', () => {
      const factory = () => ({ value: 0 });
      const reset = (obj: { value: number }) => { obj.value = 0; };
      const pool = new ObjectPool(factory, reset, 2, 5);
      
      // Get objects from the pool
      const obj1 = pool.get();
      const obj2 = pool.get();
      const obj3 = pool.get();
      
      // Modify objects
      obj1.value = 1;
      obj2.value = 2;
      obj3.value = 3;
      
      // Release objects back to the pool
      pool.release(obj1);
      pool.release(obj2);
      
      // Get objects from the pool again
      const obj4 = pool.get();
      const obj5 = pool.get();
      
      // Objects should be reused and reset
      expect(obj4.value).toBe(0);
      expect(obj5.value).toBe(0);
      
      // Pool should be empty now
      const obj6 = pool.get();
      expect(obj6).not.toBe(obj1);
      expect(obj6).not.toBe(obj2);
      expect(obj6).not.toBe(obj3);
      
      // Hit rate should be 2/3
      expect(pool.getHitRate()).toBeCloseTo(2/3, 2);
    });
    
    it('should respect the maximum pool size', () => {
      const factory = () => ({ value: 0 });
      const reset = (obj: { value: number }) => { obj.value = 0; };
      const pool = new ObjectPool(factory, reset, 0, 2);
      
      // Get objects from the pool
      const obj1 = pool.get();
      const obj2 = pool.get();
      const obj3 = pool.get();
      
      // Release objects back to the pool
      pool.release(obj1);
      pool.release(obj2);
      pool.release(obj3);
      
      // Pool size should be limited to 2
      expect(pool.getSize()).toBe(2);
    });
    
    it('should clear the pool', () => {
      const factory = () => ({ value: 0 });
      const reset = (obj: { value: number }) => { obj.value = 0; };
      const pool = new ObjectPool(factory, reset, 2, 5);
      
      // Get and release objects
      const obj1 = pool.get();
      const obj2 = pool.get();
      pool.release(obj1);
      pool.release(obj2);
      
      // Clear the pool
      pool.clear();
      
      // Pool should be empty
      expect(pool.getSize()).toBe(0);
      expect(pool.getHitRate()).toBe(0);
    });
    
    it('should resize the pool', () => {
      const factory = () => ({ value: 0 });
      const reset = (obj: { value: number }) => { obj.value = 0; };
      const pool = new ObjectPool(factory, reset, 5, 5);
      
      // Resize the pool
      pool.resize(3);
      
      // Pool size should be reduced
      expect(pool.getSize()).toBe(3);
    });
  });
  
  describe('ArrayPool', () => {
    it('should create and reuse arrays', () => {
      const pool = new ArrayPool<number>(10, 100);
      
      // Get arrays from the pool
      const arr1 = pool.get(10);
      const arr2 = pool.get(20);
      
      // Fill arrays
      for (let i = 0; i < arr1.length; i++) {
        arr1[i] = i;
      }
      
      for (let i = 0; i < arr2.length; i++) {
        arr2[i] = i * 2;
      }
      
      // Release arrays back to the pool
      pool.release(arr1);
      pool.release(arr2);
      
      // Get arrays from the pool again
      const arr3 = pool.get(10);
      const arr4 = pool.get(20);
      
      // Arrays should be reused and reset
      expect(arr3.length).toBe(10);
      expect(arr4.length).toBe(20);
      
      // Arrays should be reset
      for (let i = 0; i < arr3.length; i++) {
        expect(arr3[i]).toBeUndefined();
      }
      
      for (let i = 0; i < arr4.length; i++) {
        expect(arr4[i]).toBeUndefined();
      }
    });
    
    it('should not pool arrays larger than the maximum size', () => {
      const pool = new ArrayPool<number>(10, 100);
      
      // Get a large array
      const arr = pool.get(200);
      
      // Release the array
      pool.release(arr);
      
      // The array should not be pooled
      const stats = pool.getStats();
      expect(stats.size).toBe(0);
    });
    
    it('should clear the pool', () => {
      const pool = new ArrayPool<number>(10, 100);
      
      // Get and release arrays
      const arr1 = pool.get(10);
      const arr2 = pool.get(20);
      pool.release(arr1);
      pool.release(arr2);
      
      // Clear the pool
      pool.clear();
      
      // Pool should be empty
      const stats = pool.getStats();
      expect(stats.size).toBe(0);
    });
  });
  
  describe('Global Array Pool', () => {
    beforeEach(() => {
      // Clear the global array pool before each test
      const pool = new ArrayPool();
      pool.clear();
    });
    
    it('should get and release arrays from the global pool', () => {
      // Get an array from the pool
      const arr = getPooledArray<number>(10);
      
      // Fill the array
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i;
      }
      
      // Release the array back to the pool
      releasePooledArray(arr);
      
      // Get another array from the pool
      const arr2 = getPooledArray<number>(10);
      
      // The array should be reused and reset
      expect(arr2.length).toBe(10);
      
      // The array should be reset
      for (let i = 0; i < arr2.length; i++) {
        expect(arr2[i]).toBeUndefined();
      }
    });
  });
});
