import { describe, it, expect } from 'vitest';
import { heapSort, heapSortList, functionalHeapSort } from '../../../src/sorting/heap-sort';
import { List } from '@reduct/data-structures';

describe('HeapSort', () => {
  describe('heapSort', () => {
    it('should sort an array of numbers', () => {
      const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
      const sorted = heapSort(unsorted);

      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
      // Original array should not be modified
      expect(unsorted).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should handle empty arrays', () => {
      expect(heapSort([])).toEqual([]);
    });

    it('should handle arrays with one element', () => {
      expect(heapSort([5])).toEqual([5]);
    });

    it('should handle already sorted arrays', () => {
      expect(heapSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle arrays with duplicate elements', () => {
      expect(heapSort([3, 3, 3, 1, 2, 2])).toEqual([1, 2, 2, 3, 3, 3]);
    });

    it('should sort strings correctly', () => {
      expect(heapSort(['b', 'a', 'c', 'A', 'B'])).toEqual(['A', 'B', 'a', 'b', 'c']);
    });

    it('should use custom compare function when provided', () => {
      const numbers = [5, 2, 10, 1, 20];

      // Sort in descending order
      const descendingSort = heapSort(numbers, (a, b) => b - a);
      expect(descendingSort).toEqual([20, 10, 5, 2, 1]);

      // Sort by string length
      const strings = ['apple', 'banana', 'kiwi', 'grape'];
      const byLength = heapSort(strings, (a, b) => a.length - b.length);
      expect(byLength).toEqual(['kiwi', 'apple', 'grape', 'banana']);
    });
  });

  describe('heapSortList', () => {
    it('should sort a List of numbers', () => {
      const unsorted = List.of(3, 1, 4, 1, 5, 9, 2, 6);
      const sorted = heapSortList(unsorted);

      expect(sorted.toArray()).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    it('should handle empty Lists', () => {
      expect(heapSortList(List.empty()).toArray()).toEqual([]);
    });

    it('should handle Lists with one element', () => {
      expect(heapSortList(List.of(5)).toArray()).toEqual([5]);
    });

    it('should use custom compare function when provided', () => {
      const numbers = List.of(5, 2, 10, 1, 20);

      // Sort in descending order
      const descendingSort = heapSortList(numbers, (a, b) => b - a);
      expect(descendingSort.toArray()).toEqual([20, 10, 5, 2, 1]);
    });
  });

  describe('functionalHeapSort', () => {
    it('should sort an array of numbers', () => {
      const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
      const sorted = functionalHeapSort(unsorted);

      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
      // Original array should not be modified
      expect(unsorted).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should handle empty arrays', () => {
      expect(functionalHeapSort([])).toEqual([]);
    });

    it('should handle arrays with one element', () => {
      expect(functionalHeapSort([5])).toEqual([5]);
    });

    it('should handle already sorted arrays', () => {
      expect(functionalHeapSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle arrays with duplicate elements', () => {
      expect(functionalHeapSort([3, 3, 3, 1, 2, 2])).toEqual([1, 2, 2, 3, 3, 3]);
    });

    it('should match the imperative implementation', () => {
      const arrays = [
        [],
        [1],
        [3, 1, 4, 1, 5, 9, 2, 6],
        [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        [1, 2, 3, 4, 5],
      ];

      for (const arr of arrays) {
        expect(functionalHeapSort(arr)).toEqual(heapSort(arr));
      }
    });
  });
});
