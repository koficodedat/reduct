/**
 * Reduct Complexity Analysis Example
 *
 * This example demonstrates how to use the complexity analysis tools
 * to verify the runtime behavior of algorithms.
 */

import {
  ComplexityClass,
  OperationCounter,
  analyzeOperationComplexity,
  formatComplexityReport,
} from '@reduct/algorithms/complexity';

import {
  instrumentedQuickSort,
  instrumentedMergeSort,
} from '@reduct/algorithms/complexity/instrumented-sort';

import { quickSort, mergeSort } from '@reduct/algorithms';

// Helper function to generate random test arrays
function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
}

// Helper function to generate nearly sorted arrays
function generateNearlySortedArray(size: number, swapPercentage: number = 0.05): number[] {
  const array = Array.from({ length: size }, (_, i) => i);
  const swapCount = Math.floor(size * swapPercentage);

  for (let i = 0; i < swapCount; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    [array[idx1], array[idx2]] = [array[idx2], array[idx1]];
  }

  return array;
}

// Example 1: Basic operation counting
console.log('Example 1: Basic Operation Counting');
const smallArray = [3, 1, 4, 1, 5, 9, 2, 6];
const quickSortCounter = new OperationCounter(smallArray);
instrumentedQuickSort(quickSortCounter);
console.log(`QuickSort operations for array of size ${smallArray.length}:`);
console.log(quickSortCounter.getCounts());

const mergeSortCounter = new OperationCounter([...smallArray]);
instrumentedMergeSort(mergeSortCounter);
console.log(`MergeSort operations for array of size ${smallArray.length}:`);
console.log(mergeSortCounter.getCounts());

// Example 2: Comparing algorithm complexity with different input types
console.log('\nExample 2: Comparing QuickSort with Different Input Types');

// Analyze QuickSort with random input
const randomInputAnalysis = analyzeOperationComplexity(
  'QuickSort (Random Input)',
  counter => instrumentedQuickSort(counter),
  size => new OperationCounter(generateRandomArray(size)),
  {
    minSize: 100,
    maxSize: 1000,
    steps: 4,
  },
);

// Analyze QuickSort with nearly sorted input
const nearlySortedAnalysis = analyzeOperationComplexity(
  'QuickSort (Nearly Sorted Input)',
  counter => instrumentedQuickSort(counter),
  size => new OperationCounter(generateNearlySortedArray(size)),
  {
    minSize: 100,
    maxSize: 1000,
    steps: 4,
  },
);

console.log(formatComplexityReport(randomInputAnalysis));
console.log(formatComplexityReport(nearlySortedAnalysis));

// Example 3: Comparing QuickSort and MergeSort
console.log('\nExample 3: Comparing Sorting Algorithms');

// Analyze both sorting algorithms with the same input
const quickSortAnalysis = analyzeOperationComplexity(
  'QuickSort',
  counter => instrumentedQuickSort(counter),
  size => new OperationCounter(generateRandomArray(size)),
  {
    minSize: 100,
    maxSize: 1000,
    steps: 4,
  },
);

const mergeSortAnalysis = analyzeOperationComplexity(
  'MergeSort',
  counter => instrumentedMergeSort(counter),
  size => new OperationCounter(generateRandomArray(size)),
  {
    minSize: 100,
    maxSize: 1000,
    steps: 4,
  },
);

console.log(formatComplexityReport(quickSortAnalysis));
console.log(formatComplexityReport(mergeSortAnalysis));
