/**
 * Stack benchmark example
 * 
 * This example demonstrates how to use the benchmark package to run
 * performance tests on the Stack data structure.
 */

import { 
  runStackBenchmarks, 
  compareStackWithNativeArray,
  formatBenchmarkSuite 
} from '@reduct/benchmark';

// Run stack benchmarks with a small size
console.log('Running Stack benchmarks...');
const stackBenchmarks = runStackBenchmarks(100);
console.log(formatBenchmarkSuite(stackBenchmarks));

// Compare Stack with native array
console.log('Comparing Stack with native array...');
console.log(compareStackWithNativeArray(100));
