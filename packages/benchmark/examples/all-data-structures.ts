/**
 * All data structures benchmark example
 * 
 * This example demonstrates how to use the benchmark package to run
 * performance tests on all data structures.
 */

import { 
  formatAllDataStructureBenchmarks,
  compareAllWithNativeStructures
} from '@reduct/benchmark';

// Run benchmarks for all data structures with a small size
console.log('Running all data structure benchmarks...');
console.log(formatAllDataStructureBenchmarks(100));

// Compare all data structures with native implementations
console.log('Comparing with native implementations...');
console.log(compareAllWithNativeStructures(100));
