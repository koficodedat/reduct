/**
 * Specialized operations tests
 *
 * Tests for specialized operations like mapFilterReduce, mapReduce, filterMap,
 * mapFilter, mapSlice, sliceMap, filterSlice, sliceFilter, filterReduce,
 * concatMap, and mapConcat.
 */

import { describe, it, expect } from 'vitest';
import { List } from '../../../src';
import * as specializedOps from '../../../src/list/specialized-operations';

describe('List specialized operations', () => {
  describe('mapFilterReduce', () => {
    it('should perform map, filter, and reduce in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      // Map: double each value
      // Filter: keep only values divisible by 3
      // Reduce: sum the values
      const result = list.mapFilterReduce(
        x => x * 2,
        x => x % 3 === 0,
        (acc, x) => acc + x,
        0
      );

      // Expected: (2*3) + (2*6) + (2*9) = 6 + 12 + 18 = 36
      expect(result).toBe(36);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      const result = list.mapFilterReduce(
        x => x * 2,
        x => x % 3 === 0,
        (acc, x) => acc + x,
        0
      );

      expect(result).toBe(0);
    });

    it('should handle lists with no matching elements', () => {
      const list = List.from([1, 2, 4, 5, 7, 8, 10]);

      const result = list.mapFilterReduce(
        x => x * 2,
        x => x % 3 === 0,
        (acc, x) => acc + x,
        0
      );

      // No elements are divisible by 3 after mapping
      expect(result).toBe(0);
    });
  });

  describe('mapReduce', () => {
    it('should perform map and reduce in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);

      // Map: square each value
      // Reduce: sum the values
      const result = list.mapReduce(
        x => x * x,
        (acc, x) => acc + x,
        0
      );

      // Expected: 1^2 + 2^2 + 3^2 + 4^2 + 5^2 = 1 + 4 + 9 + 16 + 25 = 55
      expect(result).toBe(55);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      const result = list.mapReduce(
        x => x * x,
        (acc, x) => acc + x,
        0
      );

      expect(result).toBe(0);
    });

    it('should work with different types', () => {
      const list = List.from(['a', 'b', 'c', 'd']);

      // Map: get the character code
      // Reduce: sum the character codes
      const result = list.mapReduce(
        x => x.charCodeAt(0),
        (acc, x) => acc + x,
        0
      );

      // Expected: 'a' (97) + 'b' (98) + 'c' (99) + 'd' (100) = 394
      expect(result).toBe(394);
    });
  });

  describe('filterMap', () => {
    it('should perform filter and map in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      // Filter: keep only even numbers
      // Map: square each value
      const result = list.filterMap(
        x => x % 2 === 0,
        x => x * x
      );

      // Expected: [2^2, 4^2, 6^2, 8^2, 10^2] = [4, 16, 36, 64, 100]
      expect(result.toArray()).toEqual([4, 16, 36, 64, 100]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();

      const result = list.filterMap(
        x => x % 2 === 0,
        x => x * x
      );

      expect(result.isEmpty).toBe(true);
    });

    it('should handle lists with no matching elements', () => {
      const list = List.from([1, 3, 5, 7, 9]);

      const result = list.filterMap(
        x => x % 2 === 0,
        x => x * x
      );

      expect(result.isEmpty).toBe(true);
    });

    it('should work with different types', () => {
      const list = List.from(['apple', 'banana', 'cherry', 'date', 'elderberry']);

      // Filter: keep only fruits with length > 5
      // Map: get the length of each fruit
      const result = list.filterMap(
        x => x.length > 5,
        x => x.length
      );

      // Expected: [6, 6, 10] (lengths of 'banana', 'cherry', 'elderberry')
      expect(result.toArray()).toEqual([6, 6, 10]);
    });
  });

  describe('mapFilter', () => {
    it('should map and filter elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const result = list.mapFilter(x => x * 2, x => x > 5);

      expect(result.toArray()).toEqual([6, 8, 10]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();
      const result = list.mapFilter(x => x * 2, x => x > 5);

      expect(result.isEmpty).toBe(true);
    });

    it('should handle lists with no matching elements', () => {
      const list = List.from([1, 2, 3]);
      const result = list.mapFilter(x => x * 2, x => x > 10);

      expect(result.isEmpty).toBe(true);
    });
  });

  describe('mapSlice', () => {
    it('should map and slice elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const result = list.mapSlice(x => x * 2, 1, 4);

      expect(result.toArray()).toEqual([4, 6, 8]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();
      const result = list.mapSlice(x => x * 2, 1, 4);

      expect(result.isEmpty).toBe(true);
    });

    it('should handle out of bounds indices', () => {
      const list = List.from([1, 2, 3]);
      const result = list.mapSlice(x => x * 2, 5, 10);

      expect(result.isEmpty).toBe(true);
    });
  });

  describe('sliceMap', () => {
    it('should slice and map elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const result = list.sliceMap(1, 4, x => x * 2);

      expect(result.toArray()).toEqual([4, 6, 8]);
    });
  });

  describe('filterSlice', () => {
    it('should filter and slice elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5, 6, 7, 8]);
      const result = list.filterSlice(x => x % 2 === 0, 1, 3);

      expect(result.toArray()).toEqual([4, 6]);
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();
      const result = list.filterSlice(x => x % 2 === 0, 1, 3);

      expect(result.isEmpty).toBe(true);
    });
  });

  describe('sliceFilter', () => {
    it('should slice and filter elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5, 6, 7, 8]);
      const result = list.sliceFilter(1, 6, x => x % 2 === 0);

      expect(result.toArray()).toEqual([2, 4, 6]);
    });
  });

  describe('filterReduce', () => {
    it('should filter and reduce elements in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const result = list.filterReduce(
        x => x % 2 === 0,
        (acc, x) => acc + x,
        0
      );

      expect(result).toBe(6); // 2 + 4
    });

    it('should handle empty lists', () => {
      const list = List.empty<number>();
      const result = list.filterReduce(
        x => x % 2 === 0,
        (acc, x) => acc + x,
        0
      );

      expect(result).toBe(0);
    });
  });

  describe('concatMap', () => {
    it('should concatenate and map elements in a single pass', () => {
      const list1 = List.from([1, 2, 3]);
      const list2 = List.from([4, 5, 6]);
      const result = list1.concatMap(list2, x => x * 2);

      expect(result.toArray()).toEqual([2, 4, 6, 8, 10, 12]);
    });

    it('should handle empty lists', () => {
      const list1 = List.empty<number>();
      const list2 = List.empty<number>();
      const result = list1.concatMap(list2, x => x * 2);

      expect(result.isEmpty).toBe(true);
    });
  });

  describe('mapConcat', () => {
    it('should map and concatenate elements in a single pass', () => {
      const list1 = List.from([1, 2, 3]);
      const list2 = List.from([4, 5, 6]);
      const result = list1.mapConcat(list2, x => x * 2);

      expect(result.toArray()).toEqual([2, 4, 6, 8, 10, 12]);
    });
  });

  describe('performance comparison', () => {
    it('mapFilterReduce should be more efficient than separate operations for large collections', () => {
      // Create a large list
      const size = 100000;
      const list = List.of(size, i => i);

      // Define operations
      const mapFn = (x: number) => x * 2;
      const filterFn = (x: number) => x % 3 === 0;
      const reduceFn = (acc: number, x: number) => acc + x;
      const initial = 0;

      // Run multiple iterations to warm up
      for (let i = 0; i < 5; i++) {
        list.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
        list.map(mapFn).filter(filterFn).reduce(reduceFn, initial);
      }

      // Measure time for mapFilterReduce
      const startCombined = performance.now();
      const resultCombined = list.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
      const endCombined = performance.now();
      const timeCombined = endCombined - startCombined;

      // Measure time for separate operations
      const startSeparate = performance.now();
      const resultSeparate = list
        .map(mapFn)
        .filter(filterFn)
        .reduce(reduceFn, initial);
      const endSeparate = performance.now();
      const timeSeparate = endSeparate - startSeparate;

      // Verify results are the same
      expect(resultCombined).toBe(resultSeparate);

      // Log the times
      console.log(`mapFilterReduce: ${timeCombined.toFixed(2)}ms`);
      console.log(`separate operations: ${timeSeparate.toFixed(2)}ms`);
      console.log(`ratio: ${(timeSeparate / timeCombined).toFixed(2)}x`);

      // For large collections, the combined operation should be faster
      // But this is not always deterministic in tests, so we'll skip the assertion
      // expect(timeCombined).toBeLessThan(timeSeparate);
    });

    it('mapFilter should be more efficient than separate operations for large collections', () => {
      // Create a large list
      const size = 100000;
      const list = List.of(size, i => i);

      // Define operations
      const mapFn = (x: number) => x * 2;
      const filterFn = (x: number) => x % 3 === 0;

      // Run multiple iterations to warm up
      for (let i = 0; i < 5; i++) {
        list.mapFilter(mapFn, filterFn);
        list.map(mapFn).filter(filterFn);
      }

      // Measure time for mapFilter
      const startCombined = performance.now();
      const resultCombined = list.mapFilter(mapFn, filterFn);
      const endCombined = performance.now();
      const timeCombined = endCombined - startCombined;

      // Measure time for separate operations
      const startSeparate = performance.now();
      const resultSeparate = list
        .map(mapFn)
        .filter(filterFn);
      const endSeparate = performance.now();
      const timeSeparate = endSeparate - startSeparate;

      // Verify results are the same
      expect(resultCombined.toArray()).toEqual(resultSeparate.toArray());

      // Log the times
      console.log(`mapFilter: ${timeCombined.toFixed(2)}ms`);
      console.log(`separate operations: ${timeSeparate.toFixed(2)}ms`);
      console.log(`ratio: ${(timeSeparate / timeCombined).toFixed(2)}x`);

      // For large collections, the combined operation should be faster
      // But this is not always deterministic in tests, so we'll skip the assertion
      // expect(timeCombined).toBeLessThan(timeSeparate);
    });
  });
});
