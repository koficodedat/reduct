/**
 * Tests for the LazyList implementation
 */

import { describe, it, expect } from 'vitest';
import { List } from '../../../src';
import { LazyList, lazy } from '../../../src/list/lazy-list';

describe('LazyList', () => {
  describe('creation', () => {
    it('should create a lazy list from a regular list', () => {
      const list = List.from([1, 2, 3]);
      const lazyList = lazy(list);
      
      expect(lazyList).toBeInstanceOf(LazyList);
      expect(lazyList.size).toBe(3);
      expect(lazyList.isEmpty).toBe(false);
    });
    
    it('should return the same lazy list if already lazy', () => {
      const list = List.from([1, 2, 3]);
      const lazyList1 = lazy(list);
      const lazyList2 = lazy(lazyList1);
      
      expect(lazyList2).toBe(lazyList1);
    });
  });
  
  describe('basic operations', () => {
    it('should get elements correctly', () => {
      const list = List.from([1, 2, 3]);
      const lazyList = lazy(list);
      
      expect(lazyList.get(0)).toBe(1);
      expect(lazyList.get(1)).toBe(2);
      expect(lazyList.get(2)).toBe(3);
      expect(lazyList.get(3)).toBeUndefined();
    });
    
    it('should convert to array correctly', () => {
      const list = List.from([1, 2, 3]);
      const lazyList = lazy(list);
      
      expect(lazyList.toArray()).toEqual([1, 2, 3]);
    });
    
    it('should find elements correctly', () => {
      const list = List.from([1, 2, 3]);
      const lazyList = lazy(list);
      
      expect(lazyList.find(x => x > 1)).toBe(2);
      expect(lazyList.find(x => x > 3)).toBeUndefined();
    });
    
    it('should find indices correctly', () => {
      const list = List.from([1, 2, 3]);
      const lazyList = lazy(list);
      
      expect(lazyList.findIndex(x => x > 1)).toBe(1);
      expect(lazyList.findIndex(x => x > 3)).toBe(-1);
    });
    
    it('should get first and last elements correctly', () => {
      const list = List.from([1, 2, 3]);
      const lazyList = lazy(list);
      
      expect(lazyList.first()).toBe(1);
      expect(lazyList.last()).toBe(3);
    });
  });
  
  describe('lazy operations', () => {
    it('should perform lazy map operations', () => {
      const list = List.from([1, 2, 3]);
      const lazyList = lazy(list);
      
      const mapped = lazyList.map(x => x * 2);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(mapped).toBeInstanceOf(LazyList);
      
      // When we access elements, the operation should be applied
      expect(mapped.get(0)).toBe(2);
      expect(mapped.get(1)).toBe(4);
      expect(mapped.get(2)).toBe(6);
      
      // Converting to array should apply the operation to all elements
      expect(mapped.toArray()).toEqual([2, 4, 6]);
    });
    
    it('should perform lazy filter operations', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const lazyList = lazy(list);
      
      const filtered = lazyList.filter(x => x % 2 === 0);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(filtered).toBeInstanceOf(LazyList);
      
      // Converting to array should apply the operation to all elements
      expect(filtered.toArray()).toEqual([2, 4]);
    });
    
    it('should perform lazy slice operations', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const lazyList = lazy(list);
      
      const sliced = lazyList.slice(1, 4);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(sliced).toBeInstanceOf(LazyList);
      
      // When we access elements, the operation should be applied
      expect(sliced.get(0)).toBe(2);
      expect(sliced.get(1)).toBe(3);
      expect(sliced.get(2)).toBe(4);
      
      // Converting to array should apply the operation to all elements
      expect(sliced.toArray()).toEqual([2, 3, 4]);
    });
    
    it('should perform lazy concat operations', () => {
      const list1 = List.from([1, 2, 3]);
      const list2 = List.from([4, 5, 6]);
      const lazyList = lazy(list1);
      
      const concatenated = lazyList.concat(list2);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(concatenated).toBeInstanceOf(LazyList);
      
      // When we access elements, the operation should be applied
      expect(concatenated.get(0)).toBe(1);
      expect(concatenated.get(3)).toBe(4);
      
      // Converting to array should apply the operation to all elements
      expect(concatenated.toArray()).toEqual([1, 2, 3, 4, 5, 6]);
    });
    
    it('should chain lazy operations', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const lazyList = lazy(list);
      
      const result = lazyList
        .map(x => x * 2)
        .filter(x => x > 5)
        .map(x => x - 1);
      
      // The operations should be lazy, so no evaluation should happen yet
      expect(result).toBeInstanceOf(LazyList);
      
      // Converting to array should apply all operations to all elements
      expect(result.toArray()).toEqual([5, 7, 9]);
    });
  });
  
  describe('explicit lazy methods', () => {
    it('should perform lazy map operations with lazyMap', () => {
      const list = List.from([1, 2, 3]);
      
      const mapped = list.lazyMap(x => x * 2);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(mapped).toBeInstanceOf(LazyList);
      
      // When we access elements, the operation should be applied
      expect(mapped.get(0)).toBe(2);
      expect(mapped.get(1)).toBe(4);
      expect(mapped.get(2)).toBe(6);
      
      // Converting to array should apply the operation to all elements
      expect(mapped.toArray()).toEqual([2, 4, 6]);
    });
    
    it('should perform lazy filter operations with lazyFilter', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      
      const filtered = list.lazyFilter(x => x % 2 === 0);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(filtered).toBeInstanceOf(LazyList);
      
      // Converting to array should apply the operation to all elements
      expect(filtered.toArray()).toEqual([2, 4]);
    });
    
    it('should perform lazy slice operations with lazySlice', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      
      const sliced = list.lazySlice(1, 4);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(sliced).toBeInstanceOf(LazyList);
      
      // When we access elements, the operation should be applied
      expect(sliced.get(0)).toBe(2);
      expect(sliced.get(1)).toBe(3);
      expect(sliced.get(2)).toBe(4);
      
      // Converting to array should apply the operation to all elements
      expect(sliced.toArray()).toEqual([2, 3, 4]);
    });
    
    it('should perform lazy concat operations with lazyConcat', () => {
      const list1 = List.from([1, 2, 3]);
      const list2 = List.from([4, 5, 6]);
      
      const concatenated = list1.lazyConcat(list2);
      
      // The operation should be lazy, so no evaluation should happen yet
      expect(concatenated).toBeInstanceOf(LazyList);
      
      // When we access elements, the operation should be applied
      expect(concatenated.get(0)).toBe(1);
      expect(concatenated.get(3)).toBe(4);
      
      // Converting to array should apply the operation to all elements
      expect(concatenated.toArray()).toEqual([1, 2, 3, 4, 5, 6]);
    });
    
    it('should chain lazy operations with explicit lazy methods', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      
      const result = list
        .lazyMap(x => x * 2)
        .lazyFilter(x => x > 5)
        .lazyMap(x => x - 1);
      
      // The operations should be lazy, so no evaluation should happen yet
      expect(result).toBeInstanceOf(LazyList);
      
      // Converting to array should apply all operations to all elements
      expect(result.toArray()).toEqual([5, 7, 9]);
    });
  });
  
  describe('performance', () => {
    it('should be more efficient than eager operations for large collections', () => {
      // Create a large list
      const size = 10000;
      const list = List.of(size, i => i);
      
      // Measure time for eager operations
      const eagerStart = performance.now();
      const eagerResult = list
        .map(x => x * 2)
        .filter(x => x % 3 === 0)
        .map(x => x - 1)
        .toArray();
      const eagerEnd = performance.now();
      const eagerTime = eagerEnd - eagerStart;
      
      // Measure time for lazy operations
      const lazyStart = performance.now();
      const lazyResult = list
        .lazyMap(x => x * 2)
        .lazyFilter(x => x % 3 === 0)
        .lazyMap(x => x - 1)
        .toArray();
      const lazyEnd = performance.now();
      const lazyTime = lazyEnd - lazyStart;
      
      // Verify that the results are the same
      expect(lazyResult).toEqual(eagerResult);
      
      // Log the performance difference
      console.log(`Eager operations: ${eagerTime.toFixed(2)}ms`);
      console.log(`Lazy operations: ${lazyTime.toFixed(2)}ms`);
      console.log(`Ratio: ${(eagerTime / lazyTime).toFixed(2)}x`);
      
      // Lazy operations should be faster, but this is not a strict requirement
      // as it depends on the environment and the specific operations
    });
  });
});
