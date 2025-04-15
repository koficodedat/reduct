/**
 * Basic benchmark example
 * 
 * This example demonstrates how to use the benchmark package to run
 * simple performance tests.
 */

import { 
  runListBenchmarks, 
  compareListWithNativeArray,
  formatBenchmarkSuite 
} from '@reduct/benchmark';

// Run list benchmarks with a small size
console.log('Running List benchmarks...');
const listBenchmarks = runListBenchmarks(100);
console.log(formatBenchmarkSuite(listBenchmarks));

// Compare List with native array
console.log('Comparing List with native array...');
console.log(compareListWithNativeArray(100));
