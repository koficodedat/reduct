/**
 * Adapter-based comparison for Map data structure
 * 
 * @packageDocumentation
 */

import { BenchmarkOptions, BenchmarkComparison } from '../../types';
import { compareImplementationsWithAdapters } from '../../comparison/adapter-based';
import { formatBenchmarkComparison } from '../../visualization/formatters';

/**
 * Compares the Map implementation with native JavaScript Map and plain objects using the adapter system
 * 
 * @param size - Size of the data structures to test
 * @param options - Benchmark options
 * @returns Formatted benchmark results
 */
export function compareMapWithNativeMapAdapter(
  size: number = 10000,
  options: BenchmarkOptions = {},
): string {
  // Define the implementations to compare
  const implementationIds = ['reduct-map', 'native-map', 'plain-object'];
  
  // Define the operations to compare
  const operations = ['get', 'has', 'set', 'delete'];
  
  // Run the comparison
  const comparisons = compareImplementationsWithAdapters(
    implementationIds,
    {
      size,
      operations,
      ...options,
    }
  );
  
  // Format the results
  return comparisons.map(comparison => formatBenchmarkComparison(comparison)).join('\n\n');
}

/**
 * Gets the benchmark comparisons for Map vs Native Map vs Object without formatting
 * 
 * @param size - Size of the data structures to test
 * @param options - Benchmark options
 * @returns Array of benchmark comparisons
 */
export function getMapComparisons(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkComparison[] {
  // Define the implementations to compare
  const implementationIds = ['reduct-map', 'native-map', 'plain-object'];
  
  // Define the operations to compare
  const operations = ['get', 'has', 'set', 'delete'];
  
  // Run the comparison
  return compareImplementationsWithAdapters(
    implementationIds,
    {
      size,
      operations,
      ...options,
    }
  );
}
