import { describe, it, expect } from 'vitest';
import { mergeSort, mergeSortList, bottomUpMergeSort } from './merge-sort';
import { List } from '@reduct/data-structures';

describe('MergeSort', () => {
  describe('mergeSort', () => {
    it('should sort an array of numbers', () => {
      const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
      const sorted = mergeSort(unsorted);

      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
      // Original array should not be modified
      expect(unsorted).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should handle empty arrays', () => {
      expect(mergeSort([])).toEqual([]);
    });

    it('should handle arrays with one element', () => {
      expect(mergeSort([5])).toEqual([5]);
    });

    it('should handle already sorted arrays', () => {
      expect(mergeSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle arrays with duplicate elements', () => {
      expect(mergeSort([3, 3, 3, 1, 2, 2])).toEqual([1, 2, 2, 3, 3, 3]);
    });

    it('should sort strings correctly', () => {
      expect(mergeSort(['b', 'a', 'c', 'A', 'B'])).toEqual(['A', 'B', 'a', 'b', 'c']);
    });

    it('should use custom compare function when provided', () => {
      const numbers = [5, 2, 10, 1, 20];

      // Sort in descending order
      const descendingSort = mergeSort(numbers, (a, b) => b - a);
      expect(descendingSort).toEqual([20, 10, 5, 2, 1]);

      // Sort by string length
      const strings = ['apple', 'banana', 'kiwi', 'grape'];
      const byLength = mergeSort(strings, (a, b) => a.length - b.length);
      expect(byLength).toEqual(['kiwi', 'apple', 'grape', 'banana']);
    });
  });

  describe('mergeSortList', () => {
    it('should sort a List of numbers', () => {
      const unsorted = List.of(3, 1, 4, 1, 5, 9, 2, 6);
      const sorted = mergeSortList(unsorted);

      expect(sorted.toArray()).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    it('should handle empty Lists', () => {
      expect(mergeSortList(List.empty()).toArray()).toEqual([]);
    });

    it('should handle Lists with one element', () => {
      expect(mergeSortList(List.of(5)).toArray()).toEqual([5]);
    });

    it('should use custom compare function when provided', () => {
      const numbers = List.of(5, 2, 10, 1, 20);

      // Sort in descending order
      const descendingSort = mergeSortList(numbers, (a, b) => b - a);
      expect(descendingSort.toArray()).toEqual([20, 10, 5, 2, 1]);
    });
  });

  describe('bottomUpMergeSort', () => {
    it('should sort an array of numbers', () => {
      const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
      const sorted = bottomUpMergeSort(unsorted);

      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
      // Original array should not be modified
      expect(unsorted).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should handle empty arrays', () => {
      expect(bottomUpMergeSort([])).toEqual([]);
    });

    it('should handle arrays with one element', () => {
      expect(bottomUpMergeSort([5])).toEqual([5]);
    });

    it('should handle already sorted arrays', () => {
      expect(bottomUpMergeSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle arrays with duplicate elements', () => {
      expect(bottomUpMergeSort([3, 3, 3, 1, 2, 2])).toEqual([1, 2, 2, 3, 3, 3]);
    });

    it('should use custom compare function when provided', () => {
      const numbers = [5, 2, 10, 1, 20];

      // Sort in descending order
      const descendingSort = bottomUpMergeSort(numbers, (a, b) => b - a);
      expect(descendingSort).toEqual([20, 10, 5, 2, 1]);
    });

    it('should produce the same results as the recursive implementation', () => {
      const arrays = [
        [],
        [1],
        [3, 1, 4, 1, 5, 9, 2, 6],
        [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        [1, 2, 3, 4, 5],
      ];

      for (const arr of arrays) {
        expect(bottomUpMergeSort(arr)).toEqual(mergeSort(arr));
      }
    });
  });
});
