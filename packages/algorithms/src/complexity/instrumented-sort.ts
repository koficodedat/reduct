/**
 * Instrumented sorting algorithms for complexity analysis
 *
 * These implementations use the OperationCounter to track
 * algorithm performance characteristics.
 *
 * @packageDocumentation
 */

import { OperationCounter } from './index';

/**
 * Instrumented QuickSort implementation with operation counting
 *
 * @param counter - Operation counter wrapping the array
 * @param left - Start index
 * @param right - End index
 * @returns Sorted array
 */
export function instrumentedQuickSort<T>(
  counter: OperationCounter<T>,
  left: number = 0,
  right: number = counter.length - 1,
): T[] {
  if (left < right) {
    // Partition the array and get the pivot index
    const pivotIndex = instrumentedPartition(counter, left, right);

    // Sort the left partition
    instrumentedQuickSort(counter, left, pivotIndex - 1);

    // Sort the right partition
    instrumentedQuickSort(counter, pivotIndex + 1, right);
  }

  return counter.getArray();
}

/**
 * Partition function for instrumented QuickSort
 *
 * @param counter - Operation counter
 * @param left - Start index
 * @param right - End index
 * @returns Partition index
 * @internal
 */
function instrumentedPartition<T>(
  counter: OperationCounter<T>,
  left: number,
  right: number,
): number {
  // Use the rightmost element as the pivot
  const pivot = counter.get(right);

  // Index of the smaller element
  let i = left - 1;

  for (let j = left; j < right; j++) {
    // If the current element is less than or equal to the pivot
    if (counter.compare(counter.get(j), pivot) <= 0) {
      // Increment the index of the smaller element
      i++;

      // Swap elements
      counter.swap(i, j);
    }
  }

  // Place the pivot element in its correct position
  counter.swap(i + 1, right);

  // Return the pivot's index
  return i + 1;
}

/**
 * Instrumented MergeSort implementation with operation counting
 *
 * @param counter - Operation counter wrapping the array
 * @returns Sorted array
 */
export function instrumentedMergeSort<T>(counter: OperationCounter<T>): T[] {
  const array = counter.getArray();
  if (array.length <= 1) {
    return array;
  }

  const tempCounter = new OperationCounter<T>(array);
  instrumentedMergeSortHelper(counter, tempCounter, 0, array.length - 1);
  return counter.getArray();
}

/**
 * Helper function for instrumented MergeSort
 *
 * @param counter - Operation counter
 * @param tempCounter - Temporary counter for merging
 * @param left - Start index
 * @param right - End index
 * @internal
 */
function instrumentedMergeSortHelper<T>(
  counter: OperationCounter<T>,
  tempCounter: OperationCounter<T>,
  left: number,
  right: number,
): void {
  if (left < right) {
    const mid = Math.floor((left + right) / 2);

    // Sort first and second halves
    instrumentedMergeSortHelper(counter, tempCounter, left, mid);
    instrumentedMergeSortHelper(counter, tempCounter, mid + 1, right);

    // Merge the sorted halves
    instrumentedMerge(counter, tempCounter, left, mid, right);
  }
}

/**
 * Merge function for instrumented MergeSort
 *
 * @param counter - Operation counter
 * @param tempCounter - Temporary counter for merging
 * @param left - Start index
 * @param mid - Middle index
 * @param right - End index
 * @internal
 */
function instrumentedMerge<T>(
  counter: OperationCounter<T>,
  tempCounter: OperationCounter<T>,
  left: number,
  mid: number,
  right: number,
): void {
  // Copy elements to temp array
  for (let i = left; i <= right; i++) {
    tempCounter.set(i, counter.get(i));
  }

  let i = left; // Index for left subarray
  let j = mid + 1; // Index for right subarray
  let k = left; // Index for merged array

  // Merge the subarrays
  while (i <= mid && j <= right) {
    if (counter.compare(tempCounter.get(i), tempCounter.get(j)) <= 0) {
      counter.set(k, tempCounter.get(i));
      i++;
    } else {
      counter.set(k, tempCounter.get(j));
      j++;
    }
    k++;
  }

  // Copy remaining elements from left subarray
  while (i <= mid) {
    counter.set(k, tempCounter.get(i));
    i++;
    k++;
  }
}
