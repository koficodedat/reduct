/**
 * Reduct Benchmarking Infrastructure
 *
 * Provides tools for measuring and comparing performance of data structures and algorithms.
 *
 * @packageDocumentation
 */

// Re-export from modules
export * from './visualization';
export * from './types';
export * from './utils';
export * from './complexity';
export * from './cli';
export * from './registry';
export * from './comparison';
export * from './adapters';

// Explicit re-exports for examples compatibility
export { runListBenchmarks, compareListWithNativeArray, measureListScalability } from './data-structures/list';
export { runMapBenchmarks, compareMapWithNativeMap, measureMapScalability } from './data-structures/map';
export { runStackBenchmarks, compareStackWithNativeArray, measureStackScalability } from './data-structures/stack';
export { runSortingBenchmarks, runSortingBenchmarkSuite, measureSortingScalability } from './algorithms/sorting';
export { runSearchingBenchmarks, measureSearchingScalability } from './algorithms/searching';
export { formatBenchmarkSuite } from './visualization/formatters';
export { formatBenchmarkResults, compareBenchmarks, benchmark } from './utils';
