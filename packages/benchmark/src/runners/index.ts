/**
 * Benchmark runners
 *
 * Provides utilities for running benchmarks programmatically.
 *
 * @packageDocumentation
 */

// Re-export from data structures
export {
  runListBenchmarks,
  measureListScalability,
  runEnhancedListBenchmarks,
  measureEnhancedListScalability,
  compareStandardVsFusedOperations,
  compareStandardVsSpecializedLists
} from '../data-structures/list';
export { runMapBenchmarks, measureMapScalability } from '../data-structures/map';
export { runStackBenchmarks, measureStackScalability } from '../data-structures/stack';

// Re-export from algorithms
export { runSortingBenchmarks, runSortingBenchmarkSuite, measureSortingScalability } from '../algorithms/sorting';
export { runSearchingBenchmarks, measureSearchingScalability } from '../algorithms/searching';
