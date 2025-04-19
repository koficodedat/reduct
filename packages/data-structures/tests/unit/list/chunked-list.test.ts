/**
 * ChunkedList tests
 *
 * Tests for the ChunkedList implementation.
 */

import { describe, it, expect } from 'vitest';
import { ChunkedList, TransientChunkedList } from '../../../src/list/chunked-list';

describe('ChunkedList', () => {
  describe('basic operations', () => {
    it('should create an empty list', () => {
      const list = ChunkedList.from<number>([]);
      expect(list.size).toBe(0);
      expect(list.isEmpty).toBe(true);
    });

    it('should create a list with elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      expect(list.size).toBe(3);
      expect(list.isEmpty).toBe(false);
    });

    it('should get elements by index', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      expect(list.get(0)).toBe(1);
      expect(list.get(1)).toBe(2);
      expect(list.get(2)).toBe(3);
      expect(list.get(-1)).toBeUndefined();
      expect(list.get(3)).toBeUndefined();
    });

    it('should get first and last elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      expect(list.first()).toBe(1);
      expect(list.last()).toBe(3);

      const emptyList = ChunkedList.from<number>([]);
      expect(emptyList.first()).toBeUndefined();
      expect(emptyList.last()).toBeUndefined();
    });

    it('should set elements by index', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const newList = list.set(1, 5);
      
      // Original list should be unchanged
      expect(list.get(1)).toBe(2);
      
      // New list should have the updated value
      expect(newList.get(0)).toBe(1);
      expect(newList.get(1)).toBe(5);
      expect(newList.get(2)).toBe(3);
      
      // Setting out of bounds should throw
      expect(() => list.set(-1, 5)).toThrow();
      expect(() => list.set(3, 5)).toThrow();
    });

    it('should append elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const newList = list.append(4);
      
      // Original list should be unchanged
      expect(list.size).toBe(3);
      
      // New list should have the appended value
      expect(newList.size).toBe(4);
      expect(newList.get(3)).toBe(4);
    });

    it('should prepend elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const newList = list.prepend(0);
      
      // Original list should be unchanged
      expect(list.size).toBe(3);
      
      // New list should have the prepended value
      expect(newList.size).toBe(4);
      expect(newList.get(0)).toBe(0);
      expect(newList.get(1)).toBe(1);
    });

    it('should insert elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const newList = list.insert(1, 5);
      
      // Original list should be unchanged
      expect(list.size).toBe(3);
      
      // New list should have the inserted value
      expect(newList.size).toBe(4);
      expect(newList.get(0)).toBe(1);
      expect(newList.get(1)).toBe(5);
      expect(newList.get(2)).toBe(2);
      expect(newList.get(3)).toBe(3);
      
      // Inserting at the beginning
      const prependList = list.insert(0, 0);
      expect(prependList.get(0)).toBe(0);
      
      // Inserting at the end
      const appendList = list.insert(3, 4);
      expect(appendList.get(3)).toBe(4);
      
      // Inserting out of bounds should throw
      expect(() => list.insert(-1, 5)).toThrow();
      expect(() => list.insert(4, 5)).toThrow();
    });

    it('should remove elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4]);
      const newList = list.remove(1);
      
      // Original list should be unchanged
      expect(list.size).toBe(4);
      
      // New list should have the value removed
      expect(newList.size).toBe(3);
      expect(newList.get(0)).toBe(1);
      expect(newList.get(1)).toBe(3);
      expect(newList.get(2)).toBe(4);
      
      // Removing from the beginning
      const removeFirstList = list.remove(0);
      expect(removeFirstList.size).toBe(3);
      expect(removeFirstList.get(0)).toBe(2);
      
      // Removing from the end
      const removeLastList = list.remove(3);
      expect(removeLastList.size).toBe(3);
      expect(removeLastList.get(2)).toBe(3);
      
      // Removing out of bounds should throw
      expect(() => list.remove(-1)).toThrow();
      expect(() => list.remove(4)).toThrow();
    });

    it('should concatenate lists', () => {
      const list1 = ChunkedList.from<number>([1, 2, 3]);
      const list2 = ChunkedList.from<number>([4, 5, 6]);
      const concatenated = list1.concat(list2);
      
      // Original lists should be unchanged
      expect(list1.size).toBe(3);
      expect(list2.size).toBe(3);
      
      // Concatenated list should have all values
      expect(concatenated.size).toBe(6);
      expect(concatenated.get(0)).toBe(1);
      expect(concatenated.get(3)).toBe(4);
      expect(concatenated.get(5)).toBe(6);
    });

    it('should convert to array', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const array = list.toArray();
      
      expect(array).toEqual([1, 2, 3]);
      
      // The returned array should be a copy
      array[0] = 5;
      expect(list.get(0)).toBe(1);
    });

    it('should be iterable', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const values: number[] = [];
      
      for (const value of list) {
        values.push(value);
      }
      
      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe('transformation operations', () => {
    it('should map elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const mapped = list.map(x => x * 2);
      
      expect(mapped.size).toBe(3);
      expect(mapped.get(0)).toBe(2);
      expect(mapped.get(1)).toBe(4);
      expect(mapped.get(2)).toBe(6);
    });

    it('should filter elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      const filtered = list.filter(x => x % 2 === 0);
      
      expect(filtered.size).toBe(2);
      expect(filtered.get(0)).toBe(2);
      expect(filtered.get(1)).toBe(4);
    });

    it('should reduce elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      const sum = list.reduce((acc, x) => acc + x, 0);
      
      expect(sum).toBe(15);
    });

    it('should find elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      
      const found = list.find(x => x > 3);
      expect(found).toBe(4);
      
      const notFound = list.find(x => x > 10);
      expect(notFound).toBeUndefined();
    });

    it('should find element indices', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      
      const foundIndex = list.findIndex(x => x > 3);
      expect(foundIndex).toBe(3);
      
      const notFoundIndex = list.findIndex(x => x > 10);
      expect(notFoundIndex).toBe(-1);
    });

    it('should slice elements', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      
      const slice1 = list.slice(1, 4);
      expect(slice1.size).toBe(3);
      expect(slice1.toArray()).toEqual([2, 3, 4]);
      
      const slice2 = list.slice(2);
      expect(slice2.size).toBe(3);
      expect(slice2.toArray()).toEqual([3, 4, 5]);
      
      const slice3 = list.slice(0, 2);
      expect(slice3.size).toBe(2);
      expect(slice3.toArray()).toEqual([1, 2]);
    });

    it('should perform mapFilterReduce in a single pass', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      
      // Map: square each value
      // Filter: keep only even values
      // Reduce: sum the values
      const result = list.mapFilterReduce(
        x => x * x,
        x => x % 2 === 0,
        (acc, x) => acc + x,
        0
      );
      
      // Expected: 2^2 + 4^2 = 4 + 16 = 20
      expect(result).toBe(20);
    });

    it('should perform mapReduce in a single pass', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      
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

    it('should perform filterMap in a single pass', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      
      // Filter: keep only even numbers
      // Map: square each value
      const result = list.filterMap(
        x => x % 2 === 0,
        x => x * x
      );
      
      // Expected: [2^2, 4^2, 6^2, 8^2, 10^2] = [4, 16, 36, 64, 100]
      expect(result.toArray()).toEqual([4, 16, 36, 64, 100]);
    });
  });

  describe('transient operations', () => {
    it('should create a transient list', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const transient = list.transient();
      
      expect(transient).toBeInstanceOf(TransientChunkedList);
    });

    it('should append to a transient list', () => {
      const list = ChunkedList.from<number>([1, 2, 3]);
      const transient = list.transient();
      
      transient.append(4).append(5);
      const persistent = transient.persistent();
      
      expect(persistent.size).toBe(5);
      expect(persistent.get(3)).toBe(4);
      expect(persistent.get(4)).toBe(5);
    });

    it('should prepend to a transient list', () => {
      const list = ChunkedList.from<number>([3, 4, 5]);
      const transient = list.transient();
      
      transient.prepend(2).prepend(1);
      const persistent = transient.persistent();
      
      expect(persistent.size).toBe(5);
      expect(persistent.get(0)).toBe(1);
      expect(persistent.get(1)).toBe(2);
    });

    it('should set values in a transient list', () => {
      const list = ChunkedList.from<number>([1, 2, 3, 4, 5]);
      const transient = list.transient();
      
      transient.set(1, 10).set(3, 20);
      const persistent = transient.persistent();
      
      expect(persistent.size).toBe(5);
      expect(persistent.get(1)).toBe(10);
      expect(persistent.get(3)).toBe(20);
    });
  });

  describe('medium-sized collections', () => {
    it('should handle medium-sized collections efficiently', () => {
      // Create a medium-sized list (100 elements)
      const elements = Array.from({ length: 100 }, (_, i) => i);
      const list = ChunkedList.from(elements);
      
      expect(list.size).toBe(100);
      
      // Test random access
      expect(list.get(0)).toBe(0);
      expect(list.get(50)).toBe(50);
      expect(list.get(99)).toBe(99);
      
      // Test updates
      const updatedList = list.set(50, 500);
      expect(list.get(50)).toBe(50); // Original unchanged
      expect(updatedList.get(50)).toBe(500);
      
      // Test appends
      const appendedList = list.append(100);
      expect(appendedList.size).toBe(101);
      expect(appendedList.get(100)).toBe(100);
      
      // Test transformations
      const mappedList = list.map(x => x * 2);
      expect(mappedList.size).toBe(100);
      expect(mappedList.get(50)).toBe(100);
      
      const filteredList = list.filter(x => x % 10 === 0);
      expect(filteredList.size).toBe(10);
      expect(filteredList.toArray()).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
    });
  });
});
