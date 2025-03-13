/**
 * Reduct Benchmarking Example
 *
 * This example demonstrates how to use the benchmarking utilities
 * to measure and compare performance of data structures and algorithms.
 */

import {
  runAllDataStructureBenchmarks,
  compareWithNativeStructures,
  runListBenchmarks,
  runStackBenchmarks,
  runMapBenchmarks,
} from '@reduct/data-structures';

import { runSortingBenchmark, runSortingBenchmarkSuite } from '@reduct/algorithms';

// Example 1: Run benchmarks for all data structures with a small size
console.log('Example 1: Basic Data Structure Benchmarks');
console.log(runAllDataStructureBenchmarks(1000));

// Example 2: Compare immutable data structures with native JavaScript equivalents
console.log('Example 2: Comparing with Native JavaScript');
console.log(compareWithNativeStructures(5000));

// Example 3: Run detailed benchmark for a specific data structure
console.log('Example 3: Detailed List Benchmarks');
console.log(runListBenchmarks(10000));

// Example 4: Run sorting algorithm benchmarks
console.log('Example 4: Sorting Algorithm Benchmarks');
console.log(runSortingBenchmark(1000));

// Example 5: Benchmark sorting algorithms with different input types
console.log('Example 5: Sorting Algorithm Suite');
const sortingSuite = runSortingBenchmarkSuite(1000);
console.log('Random Array:');
console.log(sortingSuite.random);
console.log('Sorted Array:');
console.log(sortingSuite.sorted);
console.log('Reversed Array:');
console.log(sortingSuite.reversed);
