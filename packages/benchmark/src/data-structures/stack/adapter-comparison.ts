/**
 * Adapter-based comparison for Stack data structure
 * 
 * @packageDocumentation
 */

import { BenchmarkOptions, BenchmarkComparison } from '../../types';
import { compareImplementationsWithAdapters } from '../../comparison/adapter-based';
import { formatBenchmarkComparison } from '../../visualization/formatters';

/**
 * Compares the Stack implementation with native JavaScript arrays using the adapter system
 * 
 * @param size - Size of the data structures to test
 * @param options - Benchmark options
 * @returns Formatted benchmark results
 */
export function compareStackWithNativeArrayAdapter(
  size: number = 10000,
  options: BenchmarkOptions = {},
): string {
  // Define the implementations to compare
  const implementationIds = ['reduct-stack', 'native-array-stack'];
  
  // Define the operations to compare
  const operations = ['peek', 'push', 'pop', 'map', 'filter'];
  
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
 * Gets the benchmark comparisons for Stack vs Array without formatting
 * 
 * @param size - Size of the data structures to test
 * @param options - Benchmark options
 * @returns Array of benchmark comparisons
 */
export function getStackVsArrayComparisons(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkComparison[] {
  // Define the implementations to compare
  const implementationIds = ['reduct-stack', 'native-array-stack'];
  
  // Define the operations to compare
  const operations = ['peek', 'push', 'pop', 'map', 'filter'];
  
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
