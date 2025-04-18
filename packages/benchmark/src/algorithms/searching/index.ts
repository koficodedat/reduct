/**
 * Searching algorithm benchmarks
 *
 * @packageDocumentation
 */

// TODO: Import searching algorithms when they're implemented
// import {
//   linearSearch,
//   binarySearch
// } from '@reduct/algorithms';

/**
 * Temporary searching algorithm implementations for benchmarking
 */

// Linear search implementation
export function linearSearch(arr: readonly number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

// Binary search implementation
export function binarySearch(arr: readonly number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    }

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import { benchmark, generateSortedArray } from '../../utils';

/**
 * Runs benchmarks on all searching algorithms
 *
 * @param size - Size of the array to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function runSearchingBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  // Create a sorted array for testing
  const array = generateSortedArray(size);

  // Generate random values to search for
  const valuesToFind = [
    -1, // Not in array
    0, // First element
    Math.floor(size / 2), // Middle element
    size - 1, // Last element
    size + 1, // Not in array
  ];

  const results: Record<string, BenchmarkResult> = {};

  // Benchmark each searching algorithm
  results['linearSearch'] = benchmark(
    () => {
      for (const value of valuesToFind) {
        linearSearch(array, value);
      }
    },
    'linearSearch',
    'search',
    size,
    options,
  );

  results['binarySearch'] = benchmark(
    () => {
      for (const value of valuesToFind) {
        binarySearch(array, value);
      }
    },
    'binarySearch',
    'search',
    size,
    options,
  );

  // Additional search algorithms can be added here when implemented

  return {
    name: 'Searching Algorithm Benchmarks',
    description: 'Performance benchmarks for various searching algorithms',
    benchmarks: Object.values(results),
  };
}

/**
 * Measures how searching algorithm performance scales with input size
 *
 * @param algorithm - The searching algorithm to benchmark
 * @param maxSize - Maximum array size to test
 * @param steps - Number of size increments to test
 * @param options - Benchmark options
 * @returns Scalability results
 */
export function measureSearchingScalability(
  algorithm: (items: readonly number[], target: number) => number,
  algorithmName: string,
  maxSize: number = 1000000,
  steps: number = 5,
  options: BenchmarkOptions = {},
): ScalabilityResult {
  const results: ScalabilityResult['results'] = [];

  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((maxSize / steps) * step);
    const array = generateSortedArray(size);

    // Generate values to search for
    const valuesToFind = [
      -1, // Not in array
      0, // First element
      Math.floor(size / 2), // Middle element
      size - 1, // Last element
      size + 1, // Not in array
    ];

    const result = benchmark(
      () => {
        for (const value of valuesToFind) {
          algorithm(array, value);
        }
      },
      algorithmName,
      'search',
      size,
      options,
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
    operation: 'search',
    results,
  };
}
