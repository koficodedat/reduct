/**
 * Binary Search implementation
 *
 * A functional implementation of the binary search algorithm for finding
 * an element in a sorted array.
 *
 * Time Complexity: O(log n)
 * Space Complexity: O(1) for iterative, O(log n) for recursive (due to call stack)
 *
 * @packageDocumentation
 */

import { Option, some, none } from '@reduct/core';
import { List } from '@reduct/data-structures';
import { CompareFunction, defaultCompare } from '../sorting/quick-sort';

/**
 * Searches for an element in a sorted array using binary search.
 *
 * @param items - The sorted array to search in
 * @param target - The element to find
 * @param compareFn - Optional function to determine the comparison order
 * @returns The index of the element if found, or -1 if not found
 *
 * @example
 * ```typescript
 * binarySearch([1, 2, 3, 4, 5], 3); // 2
 * binarySearch([1, 2, 3, 4, 5], 6); // -1
 * ```
 */
export function binarySearch<T>(
  items: readonly T[],
  target: T,
  compareFn: CompareFunction<T> = defaultCompare,
): number {
  let left = 0;
  let right = items.length - 1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const comparison = compareFn(items[mid], target);

    if (comparison === 0) {
      return mid; // Found the target
    } else if (comparison < 0) {
      left = mid + 1; // Search in the right half
    } else {
      right = mid - 1; // Search in the left half
    }
  }

  return -1; // Target not found
}

/**
 * Searches for an element in a sorted List using binary search.
 *
 * @param list - The sorted List to search in
 * @param target - The element to find
 * @param compareFn - Optional function to determine the comparison order
 * @returns An Option containing the index if found, or None if not found
 *
 * @example
 * ```typescript
 * const list = List.of(1, 2, 3, 4, 5);
 * binarySearchList(list, 3); // Some(2)
 * binarySearchList(list, 6); // None
 * ```
 */
export function binarySearchList<T>(
  list: List<T>,
  target: T,
  compareFn: CompareFunction<T> = defaultCompare,
): Option<number> {
  const index = binarySearch(list.toArray(), target, compareFn);
  return index >= 0 ? some(index) : none;
}

/**
 * Recursive implementation of binary search.
 *
 * @param items - The sorted array to search in
 * @param target - The element to find
 * @param compareFn - Optional function to determine the comparison order
 * @returns The index of the element if found, or -1 if not found
 *
 * @example
 * ```typescript
 * recursiveBinarySearch([1, 2, 3, 4, 5], 3); // 2
 * ```
 */
export function recursiveBinarySearch<T>(
  items: readonly T[],
  target: T,
  compareFn: CompareFunction<T> = defaultCompare,
): number {
  return recursiveSearchHelper(items, target, 0, items.length - 1, compareFn);
}

/**
 * Helper function for recursive binary search.
 *
 * @param items - The sorted array to search in
 * @param target - The element to find
 * @param left - The left boundary
 * @param right - The right boundary
 * @param compareFn - Function to determine the comparison order
 * @returns The index of the element if found, or -1 if not found
 * @internal
 */
function recursiveSearchHelper<T>(
  items: readonly T[],
  target: T,
  left: number,
  right: number,
  compareFn: CompareFunction<T>,
): number {
  // Base case: element not found
  if (left > right) {
    return -1;
  }

  const mid = left + Math.floor((right - left) / 2);
  const comparison = compareFn(items[mid], target);

  if (comparison === 0) {
    return mid; // Found the target
  } else if (comparison < 0) {
    // Search in the right half
    return recursiveSearchHelper(items, target, mid + 1, right, compareFn);
  } else {
    // Search in the left half
    return recursiveSearchHelper(items, target, left, mid - 1, compareFn);
  }
}

/**
 * Returns the insertion point (index) where a value should be inserted into
 * a sorted array to maintain sort order.
 *
 * If the value already exists, the index of the first occurrence is returned.
 *
 * @param items - The sorted array to search in
 * @param target - The element to find the insertion point for
 * @param compareFn - Optional function to determine the comparison order
 * @returns The index where the element should be inserted
 *
 * @example
 * ```typescript
 * binarySearchInsertionPoint([1, 3, 5, 7], 4); // 2
 * binarySearchInsertionPoint([1, 3, 5, 7], 1); // 0 (already exists)
 * ```
 */
export function binarySearchInsertionPoint<T>(
  items: readonly T[],
  target: T,
  compareFn: CompareFunction<T> = defaultCompare,
): number {
  let left = 0;
  let right = items.length;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    const comparison = compareFn(items[mid], target);

    if (comparison < 0) {
      left = mid + 1; // Search in the right half
    } else {
      right = mid; // Search in the left half
    }
  }

  return left;
}
