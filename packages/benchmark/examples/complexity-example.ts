/**
 * Complexity analysis example
 *
 * This example demonstrates how to use the complexity analysis tools
 * to measure algorithm performance characteristics.
 */

import {
  OperationCounter,
  instrumentedQuickSort,
  instrumentedMergeSort,
  analyzeOperationComplexity,
  formatComplexityReport
} from '@reduct/benchmark';

// Generate random arrays for testing
function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
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

// Example 2: Analyzing algorithm complexity
console.log('\nExample 2: Algorithm Complexity Analysis');
const quickSortResult = analyzeOperationComplexity(
  'QuickSort',
  counter => instrumentedQuickSort(counter),
  size => new OperationCounter(generateRandomArray(size)),
  { minSize: 10, maxSize: 1000, steps: 5 }
);

console.log(formatComplexityReport(quickSortResult));

const mergeSortResult = analyzeOperationComplexity(
  'MergeSort',
  counter => instrumentedMergeSort(counter),
  size => new OperationCounter(generateRandomArray(size)),
  { minSize: 10, maxSize: 1000, steps: 5 }
);

console.log(formatComplexityReport(mergeSortResult));
