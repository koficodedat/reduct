/**
 * Sorting algorithm benchmarks
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
import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import {
  benchmark,
  generateRandomArray,
  generateSortedArray,
  generateReverseSortedArray,
  generatePartiallySortedArray,
} from '../../utils';

/**
 * Runs benchmarks on all sorting algorithms using a random array
 *
 * @param size - Size of the array to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function runSortingBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const array = generateRandomArray(size);

  const results: Record<string, BenchmarkResult> = {};

  // Benchmark each sorting algorithm
  results['quickSort'] = benchmark(
    () => quickSort([...array]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['mergeSort'] = benchmark(
    () => mergeSort([...array]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['heapSort'] = benchmark(
    () => heapSort([...array]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['functionalQuickSort'] = benchmark(
    () => functionalQuickSort([...array]),
    'functionalQuickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['functionalHeapSort'] = benchmark(
    () => functionalHeapSort([...array]),
    'functionalHeapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['bottomUpMergeSort'] = benchmark(
    () => bottomUpMergeSort([...array]),
    'bottomUpMergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Array.sort'] = benchmark(
    () => [...array].sort((a, b) => a - b),
    'Array.sort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  return {
    name: 'Sorting Algorithm Benchmarks',
    description: 'Performance benchmarks for various sorting algorithms',
    benchmarks: Object.values(results),
  };
}

/**
 * Runs benchmarks on sorting algorithms with different array types
 *
 * @param size - Size of the arrays to test
 * @param options - Benchmark options
 * @returns Object with results for each array type
 */
export function runSortingBenchmarkSuite(
  size: number = 10000,
  options: BenchmarkOptions = {},
): {
  random: BenchmarkSuite;
  sorted: BenchmarkSuite;
  reversed: BenchmarkSuite;
  partiallySorted: BenchmarkSuite;
} {
  // Generate different array types
  const randomArray = generateRandomArray(size);
  const sortedArray = generateSortedArray(size);
  const reversedArray = generateReverseSortedArray(size);
  const partiallySortedArray = generatePartiallySortedArray(size);

  // Benchmark with random array
  const randomResults: Record<string, BenchmarkResult> = {};
  randomResults['quickSort'] = benchmark(
    () => quickSort([...randomArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  randomResults['mergeSort'] = benchmark(
    () => mergeSort([...randomArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  randomResults['heapSort'] = benchmark(
    () => heapSort([...randomArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Benchmark with sorted array
  const sortedResults: Record<string, BenchmarkResult> = {};
  sortedResults['quickSort'] = benchmark(
    () => quickSort([...sortedArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  sortedResults['mergeSort'] = benchmark(
    () => mergeSort([...sortedArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  sortedResults['heapSort'] = benchmark(
    () => heapSort([...sortedArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Benchmark with reversed array
  const reversedResults: Record<string, BenchmarkResult> = {};
  reversedResults['quickSort'] = benchmark(
    () => quickSort([...reversedArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  reversedResults['mergeSort'] = benchmark(
    () => mergeSort([...reversedArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  reversedResults['heapSort'] = benchmark(
    () => heapSort([...reversedArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Benchmark with partially sorted array
  const partiallySortedResults: Record<string, BenchmarkResult> = {};
  partiallySortedResults['quickSort'] = benchmark(
    () => quickSort([...partiallySortedArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  partiallySortedResults['mergeSort'] = benchmark(
    () => mergeSort([...partiallySortedArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  partiallySortedResults['heapSort'] = benchmark(
    () => heapSort([...partiallySortedArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  return {
    random: {
      name: 'Sorting Benchmarks (Random Array)',
      description: 'Performance benchmarks for sorting algorithms with random data',
      benchmarks: Object.values(randomResults),
    },
    sorted: {
      name: 'Sorting Benchmarks (Sorted Array)',
      description: 'Performance benchmarks for sorting algorithms with already sorted data',
      benchmarks: Object.values(sortedResults),
    },
    reversed: {
      name: 'Sorting Benchmarks (Reversed Array)',
      description: 'Performance benchmarks for sorting algorithms with reverse-sorted data',
      benchmarks: Object.values(reversedResults),
    },
    partiallySorted: {
      name: 'Sorting Benchmarks (Partially Sorted Array)',
      description: 'Performance benchmarks for sorting algorithms with partially sorted data',
      benchmarks: Object.values(partiallySortedResults),
    },
  };
}

/**
 * Measures how sorting algorithm performance scales with input size
 *
 * @param algorithm - The sorting algorithm to benchmark
 * @param maxSize - Maximum array size to test
 * @param steps - Number of size increments to test
 * @param options - Benchmark options
 * @returns Scalability results
 */
export function measureSortingScalability(
  algorithm: (items: readonly number[]) => number[],
  algorithmName: string,
  maxSize: number = 100000,
  steps: number = 5,
  options: BenchmarkOptions = {},
): ScalabilityResult {
  const results: ScalabilityResult['results'] = [];

  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((maxSize / steps) * step);
    const array = generateRandomArray(size);

    const result = benchmark(
      () => algorithm([...array]),
      algorithmName,
      'sort',
      size,
      {
        ...options,
        iterations: Math.max(1, Math.min(options.iterations || 100, Math.floor(1000 / size))),
      },
    );

    results.push({
      inputSize: size,
      timeMs: result.timeMs,
      opsPerSecond: result.opsPerSecond,
      memoryBytes: result.memoryBytes,
    });
  }

  return {
    implementation: algorithmName,
    operation: 'sort',
    results,
  };
}
