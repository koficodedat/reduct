/**
 * HeapSort implementation
 *
 * A functional implementation of the heap sort algorithm.
 *
 * Time Complexity:
 * - Best: O(n log n)
 * - Average: O(n log n)
 * - Worst: O(n log n)
 *
 * Space Complexity: O(1) - it sorts in place
 *
 * @packageDocumentation
 */

import { List } from '@reduct/data-structures';
import { CompareFunction, defaultCompare } from './quick-sort';

/**
 * Sorts an array using the heap sort algorithm.
 *
 * @param items - The array to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted array
 *
 * @example
 * ```typescript
 * heapSort([3, 1, 4, 1, 5, 9, 2, 6]); // [1, 1, 2, 3, 4, 5, 6, 9]
 * ```
 */
export function heapSort<T>(
  items: readonly T[],
  compareFn: CompareFunction<T> = defaultCompare,
): T[] {
  // Create a copy to avoid mutating the original array
  const result = [...items];

  if (result.length <= 1) {
    return result;
  }

  // Build max heap
  buildMaxHeap(result, compareFn);

  // Extract elements from the heap one by one
  for (let i = result.length - 1; i > 0; i--) {
    // Swap the root (maximum value) with the last element
    [result[0], result[i]] = [result[i], result[0]];

    // Call heapify on the reduced heap
    heapify(result, 0, i, compareFn);
  }

  return result;
}

/**
 * Builds a max heap from an array
 *
 * @param items - The array to transform into a heap
 * @param compareFn - Function to determine the sort order
 * @internal
 */
function buildMaxHeap<T>(items: T[], compareFn: CompareFunction<T>): void {
  const n = items.length;

  // Start from the last non-leaf node and heapify each node
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(items, i, n, compareFn);
  }
}

/**
 * Heapifies a subtree rooted at the given index
 *
 * @param items - The array containing the heap
 * @param rootIndex - The root index of the subtree to heapify
 * @param heapSize - The size of the heap
 * @param compareFn - Function to determine the sort order
 * @internal
 */
function heapify<T>(
  items: T[],
  rootIndex: number,
  heapSize: number,
  compareFn: CompareFunction<T>,
): void {
  let largest = rootIndex;
  const left = 2 * rootIndex + 1;
  const right = 2 * rootIndex + 2;

  // If left child is larger than root
  if (left < heapSize && compareFn(items[left], items[largest]) > 0) {
    largest = left;
  }

  // If right child is larger than largest so far
  if (right < heapSize && compareFn(items[right], items[largest]) > 0) {
    largest = right;
  }

  // If largest is not root
  if (largest !== rootIndex) {
    // Swap largest with root
    [items[rootIndex], items[largest]] = [items[largest], items[rootIndex]];

    // Recursively heapify the affected subtree
    heapify(items, largest, heapSize, compareFn);
  }
}

/**
 * Sorts a List using the heap sort algorithm.
 *
 * @param list - The List to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted List
 *
 * @example
 * ```typescript
 * const list = List.of(3, 1, 4, 1, 5);
 * const sorted = heapSortList(list); // List.of(1, 1, 3, 4, 5)
 * ```
 */
export function heapSortList<T>(
  list: List<T>,
  compareFn: CompareFunction<T> = defaultCompare,
): List<T> {
  const sortedArray = heapSort(list.toArray(), compareFn);
  return List.from(sortedArray);
}

/**
 * A more functional implementation of heap sort
 *
 * While less efficient due to more allocations, this version demonstrates
 * a more functional approach to the algorithm using immutable operations.
 *
 * @param items - The array to sort
 * @param compareFn - Optional function to determine the sort order
 * @returns A new sorted array
 *
 * @example
 * ```typescript
 * functionalHeapSort([3, 1, 4, 1, 5]); // [1, 1, 3, 4, 5]
 * ```
 */
export function functionalHeapSort<T>(
  items: readonly T[],
  compareFn: CompareFunction<T> = defaultCompare,
): T[] {
  if (items.length <= 1) {
    return [...items];
  }

  // Convert array to max heap
  const heap = [...items];

  const heapify = (arr: T[], i: number, n: number): T[] => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && compareFn(arr[left], arr[largest]) > 0) {
      largest = left;
    }

    if (right < n && compareFn(arr[right], arr[largest]) > 0) {
      largest = right;
    }

    if (largest !== i) {
      // Create a new array with swapped elements
      const newArr = [...arr];
      [newArr[i], newArr[largest]] = [newArr[largest], newArr[i]];

      // Recursively heapify the affected subtree
      return heapify(newArr, largest, n);
    }

    return arr;
  };

  // Build the max heap
  let heapified = [...heap];
  for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) {
    heapified = heapify(heapified, i, heap.length);
  }

  // Extract elements one by one
  let result = [...heapified];
  let size = result.length;

  while (size > 1) {
    // Swap the root (maximum value) with the last element
    const newResult = [...result];
    [newResult[0], newResult[size - 1]] = [newResult[size - 1], newResult[0]];

    // Reduce heap size and heapify the root
    size--;
    result = heapify(newResult, 0, size);
  }

  return result;
}
