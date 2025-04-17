/**
 * Reduct Benchmarking Example
 *
 * This example demonstrates how to use the benchmarking utilities
 * to measure and compare performance of data structures and algorithms.
 *
 * @packageDocumentation
 */

import {
  runListBenchmarks,
  formatBenchmarkSuite,
  benchmark,
  compareBenchmarks,
  formatBenchmarkResults
} from '@reduct/benchmark';

// Example 1: Run and format List benchmarks
console.log('Example 1: List Benchmarks');
const listBenchmarks = runListBenchmarks(1000);
console.log(formatBenchmarkSuite(listBenchmarks));

// Example 2: Compare List with native JavaScript arrays using CLI
console.log('Example 2: Comparing List with Native Array');
console.log('To compare List with native Array, use the CLI:');
console.log('npx reduct-benchmark adapter-compare reduct-list native-array -s 1000');

// Example 3: Run detailed benchmark for a specific data structure
console.log('Example 3: Detailed List Benchmarks');
const detailedListBenchmarks = runListBenchmarks(10000);
console.log(formatBenchmarkSuite(detailedListBenchmarks));

// Example 4: Using the benchmark functionality
console.log('Example 4: Custom Benchmark Examples');

// Demonstration of how to use the benchmark and compareBenchmarks functions
// Using simple array operations as an example
const simpleArrayOps = {
  map: () => Array(1000).fill(1).map(x => x * 2),
  filter: () => Array(1000).fill(1).filter(x => x > 0),
  reduce: () => Array(1000).fill(1).reduce((a, b) => a + b, 0)
};

// Run the benchmarks
const benchmarkResults = compareBenchmarks(simpleArrayOps, 'array-ops', 1000);

// Format and display the results
console.log(formatBenchmarkResults(benchmarkResults));

// Example 5: Individual benchmark
console.log('\nExample 5: Individual Benchmark');
const singleResult = benchmark(
  () => Array(10000).sort((a, b) => a - b),
  'Array.sort',
  'sort',
  10000
);
console.log(`Operation: ${singleResult.name}`);
console.log(`Time: ${singleResult.timeMs.toFixed(4)} ms`);
console.log(`Operations per second: ${Math.floor(singleResult.opsPerSecond)}`);
console.log(`Input size: ${singleResult.inputSize}`);
