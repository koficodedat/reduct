/**
 * Sorting algorithm registry
 * 
 * Registers sorting algorithms for benchmarking.
 * 
 * @packageDocumentation
 */

import {
  quickSort,
  mergeSort,
  heapSort,
  functionalQuickSort,
  bottomUpMergeSort,
  functionalHeapSort,
} from '@reduct/algorithms';
import { Registry, Implementation } from '../types';
import { generateRandomArray } from '../../utils';

// Helper type for sorting algorithms
type SortingAlgorithm<T> = (arr: T[]) => T[];

/**
 * Creates a sorting algorithm implementation
 * 
 * @param name - Name of the algorithm
 * @param description - Description of the algorithm
 * @param sortFn - Sorting function
 * @returns Implementation
 */
function createSortingImplementation(
  name: string,
  description: string,
  sortFn: SortingAlgorithm<number>
): Implementation<SortingAlgorithm<number>> {
  return {
    name,
    description,
    category: 'algorithm',
    type: 'sorting',
    create: () => sortFn,
    operations: {
      sort: (algorithm, arr) => algorithm(arr),
      sortRandom: (algorithm) => algorithm(generateRandomArray(1000)),
      sortSorted: (algorithm) => algorithm([...Array(1000)].map((_, i) => i)),
      sortReversed: (algorithm) => algorithm([...Array(1000)].map((_, i) => 1000 - i)),
      sortPartiallySorted: (algorithm) => {
        const arr = [...Array(1000)].map((_, i) => i);
        // Swap some elements to make it partially sorted
        for (let i = 0; i < 100; i++) {
          const idx1 = Math.floor(Math.random() * 1000);
          const idx2 = Math.floor(Math.random() * 1000);
          [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
        }
        return algorithm(arr);
      },
    },
  };
}

/**
 * Quick Sort implementation
 */
const quickSortImpl = createSortingImplementation(
  'Quick Sort',
  'In-place quick sort algorithm',
  quickSort
);

/**
 * Merge Sort implementation
 */
const mergeSortImpl = createSortingImplementation(
  'Merge Sort',
  'Stable merge sort algorithm',
  mergeSort
);

/**
 * Heap Sort implementation
 */
const heapSortImpl = createSortingImplementation(
  'Heap Sort',
  'In-place heap sort algorithm',
  heapSort
);

/**
 * Functional Quick Sort implementation
 */
const functionalQuickSortImpl = createSortingImplementation(
  'Functional Quick Sort',
  'Functional implementation of quick sort',
  functionalQuickSort
);

/**
 * Bottom-up Merge Sort implementation
 */
const bottomUpMergeSortImpl = createSortingImplementation(
  'Bottom-up Merge Sort',
  'Non-recursive merge sort implementation',
  bottomUpMergeSort
);

/**
 * Functional Heap Sort implementation
 */
const functionalHeapSortImpl = createSortingImplementation(
  'Functional Heap Sort',
  'Functional implementation of heap sort',
  functionalHeapSort
);

/**
 * Native Array.sort implementation
 */
const nativeArraySortImpl = createSortingImplementation(
  'Native Array.sort',
  'JavaScript native Array.sort method',
  (arr) => [...arr].sort((a, b) => a - b)
);

/**
 * Sorting algorithm registry
 */
export const sortingRegistry: Registry = {
  'quick-sort': quickSortImpl,
  'merge-sort': mergeSortImpl,
  'heap-sort': heapSortImpl,
  'functional-quick-sort': functionalQuickSortImpl,
  'bottom-up-merge-sort': bottomUpMergeSortImpl,
  'functional-heap-sort': functionalHeapSortImpl,
  'native-array-sort': nativeArraySortImpl,
};
