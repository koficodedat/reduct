/**
 * List tests
 *
 * Tests for the List data structure.
 */

import { describe, it, expect } from 'vitest';
import { List } from '../../../src';

describe('List', () => {
  describe('creation', () => {
    it('should create an empty list', () => {
      const list = List.empty<number>();
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });

    it('should create a list from an array', () => {
      const array = [1, 2, 3, 4, 5];
      const list = List.from(array);
      expect(list.size).toBe(array.length);
      expect(list.isEmpty).toBe(false);
      expect(list.toArray()).toEqual(array);
    });

    it('should create a list with the specified size and generator function', () => {
      const list = List.of(5, (i) => i * 2);
      expect(list.size).toBe(5);
      expect(list.toArray()).toEqual([0, 2, 4, 6, 8]);
    });
  });

  describe('access', () => {
    it('should get an element at the specified index', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      expect(list.get(0)).toBe(1);
      expect(list.get(2)).toBe(3);
      expect(list.get(4)).toBe(5);
    });

    it('should return undefined for out-of-bounds indices', () => {
      const list = List.from([1, 2, 3]);
      expect(list.get(-1)).toBeUndefined();
      expect(list.get(3)).toBeUndefined();
    });
  });

  describe('modification', () => {
    it('should set an element at the specified index', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const newList = list.set(2, 10);
      expect(list.get(2)).toBe(3); // Original list is unchanged
      expect(newList.get(2)).toBe(10);
      expect(newList.toArray()).toEqual([1, 2, 10, 4, 5]);
    });

    it('should insert an element at the specified index', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const newList = list.insert(2, 10);
      expect(list.size).toBe(5); // Original list is unchanged
      expect(newList.size).toBe(6);
      expect(newList.toArray()).toEqual([1, 2, 10, 3, 4, 5]);
    });

    it('should remove an element at the specified index', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const newList = list.remove(2);
      expect(list.size).toBe(5); // Original list is unchanged
      expect(newList.size).toBe(4);
      expect(newList.toArray()).toEqual([1, 2, 4, 5]);
    });

    it('should append an element to the end of the list', () => {
      const list = List.from([1, 2, 3]);
      const newList = list.append(4);
      expect(list.size).toBe(3); // Original list is unchanged
      expect(newList.size).toBe(4);
      expect(newList.toArray()).toEqual([1, 2, 3, 4]);
    });

    it('should prepend an element to the beginning of the list', () => {
      const list = List.from([2, 3, 4]);
      const newList = list.prepend(1);
      expect(list.size).toBe(3); // Original list is unchanged
      expect(newList.size).toBe(4);
      expect(newList.toArray()).toEqual([1, 2, 3, 4]);
    });

    it('should concatenate two lists', () => {
      const list1 = List.from([1, 2, 3]);
      const list2 = List.from([4, 5, 6]);
      const newList = list1.concat(list2);
      expect(list1.size).toBe(3); // Original lists are unchanged
      expect(list2.size).toBe(3);
      expect(newList.size).toBe(6);
      expect(newList.toArray()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('transformation', () => {
    it('should map elements to new values', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const newList = list.map((x) => x * 2);
      expect(list.toArray()).toEqual([1, 2, 3, 4, 5]); // Original list is unchanged
      expect(newList.toArray()).toEqual([2, 4, 6, 8, 10]);
    });

    it('should filter elements based on a predicate', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const newList = list.filter((x) => x % 2 === 0);
      expect(list.toArray()).toEqual([1, 2, 3, 4, 5]); // Original list is unchanged
      expect(newList.toArray()).toEqual([2, 4]);
    });

    it('should reduce elements to a single value', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const sum = list.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(15);
    });

    it('should find the first element that satisfies a predicate', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const found = list.find((x) => x > 3);
      expect(found).toBe(4);
    });

    it('should find the index of the first element that satisfies a predicate', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const index = list.findIndex((x) => x > 3);
      expect(index).toBe(3);
    });

    it('should create a slice of the list', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const slice = list.slice(1, 4);
      expect(slice.toArray()).toEqual([2, 3, 4]);
    });

    it('should perform map, filter, and reduce in a single pass', () => {
      const list = List.from([1, 2, 3, 4, 5]);
      const result = list.mapFilterReduce(
        (x) => x * 2,
        (x) => x % 3 === 0,
        (acc, x) => acc + x,
        0
      );
      expect(result).toBe(6); // (2*3) + (2*6) = 6 + 12 = 18
    });
  });

  describe('size-based adaptation', () => {
    it('should handle small collections efficiently', () => {
      const smallList = List.from(Array.from({ length: 10 }, (_, i) => i));
      expect(smallList.size).toBe(10);
      expect(smallList.get(5)).toBe(5);
      
      // Test operations on small lists
      const mapped = smallList.map(x => x * 2);
      expect(mapped.toArray()).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
      
      const filtered = smallList.filter(x => x % 2 === 0);
      expect(filtered.toArray()).toEqual([0, 2, 4, 6, 8]);
      
      const sum = smallList.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(45);
    });

    it('should handle medium collections efficiently', () => {
      const mediumList = List.from(Array.from({ length: 100 }, (_, i) => i));
      expect(mediumList.size).toBe(100);
      expect(mediumList.get(50)).toBe(50);
      
      // Test operations on medium lists
      const mapped = mediumList.map(x => x * 2);
      expect(mapped.get(50)).toBe(100);
      
      const filtered = mediumList.filter(x => x % 10 === 0);
      expect(filtered.toArray()).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
      
      const sum = mediumList.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(4950); // Sum of 0 to 99
    });

    it('should handle large collections efficiently', () => {
      const largeList = List.from(Array.from({ length: 1000 }, (_, i) => i));
      expect(largeList.size).toBe(1000);
      expect(largeList.get(500)).toBe(500);
      
      // Test operations on large lists
      const mapped = largeList.map(x => x * 2);
      expect(mapped.get(500)).toBe(1000);
      
      const filtered = largeList.filter(x => x % 100 === 0);
      expect(filtered.size).toBe(10);
      expect(filtered.toArray()).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
      
      const sum = largeList.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(499500); // Sum of 0 to 999
    });
  });
});
