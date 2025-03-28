/**
 * QuickSort implementation
 *
 * A functional implementation of the quicksort algorithm.
 *
 * Time Complexity:
 * - Best: O(n log n)
 * - Average: O(n log n)
 * - Worst: O(n²)
 *
 * Space Complexity: O(log n) - due to the call stack
 *
 * @packageDocumentation
 */

import { List } from '@reduct/data-structures';

/**
 * Compare function type
 */
export type CompareFunction<T> = (a: T, b: T) => number;

/**
 * Default compare function for comparing elements
 */
export function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Sorts an array using the quicksort algorithm.
 *
 * @param items - The array to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted array
 *
 * @example
 * ```typescript
 * quickSort([3, 1, 4, 1, 5, 9, 2, 6]); // [1, 1, 2, 3, 4, 5, 6, 9]
 * ```
 */
export function quickSort<T>(
  items: readonly T[],
  compareFn: CompareFunction<T> = defaultCompare,
): T[] {
  if (items.length <= 1) {
    return [...items];
  }

  // Create a copy to avoid mutating the original array
  const result = [...items];

  // Call the recursive implementation
  return quickSortRecursive(result, 0, result.length - 1, compareFn);
}

/**
 * Recursive implementation of quicksort
 *
 * @param items - The array being sorted
 * @param left - The left boundary of the current partition
 * @param right - The right boundary of the current partition
 * @param compareFn - Function to determine the sort order
 * @returns The sorted array
 * @internal
 */
function quickSortRecursive<T>(
  items: T[],
  left: number,
  right: number,
  compareFn: CompareFunction<T>,
): T[] {
  if (left < right) {
    // Partition the array and get the pivot index
    const pivotIndex = partition(items, left, right, compareFn);

    // Sort the left partition
    quickSortRecursive(items, left, pivotIndex - 1, compareFn);

    // Sort the right partition
    quickSortRecursive(items, pivotIndex + 1, right, compareFn);
  }

  return items;
}

/**
 * Partitions the array and returns the pivot index
 *
 * @param items - The array to partition
 * @param left - The left boundary
 * @param right - The right boundary
 * @param compareFn - Function to determine the sort order
 * @returns The pivot index
 * @internal
 */
function partition<T>(
  items: T[],
  left: number,
  right: number,
  compareFn: CompareFunction<T>,
): number {
  // Use the rightmost element as the pivot
  const pivot = items[right];

  // Index of the smaller element
  let i = left - 1;

  for (let j = left; j < right; j++) {
    // If the current element is less than or equal to the pivot
    if (compareFn(items[j], pivot) <= 0) {
      // Increment the index of the smaller element
      i++;

      // Swap elements
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  // Place the pivot element in its correct position
  [items[i + 1], items[right]] = [items[right], items[i + 1]];

  // Return the pivot's index
  return i + 1;
}

/**
 * Sorts a List using the quicksort algorithm.
 *
 * @param list - The List to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted List
 *
 * @example
 * ```typescript
 * const list = List.of(3, 1, 4, 1, 5);
 * const sorted = quickSortList(list); // List.of(1, 1, 3, 4, 5)
 * ```
 */
export function quickSortList<T>(
  list: List<T>,
  compareFn: CompareFunction<T> = defaultCompare,
): List<T> {
  const sortedArray = quickSort(list.toArray(), compareFn);
  return List.from(sortedArray);
}

/**
 * A purely functional implementation of quicksort using recursion and immutability.
 *
 * Rather than sorting in place, this version creates new arrays at each step,
 * making it a pure function with no side effects.
 *
 * Note: This implementation is conceptually cleaner but less efficient than the
 * standard quicksort due to additional memory allocations.
 *
 * @param items - The array to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted array
 *
 * @example
 * ```typescript
 * functionalQuickSort([3, 1, 4, 1, 5]); // [1, 1, 3, 4, 5]
 * ```
 */
export function functionalQuickSort<T>(
  items: readonly T[],
  compareFn: CompareFunction<T> = defaultCompare,
): T[] {
  // Base case: arrays with 0 or 1 elements are already sorted
  if (items.length <= 1) {
    return [...items];
  }

  // Choose a pivot (first element for simplicity)
  const pivot = items[0];

  // Partition the array
  const less: T[] = [];
  const equal: T[] = [];
  const greater: T[] = [];

  for (const item of items) {
    const comparison = compareFn(item, pivot);

    if (comparison < 0) {
      less.push(item);
    } else if (comparison === 0) {
      equal.push(item);
    } else {
      greater.push(item);
    }
  }

  // Recursively sort the partitions and combine them
  return [
    ...functionalQuickSort(less, compareFn),
    ...equal,
    ...functionalQuickSort(greater, compareFn),
  ];
}
