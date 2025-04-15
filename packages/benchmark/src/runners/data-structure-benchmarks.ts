/**
 * Data structure benchmarks
 *
 * Provides consolidated benchmarks for all data structures.
 *
 * @packageDocumentation
 */

import { BenchmarkOptions, BenchmarkSuite } from '../types';
import { formatBenchmarkSuite } from '../visualization/formatters';
import { runListBenchmarks, compareListWithNativeArray } from './list-benchmarks';
import { runMapBenchmarks, compareMapWithNativeMap } from './map-benchmarks';
import { runStackBenchmarks, compareStackWithNativeArray } from './stack-benchmarks';

/**
 * Runs benchmarks for all data structures
 *
 * @param size - Size of data structures to test
 * @param options - Benchmark options
 * @returns Object with benchmark suites for each data structure
 */
export function runAllDataStructureBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): {
  list: BenchmarkSuite;
  map: BenchmarkSuite;
  stack: BenchmarkSuite;
} {
  return {
    list: runListBenchmarks(size, options),
    map: runMapBenchmarks(size, options),
    stack: runStackBenchmarks(size, options),
  };
}

/**
 * Formats the results of all data structure benchmarks
 *
 * @param size - Size of data structures to test
 * @param options - Benchmark options
 * @returns Formatted benchmark results
 */
export function formatAllDataStructureBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): string {
  const results = runAllDataStructureBenchmarks(size, options);
  
  let output = '# Data Structure Benchmark Results\n';
  output += `\nInput size: ${size.toLocaleString()} elements\n\n`;
  
  output += formatBenchmarkSuite(results.list);
  output += formatBenchmarkSuite(results.stack);
  output += formatBenchmarkSuite(results.map);
  
  return output;
}

/**
 * Compares all immutable data structures against native JavaScript equivalents
 *
 * @param size - Size of data structures to test
 * @param options - Benchmark options
 * @returns Formatted benchmark results
 */
export function compareAllWithNativeStructures(
  size: number = 10000,
  options: BenchmarkOptions = {},
): string {
  let output = '# Immutable vs. Native Data Structure Comparison\n\n';
  output += `Input size: ${size.toLocaleString()} elements\n\n`;
  
  output += '## List vs. Array\n\n';
  output += compareListWithNativeArray(size, options);
  
  output += '\n## Stack vs. Array\n\n';
  output += compareStackWithNativeArray(size, options);
  
  output += '\n## Map vs. Native Map and Object\n\n';
  output += compareMapWithNativeMap(size, options);
  
  return output;
}
