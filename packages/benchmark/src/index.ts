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
export * from './analysis';
export * from './benchmark-registry/main';
export * from './ci';
// Export from comparison but avoid name conflicts
export {
  ComparisonBuilder,
  runComplexComparison,
  formatComplexComparisonResult,
  registerCapability,
  getCapability,
  getAllCapabilities,
  hasCapability,
  getImplementationCapabilities
} from './comparison';
export * from './adapters';

// Explicit re-exports for examples compatibility
export { runListBenchmarks, measureListScalability } from './data-structures/list';
export { runMapBenchmarks, measureMapScalability } from './data-structures/map';
export { runStackBenchmarks, measureStackScalability } from './data-structures/stack';
export { runSortingBenchmarks, runSortingBenchmarkSuite, measureSortingScalability } from './algorithms/sorting';
export { runSearchingBenchmarks, measureSearchingScalability } from './algorithms/searching';
export { formatBenchmarkSuite } from './visualization/formatters';
export { formatBenchmarkResults, compareBenchmarks, benchmark } from './utils';
