/**
 * Sorting algorithm benchmarks
 *
 * Provides tools for benchmarking and comparing sorting algorithms.
 *
 * @packageDocumentation
 */

import {
  benchmark,
  compareBenchmarks,
  generateRandomArray,
  generateSortedArray,
  generateReverseSortedArray,
  formatBenchmarkResults,
} from './index';

import { quickSort, functionalQuickSort } from '../sorting/quick-sort';
import { mergeSort, bottomUpMergeSort } from '../sorting/merge-sort';
import { heapSort, functionalHeapSort } from '../sorting/heap-sort';

/**
 * Runs benchmarks on all sorting algorithms using a random array
 *
 * @param size - Size of the array to test
 * @returns Formatted benchmark results
 *
 * @example
 * ```typescript
 * console.log(runSortingBenchmark(10000));
 * ```
 */
export function runSortingBenchmark(size: number = 10000): string {
  const array = generateRandomArray(size);

  const results = compareBenchmarks(
    {
      quickSort: () => quickSort([...array]),
      mergeSort: () => mergeSort([...array]),
      heapSort: () => heapSort([...array]),
      functionalQuickSort: () => functionalQuickSort([...array]),
      functionalHeapSort: () => functionalHeapSort([...array]),
      bottomUpMergeSort: () => bottomUpMergeSort([...array]),
      'Array.sort': () => [...array].sort((a, b) => a - b),
    },
    size,
    { iterations: 10 },
  );

  return formatBenchmarkResults(results);
}

/**
 * Runs benchmarks on sorting algorithms with different array types
 *
 * @param size - Size of the arrays to test
 * @returns Object with results for each array type
 *
 * @example
 * ```typescript
 * const benchmark = runSortingBenchmarkSuite(10000);
 * console.log(benchmark.random);
 * console.log(benchmark.sorted);
 * console.log(benchmark.reversed);
 * ```
 */
export function runSortingBenchmarkSuite(size: number = 10000): {
  random: string;
  sorted: string;
  reversed: string;
} {
  // Generate different array types
  const randomArray = generateRandomArray(size);
  const sortedArray = generateSortedArray(size);
  const reversedArray = generateReverseSortedArray(size);

  // Benchmark each array type
  const randomResults = compareBenchmarks(
    {
      quickSort: () => quickSort([...randomArray]),
      mergeSort: () => mergeSort([...randomArray]),
      heapSort: () => heapSort([...randomArray]),
    },
    size,
    { iterations: 10 },
  );

  const sortedResults = compareBenchmarks(
    {
      quickSort: () => quickSort([...sortedArray]),
      mergeSort: () => mergeSort([...sortedArray]),
      heapSort: () => heapSort([...sortedArray]),
    },
    size,
    { iterations: 10 },
  );

  const reversedResults = compareBenchmarks(
    {
      quickSort: () => quickSort([...reversedArray]),
      mergeSort: () => mergeSort([...reversedArray]),
      heapSort: () => heapSort([...reversedArray]),
    },
    size,
    { iterations: 10 },
  );

  return {
    random: formatBenchmarkResults(randomResults),
    sorted: formatBenchmarkResults(sortedResults),
    reversed: formatBenchmarkResults(reversedResults),
  };
}

/**
 * Measures how algorithm performance scales with input size
 *
 * @param algorithm - The sorting algorithm to benchmark
 * @param maxSize - Maximum array size to test
 * @param steps - Number of size increments to test
 * @returns Array of benchmark results for different sizes
 *
 * @example
 * ```typescript
 * const scalabilityResults = measureSortingScalability(quickSort);
 * ```
 */
export function measureSortingScalability<T>(
  algorithm: (items: readonly number[]) => number[],
  maxSize: number = 100000,
  steps: number = 5,
): Array<{ size: number; timeMs: number }> {
  const results: Array<{ size: number; timeMs: number }> = [];

  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((maxSize / steps) * step);
    const array = generateRandomArray(size);

    const result = benchmark(() => algorithm([...array]), 'algorithm', size, {
      iterations: Math.max(1, Math.floor(1000 / size)),
    });

    results.push({
      size,
      timeMs: result.timeMs,
    });
  }

  return results;
}
