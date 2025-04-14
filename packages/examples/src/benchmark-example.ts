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
  // These are unused, so we'll comment them out
  // runStackBenchmarks,
  // runMapBenchmarks,
} from '@reduct/data-structures';

// These functions don't exist in the @reduct/algorithms package
// Let's import the benchmark functions instead
import { benchmark, compareBenchmarks } from '@reduct/algorithms/benchmark';

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
// The runSortingBenchmark function doesn't exist yet
console.log('Note: Sorting benchmarks are not implemented yet');

// Example 5: Using the general benchmark functionality instead
console.log('Example 5: Benchmark Examples');
console.log('Note: Detailed sorting benchmarks are not implemented yet');

// Demonstration of how we could use the benchmark and compareBenchmarks functions
// Using simple array operations as an example
const simpleArrayOps = {
  map: () => Array(1000).fill(1).map(x => x * 2),
  filter: () => Array(1000).fill(1).filter(x => x > 0),
  reduce: () => Array(1000).fill(1).reduce((a, b) => a + b, 0)
};

console.log(compareBenchmarks(simpleArrayOps, 1000));
