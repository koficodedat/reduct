/**
 * Benchmark runners
 * 
 * Provides utilities for running benchmarks programmatically.
 * 
 * @packageDocumentation
 */

// Re-export from data structures
export { runListBenchmarks, compareListWithNativeArray, measureListScalability } from '../data-structures/list';
export { runMapBenchmarks, compareMapWithNativeMap, measureMapScalability } from '../data-structures/map';
export { runStackBenchmarks, compareStackWithNativeArray, measureStackScalability } from '../data-structures/stack';

// Re-export from algorithms
export { runSortingBenchmarks, runSortingBenchmarkSuite, measureSortingScalability } from '../algorithms/sorting';
export { runSearchingBenchmarks, measureSearchingScalability } from '../algorithms/searching';
