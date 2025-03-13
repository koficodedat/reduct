/**
 * MergeSort implementation
 *
 * A functional implementation of the merge sort algorithm.
 *
 * Time Complexity:
 * - Best: O(n log n)
 * - Average: O(n log n)
 * - Worst: O(n log n)
 *
 * Space Complexity: O(n)
 *
 * @packageDocumentation
 */

import { List } from '@reduct/data-structures';
import { CompareFunction, defaultCompare } from './quickSort';

/**
 * Sorts an array using the merge sort algorithm.
 *
 * @param items - The array to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted array
 *
 * @example
 * ```typescript
 * mergeSort([3, 1, 4, 1, 5, 9, 2, 6]); // [1, 1, 2, 3, 4, 5, 6, 9]
 * ```
 */
export function mergeSort<T>(
  items: readonly T[],
  compareFn: CompareFunction<T> = defaultCompare,
): T[] {
  // Create a copy to avoid mutating the original array
  const result = [...items];

  if (result.length <= 1) {
    return result;
  }

  // Split the array into two halves
  const middle = Math.floor(result.length / 2);
  const left = result.slice(0, middle);
  const right = result.slice(middle);

  // Recursively sort both halves
  return merge(mergeSort(left, compareFn), mergeSort(right, compareFn), compareFn);
}

/**
 * Merges two sorted arrays into a single sorted array.
 *
 * @param left - The left sorted array
 * @param right - The right sorted array
 * @param compareFn - Function to determine the sort order
 * @returns A new merged and sorted array
 * @internal
 */
function merge<T>(left: T[], right: T[], compareFn: CompareFunction<T>): T[] {
  const result: T[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  // Compare elements from both arrays and add the smaller one to the result
  while (leftIndex < left.length && rightIndex < right.length) {
    if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  // Add any remaining elements
  return [...result, ...left.slice(leftIndex), ...right.slice(rightIndex)];
}

/**
 * Sorts a List using the merge sort algorithm.
 *
 * @param list - The List to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted List
 *
 * @example
 * ```typescript
 * const list = List.of(3, 1, 4, 1, 5);
 * const sorted = mergeSortList(list); // List.of(1, 1, 3, 4, 5)
 * ```
 */
export function mergeSortList<T>(
  list: List<T>,
  compareFn: CompareFunction<T> = defaultCompare,
): List<T> {
  const sortedArray = mergeSort(list.toArray(), compareFn);
  return List.from(sortedArray);
}

/**
 * Implementation of merge sort using a bottom-up iterative approach.
 *
 * This version avoids recursion and builds the sorted array iteratively
 * by merging increasingly larger subarrays.
 *
 * @param items - The array to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted array
 *
 * @example
 * ```typescript
 * bottomUpMergeSort([3, 1, 4, 1, 5]); // [1, 1, 3, 4, 5]
 * ```
 */
export function bottomUpMergeSort<T>(
  items: readonly T[],
  compareFn: CompareFunction<T> = defaultCompare,
): T[] {
  // Create a copy to avoid mutating the original array
  const result = [...items];

  if (result.length <= 1) {
    return result;
  }

  const n = result.length;

  // Iteratively merge subarrays of increasing size
  // Start with subarrays of size 1, then 2, 4, 8, etc.
  for (let size = 1; size < n; size *= 2) {
    // Merge adjacent subarrays of size 'size'
    for (let leftStart = 0; leftStart < n; leftStart += 2 * size) {
      const middle = Math.min(leftStart + size, n);
      const rightEnd = Math.min(leftStart + 2 * size, n);

      // Check if we have something to merge
      if (middle < rightEnd) {
        // Create copies of the subarrays to merge
        const left = result.slice(leftStart, middle);
        const right = result.slice(middle, rightEnd);

        // Merge the subarrays
        const merged = merge(left, right, compareFn);

        // Copy the merged result back into the original array
        for (let i = 0; i < merged.length; i++) {
          result[leftStart + i] = merged[i];
        }
      }
    }
  }

  return result;
}
