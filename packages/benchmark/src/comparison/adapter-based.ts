/**
 * Adapter-based comparison engine
 *
 * Provides utilities for comparing different implementations
 * using the operation adapter system.
 *
 * @packageDocumentation
 */

import {
  getAdapter,
  findCommonAdapterOperations,
} from '../adapters';
import { getImplementation } from '../registry';
import { BenchmarkOptions, BenchmarkComparison } from '../types';
import { benchmark } from '../utils';
import { ProgressIndicator, ProgressIndicatorType } from '../visualization/progress';

/**
 * Options for comparing implementations using adapters
 */
export interface AdapterComparisonOptions extends BenchmarkOptions {
  /** Size of the data structure or input size for algorithm */
  size: number;
  /** Operations to compare (if not specified, all common operations will be compared) */
  operations?: string[];
  /** Minimum compatibility score (0-1) */
  minCompatibilityScore?: number;
  /** Whether to show progress indicators */
  showProgress?: boolean;
  /** Type of progress indicator to use */
  progressIndicatorType?: ProgressIndicatorType;
}

/**
 * Compares multiple implementations using adapters
 *
 * @param ids - Implementation IDs to compare
 * @param options - Comparison options
 * @returns Array of benchmark comparisons, one for each operation
 */
export function compareImplementationsWithAdapters(
  ids: string[],
  options: AdapterComparisonOptions
): BenchmarkComparison[] {
  const {
    size,
    operations: specifiedOps,
    minCompatibilityScore = 0.5,
    showProgress = true,
    progressIndicatorType = ProgressIndicatorType.BAR,
    ...benchmarkOptions
  } = options;

  // Get adapters
  const adapters = ids.map(id => {
    const adapter = getAdapter(id);
    if (!adapter) {
      throw new Error(`Adapter for implementation '${id}' not found`);
    }
    return adapter;
  });

  // Find common operations if not specified
  const commonOperations = findCommonAdapterOperations(ids);

  // Filter operations by minimum compatibility score
  const compatibleOperations = Array.from(commonOperations.entries())
    .filter(([_, score]) => score >= minCompatibilityScore)
    .map(([name]) => name);

  // Use specified operations if provided, otherwise use compatible operations
  const operations = specifiedOps || compatibleOperations;

  if (operations.length === 0) {
    throw new Error('No compatible operations found between the specified implementations');
  }

  // Create instances using the registry
  const instances = ids.map(id => {
    const implementation = getImplementation(id);
    if (!implementation) {
      throw new Error(`Implementation with ID '${id}' not found`);
    }
    try {
      console.log(`Creating instance for ${id}`);
      const instance = implementation.create(size);
      console.log(`Instance created for ${id}:`, instance);
      return instance;
    } catch (error) {
      console.error(`Error creating instance for ${id}:`, error);
      throw error;
    }
  });

  // Create progress indicator for operations
  const operationsProgress = showProgress ?
    new ProgressIndicator(operations.length, 'Running benchmarks', {
      type: progressIndicatorType,
      showPercentage: true,
      showElapsedTime: true,
      showEta: true
    }) : null;

  if (operationsProgress) {
    operationsProgress.start();
  }

  // Run benchmarks for each operation
  const results = operations.map((operation, opIndex) => {
    const results = adapters.map((adapter, index) => {
      const instance = instances[index];
      const op = adapter.operations[operation];

      if (!op) {
        throw new Error(`Operation '${operation}' not found in adapter for '${adapter.implementationId}'`);
      }

      console.log(`Benchmarking ${adapter.implementationId}.${operation}`);
      console.log(`Instance:`, instance);

      // Create benchmark function
      const benchmarkFn = () => {
        try {
          // If the adapter has a createBenchmarkArgs function for this operation, use it
          const args = op.createBenchmarkArgs
            ? op.createBenchmarkArgs(instance, size)
            : [];

          console.log(`Args for ${adapter.implementationId}.${operation}:`, args);

          // Execute the operation
          // Special handling for algorithms
          if (typeof instance === 'function') {
            if (operation === 'sort') {
              // For sorting algorithms, we need to provide an array to sort
              const arr = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
              return op.execute(instance, arr);
            } else if (operation === 'search') {
              // For searching algorithms, we need to provide an array and a value to search for
              const arr = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000)).sort((a, b) => a - b);
              const value = arr[Math.floor(Math.random() * arr.length)];
              return op.execute(instance, arr, value);
            }
          }

          // Default case: use the provided args
          const result = op.execute(instance, ...args);
          return result;
        } catch (error) {
          console.error(`Error executing ${adapter.implementationId}.${operation}:`, error);
          throw error;
        }
      };

      // Run the benchmark
      return benchmark(
        benchmarkFn,
        adapter.implementationId,
        operation,
        size,
        benchmarkOptions
      );
    });

    // Find the fastest implementation
    const fastestTime = Math.min(...results.map(r => r.timeMs));

    // Calculate relative factors
    const comparisonResults = results.map(result => ({
      implementation: result.name,
      timeMs: result.timeMs,
      opsPerSecond: result.opsPerSecond,
      memoryBytes: result.memoryBytes,
      relativeFactor: result.timeMs / fastestTime
    }));

    // Update progress indicator
    if (operationsProgress) {
      operationsProgress.update(opIndex + 1, `Completed ${operation} operation`);
    }

    return {
      name: `${operation} Operation Comparison`,
      description: `Comparing ${operation} across different implementations`,
      operation,
      inputSize: size,
      results: comparisonResults
    };
  });

  // Complete progress indicator
  if (operationsProgress) {
    operationsProgress.complete('All benchmarks completed');
  }

  return results;
}
