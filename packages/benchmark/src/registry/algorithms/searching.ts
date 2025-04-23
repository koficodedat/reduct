/**
 * Searching algorithm registry
 *
 * Registers searching algorithms for benchmarking.
 *
 * @packageDocumentation
 */

// TODO: Import searching algorithms when they're implemented
// import { linearSearch, binarySearch } from '@reduct/algorithms';

// Use the temporary implementations from the benchmark package
import { linearSearch, binarySearch } from '../../algorithms/searching';
import { generateRandomArray, generateSortedArray } from '../../utils';
import { Registry, Implementation } from '../types';

// Helper type for searching algorithms
type SearchingAlgorithm<T, V> = (arr: T[], value: V) => number;

/**
 * Creates a searching algorithm implementation
 *
 * @param name - Name of the algorithm
 * @param description - Description of the algorithm
 * @param searchFn - Searching function
 * @param requiresSorted - Whether the algorithm requires sorted input
 * @returns Implementation
 */
function createSearchingImplementation(
  name: string,
  description: string,
  searchFn: SearchingAlgorithm<number, number>,
  requiresSorted: boolean = false
): Implementation<SearchingAlgorithm<number, number>> {
  return {
    name,
    description,
    category: 'algorithm',
    type: 'searching',
    create: () => searchFn,
    operations: {
      search: (algorithm, arr, value) => algorithm(arr, value),
      searchExisting: (algorithm) => {
        const arr = requiresSorted ? generateSortedArray(1000) : generateRandomArray(1000);
        const value = arr[Math.floor(Math.random() * arr.length)];
        return algorithm(arr, value);
      },
      searchNonExisting: (algorithm) => {
        const arr = requiresSorted ? generateSortedArray(1000) : generateRandomArray(1000);
        // Find a value that doesn't exist in the array
        let value = -1;
        while (arr.includes(value)) {
          value--;
        }
        return algorithm(arr, value);
      },
      searchMultiple: (algorithm) => {
        const arr = requiresSorted ? generateSortedArray(1000) : generateRandomArray(1000);
        const values = Array.from({ length: 10 }, () => arr[Math.floor(Math.random() * arr.length)]);
        return values.map(value => algorithm(arr, value));
      },
    },
  };
}

/**
 * Linear Search implementation
 */
const linearSearchImpl = createSearchingImplementation(
  'Linear Search',
  'Simple linear search algorithm',
  linearSearch
);

/**
 * Binary Search implementation
 */
const binarySearchImpl = createSearchingImplementation(
  'Binary Search',
  'Efficient binary search algorithm for sorted arrays',
  binarySearch,
  true
);

/**
 * Native Array.indexOf implementation
 */
const nativeIndexOfImpl = createSearchingImplementation(
  'Native Array.indexOf',
  'JavaScript native Array.indexOf method',
  (arr, value) => arr.indexOf(value)
);

/**
 * Native Array.findIndex implementation
 */
const nativeFindIndexImpl = createSearchingImplementation(
  'Native Array.findIndex',
  'JavaScript native Array.findIndex method',
  (arr, value) => arr.findIndex(item => item === value)
);

/**
 * Searching algorithm registry
 */
export const searchingRegistry: Registry = {
  'linear-search': linearSearchImpl,
  'binary-search': binarySearchImpl,
  'native-index-of': nativeIndexOfImpl,
  'native-find-index': nativeFindIndexImpl,
};
