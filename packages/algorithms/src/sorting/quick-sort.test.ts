import { describe, it, expect } from 'vitest';
import { quickSort, quickSortList, functionalQuickSort } from './quick-sort';
import { List } from '@reduct/data-structures';

describe('QuickSort', () => {
  describe('quickSort', () => {
    it('should sort an array of numbers', () => {
      const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
      const sorted = quickSort(unsorted);

      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
      // Original array should not be modified
      expect(unsorted).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should handle empty arrays', () => {
      expect(quickSort([])).toEqual([]);
    });

    it('should handle arrays with one element', () => {
      expect(quickSort([5])).toEqual([5]);
    });

    it('should handle already sorted arrays', () => {
      expect(quickSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle arrays with duplicate elements', () => {
      expect(quickSort([3, 3, 3, 1, 2, 2])).toEqual([1, 2, 2, 3, 3, 3]);
    });

    it('should sort strings correctly', () => {
      expect(quickSort(['b', 'a', 'c', 'A', 'B'])).toEqual(['A', 'B', 'a', 'b', 'c']);
    });

    it('should use custom compare function when provided', () => {
      const numbers = [5, 2, 10, 1, 20];

      // Sort in descending order
      const descendingSort = quickSort(numbers, (a, b) => b - a);
      expect(descendingSort).toEqual([20, 10, 5, 2, 1]);

      // Sort by string length
      const strings = ['apple', 'banana', 'kiwi', 'grape'];
      const byLength = quickSort(strings, (a, b) => a.length - b.length);
      expect(byLength).toEqual(['kiwi', 'apple', 'grape', 'banana']);
    });
  });

  describe('quickSortList', () => {
    it('should sort a List of numbers', () => {
      const unsorted = List.of(3, 1, 4, 1, 5, 9, 2, 6);
      const sorted = quickSortList(unsorted);

      expect(sorted.toArray()).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    it('should handle empty Lists', () => {
      expect(quickSortList(List.empty()).toArray()).toEqual([]);
    });

    it('should handle Lists with one element', () => {
      expect(quickSortList(List.of(5)).toArray()).toEqual([5]);
    });

    it('should use custom compare function when provided', () => {
      const numbers = List.of(5, 2, 10, 1, 20);

      // Sort in descending order
      const descendingSort = quickSortList(numbers, (a, b) => b - a);
      expect(descendingSort.toArray()).toEqual([20, 10, 5, 2, 1]);
    });
  });

  describe('functionalQuickSort', () => {
    it('should sort an array of numbers', () => {
      const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
      const sorted = functionalQuickSort(unsorted);

      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
      // Original array should not be modified
      expect(unsorted).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    });

    it('should handle empty arrays', () => {
      expect(functionalQuickSort([])).toEqual([]);
    });

    it('should handle arrays with one element', () => {
      expect(functionalQuickSort([5])).toEqual([5]);
    });

    it('should handle already sorted arrays', () => {
      expect(functionalQuickSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle arrays with duplicate elements', () => {
      expect(functionalQuickSort([3, 3, 3, 1, 2, 2])).toEqual([1, 2, 2, 3, 3, 3]);
    });

    it('should use custom compare function when provided', () => {
      const numbers = [5, 2, 10, 1, 20];

      // Sort in descending order
      const descendingSort = functionalQuickSort(numbers, (a, b) => b - a);
      expect(descendingSort).toEqual([20, 10, 5, 2, 1]);
    });
  });
});
