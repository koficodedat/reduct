import { describe, it, expect } from 'vitest';
import {
  binarySearch,
  binarySearchList,
  recursiveBinarySearch,
  binarySearchInsertionPoint,
} from '../../../src/searching/binary-search';
import { List } from '@reduct/data-structures';

describe('Binary Search', () => {
  describe('binarySearch', () => {
    it('should find an element in a sorted array', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(binarySearch(array, 1)).toBe(0);
      expect(binarySearch(array, 5)).toBe(4);
      expect(binarySearch(array, 10)).toBe(9);
    });

    it('should return -1 if the element is not found', () => {
      const array = [1, 2, 3, 4, 5];

      expect(binarySearch(array, 0)).toBe(-1);
      expect(binarySearch(array, 6)).toBe(-1);
    });

    it('should handle empty arrays', () => {
      expect(binarySearch([], 1)).toBe(-1);
    });

    it('should handle arrays with one element', () => {
      expect(binarySearch([5], 5)).toBe(0);
      expect(binarySearch([5], 1)).toBe(-1);
    });

    it('should use custom compare function when provided', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'David' },
      ];

      const target = { id: 3, name: 'Charlie' };
      const result = binarySearch(array, target, (a, b) => a.id - b.id);

      expect(result).toBe(2);

      // Search with a different property
      const nameSearch = binarySearch(['Alice', 'Bob', 'Charlie', 'David'], 'Charlie');

      expect(nameSearch).toBe(2);
    });
  });

  describe('binarySearchList', () => {
    it('should find an element in a sorted List', () => {
      const list = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

      expect(binarySearchList(list, 1).get()).toBe(0);
      expect(binarySearchList(list, 5).get()).toBe(4);
      expect(binarySearchList(list, 10).get()).toBe(9);
    });

    it('should return None if the element is not found', () => {
      const list = List.of(1, 2, 3, 4, 5);

      expect(binarySearchList(list, 0).isNone()).toBe(true);
      expect(binarySearchList(list, 6).isNone()).toBe(true);
    });

    it('should handle empty Lists', () => {
      expect(binarySearchList(List.empty(), 1).isNone()).toBe(true);
    });

    it('should handle Lists with one element', () => {
      expect(binarySearchList(List.of(5), 5).get()).toBe(0);
      expect(binarySearchList(List.of(5), 1).isNone()).toBe(true);
    });
  });

  describe('recursiveBinarySearch', () => {
    it('should find an element in a sorted array', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(recursiveBinarySearch(array, 1)).toBe(0);
      expect(recursiveBinarySearch(array, 5)).toBe(4);
      expect(recursiveBinarySearch(array, 10)).toBe(9);
    });

    it('should return -1 if the element is not found', () => {
      const array = [1, 2, 3, 4, 5];

      expect(recursiveBinarySearch(array, 0)).toBe(-1);
      expect(recursiveBinarySearch(array, 6)).toBe(-1);
    });

    it('should handle empty arrays', () => {
      expect(recursiveBinarySearch([], 1)).toBe(-1);
    });

    it('should handle arrays with one element', () => {
      expect(recursiveBinarySearch([5], 5)).toBe(0);
      expect(recursiveBinarySearch([5], 1)).toBe(-1);
    });

    it('should match the iterative implementation', () => {
      const arrays = [[], [1], [1, 2, 3, 4, 5], [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]];

      for (const arr of arrays) {
        for (let i = 0; i < 15; i++) {
          const target = i * 10 + 10; // 10, 20, 30, ...
          expect(recursiveBinarySearch(arr, target)).toBe(binarySearch(arr, target));
        }
      }
    });
  });

  describe('binarySearchInsertionPoint', () => {
    it('should find the correct insertion point when element is not in array', () => {
      const array = [1, 3, 5, 7, 9];

      expect(binarySearchInsertionPoint(array, 0)).toBe(0);
      expect(binarySearchInsertionPoint(array, 2)).toBe(1);
      expect(binarySearchInsertionPoint(array, 4)).toBe(2);
      expect(binarySearchInsertionPoint(array, 6)).toBe(3);
      expect(binarySearchInsertionPoint(array, 8)).toBe(4);
      expect(binarySearchInsertionPoint(array, 10)).toBe(5);
    });

    it('should return the index of the first occurrence when element is in array', () => {
      const array = [1, 3, 3, 3, 5, 7];

      expect(binarySearchInsertionPoint(array, 1)).toBe(0);
      expect(binarySearchInsertionPoint(array, 3)).toBe(1); // First occurrence
      expect(binarySearchInsertionPoint(array, 5)).toBe(4);
      expect(binarySearchInsertionPoint(array, 7)).toBe(5);
    });

    it('should handle empty arrays', () => {
      expect(binarySearchInsertionPoint([], 1)).toBe(0);
    });

    it('should handle arrays with one element', () => {
      expect(binarySearchInsertionPoint([5], 1)).toBe(0);
      expect(binarySearchInsertionPoint([5], 5)).toBe(0);
      expect(binarySearchInsertionPoint([5], 10)).toBe(1);
    });

    it('should use custom compare function when provided', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 3, name: 'Charlie' },
        { id: 5, name: 'Eve' },
      ];

      const target = { id: 2, name: 'Bob' };
      const result = binarySearchInsertionPoint(array, target, (a, b) => a.id - b.id);

      expect(result).toBe(1); // Should be inserted between Alice and Charlie
    });
  });
});
