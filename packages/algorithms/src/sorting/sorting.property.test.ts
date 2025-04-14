import { describe, it } from 'vitest';
import { testing } from '@reduct/core';
const { verifyProperty, arbitrary, properties } = testing;
import { quickSort, functionalQuickSort } from './quick-sort';
import { mergeSort, bottomUpMergeSort } from './merge-sort';
import { heapSort, functionalHeapSort } from './heap-sort';

describe('Sorting Algorithm Property Tests', () => {
  // Generate arbitrary arrays
  const arrayArbitrary = arbitrary.array(arbitrary.integer());

  describe('QuickSort', () => {
    it('should correctly sort arrays', () => {
      properties.sortCorrectness(quickSort, arrayArbitrary);
    });

    it('should preserve array length', () => {
      verifyProperty('preserves array length', [arrayArbitrary], (array: number[]) => {
        const sorted = quickSort(array);
        return sorted.length === array.length;
      });
    });

    it('should be deterministic', () => {
      properties.deterministic(quickSort, arrayArbitrary);
    });

    it('should be equivalent to functional variant', () => {
      verifyProperty(
        'imperative and functional variants are equivalent',
        [arrayArbitrary],
        (array: number[]) => {
          const sorted1 = quickSort(array);
          const sorted2 = functionalQuickSort(array);
          return JSON.stringify(sorted1) === JSON.stringify(sorted2);
        },
      );
    });
  });

  describe('MergeSort', () => {
    it('should correctly sort arrays', () => {
      properties.sortCorrectness(mergeSort, arrayArbitrary);
    });

    it('should preserve array length', () => {
      verifyProperty('preserves array length', [arrayArbitrary], (array: number[]) => {
        const sorted = mergeSort(array);
        return sorted.length === array.length;
      });
    });

    it('should be deterministic', () => {
      properties.deterministic(mergeSort, arrayArbitrary);
    });

    it('should be equivalent to bottom-up variant', () => {
      verifyProperty('recursive and bottom-up variants are equivalent', [arrayArbitrary], (array: number[]) => {
        const sorted1 = mergeSort(array);
        const sorted2 = bottomUpMergeSort(array);
        return JSON.stringify(sorted1) === JSON.stringify(sorted2);
      });
    });
  });

  describe('HeapSort', () => {
    it('should correctly sort arrays', () => {
      properties.sortCorrectness(heapSort, arrayArbitrary);
    });

    it('should preserve array length', () => {
      verifyProperty('preserves array length', [arrayArbitrary], (array: number[]) => {
        const sorted = heapSort(array);
        return sorted.length === array.length;
      });
    });

    it('should be deterministic', () => {
      properties.deterministic(heapSort, arrayArbitrary);
    });

    it('should be equivalent to functional variant', () => {
      verifyProperty(
        'imperative and functional variants are equivalent',
        [arrayArbitrary],
        (array: number[]) => {
          const sorted1 = heapSort(array);
          const sorted2 = functionalHeapSort(array);
          return JSON.stringify(sorted1) === JSON.stringify(sorted2);
        },
      );
    });
  });

  describe('All Sorting Algorithms', () => {
    it('should produce the same results', () => {
      verifyProperty('all sorting algorithms produce same results', [arrayArbitrary], (array: number[]) => {
        const sortMethods = [
          quickSort,
          mergeSort,
          heapSort,
          functionalQuickSort,
          bottomUpMergeSort,
          functionalHeapSort,
        ];

        const results = sortMethods.map(method => method(array));

        // All results should be the same
        for (let i = 1; i < results.length; i++) {
          if (JSON.stringify(results[0]) !== JSON.stringify(results[i])) {
            return false;
          }
        }

        return true;
      });
    });
  });
});
