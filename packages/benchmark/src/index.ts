/**
 * Reduct Benchmarking Infrastructure
 *
 * Provides tools for measuring and comparing performance of data structures and algorithms.
 *
 * @packageDocumentation
 */

// Import algorithm benchmarks
import { runSearchingBenchmarks, measureSearchingScalability } from './algorithms/searching';
import { runSortingBenchmarks, runSortingBenchmarkSuite, measureSortingScalability } from './algorithms/sorting';

// Import data structure benchmarks
import { runMapBenchmarks, measureMapScalability } from './data-structures/map';
import { runStackBenchmarks, measureStackScalability } from './data-structures/stack';
import {
  runListBenchmarks,
  measureListScalability,
  runEnhancedListBenchmarks,
  measureEnhancedListScalability,
  compareStandardVsFusedOperations,
  compareStandardVsSpecializedLists
} from './data-structures/list';

// Import formatters and utilities
import { formatBenchmarkResults, compareBenchmarks, benchmark } from './utils';
import { formatBenchmarkSuite } from './visualization/formatters';

// Import modules
import * as _Adapters from './adapters'; // Used in exports
import * as Analysis from './analysis';
import * as BenchmarkRegistry from './benchmark-registry/main';
import * as CI from './ci';
import * as CLI from './cli';
import * as Complexity from './complexity';
import * as Registry from './registry';
import * as Types from './types';
import * as Utils from './utils';
import * as Visualization from './visualization';

// Re-export modules
export {
  Visualization,
  Types,
  Utils,
  Complexity,
  CLI,
  Registry,
  Analysis,
  BenchmarkRegistry,
  CI,
  _Adapters as Adapters // Re-export with original name
};
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

// Explicit re-exports for examples compatibility
export {
  // Data structure benchmarks
  runListBenchmarks,
  measureListScalability,
  runEnhancedListBenchmarks,
  measureEnhancedListScalability,
  compareStandardVsFusedOperations,
  compareStandardVsSpecializedLists,
  runMapBenchmarks,
  measureMapScalability,
  runStackBenchmarks,
  measureStackScalability,

  // Algorithm benchmarks
  runSortingBenchmarks,
  runSortingBenchmarkSuite,
  measureSortingScalability,
  runSearchingBenchmarks,
  measureSearchingScalability,

  // Formatters and utilities
  formatBenchmarkSuite,
  formatBenchmarkResults,
  compareBenchmarks,
  benchmark
};
