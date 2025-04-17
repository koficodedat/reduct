/**
 * Flexible comparison engine
 *
 * Provides utilities for comparing different implementations
 * of data structures and algorithms.
 *
 * @packageDocumentation
 */

import { BenchmarkOptions, BenchmarkComparison } from '../types';
import { benchmark } from '../utils';
import {
  getImplementation,
  findCommonOperations,
  Implementation
} from '../registry';
import { generateRandomArray } from '../utils';

// Export adapter-based comparison
export * from './adapter-based';

/**
 * Options for comparing implementations
 */
export interface ComparisonOptions extends BenchmarkOptions {
  /** Size of the data structure or input size for algorithm */
  size: number;
  /** Operations to compare (if not specified, all common operations will be compared) */
  operations?: string[];
}

/**
 * Compares multiple implementations
 *
 * @param ids - Implementation IDs to compare
 * @param options - Comparison options
 * @returns Array of benchmark comparisons, one for each operation
 */
export function compareImplementations(
  ids: string[],
  options: ComparisonOptions
): BenchmarkComparison[] {
  const { size, operations: specifiedOps, ...benchmarkOptions } = options;

  // Get implementations
  const implementations = ids.map(id => {
    const impl = getImplementation(id);
    if (!impl) {
      throw new Error(`Implementation with ID '${id}' not found`);
    }
    return impl;
  });

  // Find common operations if not specified
  const operations = specifiedOps || findCommonOperations(ids);

  if (operations.length === 0) {
    throw new Error('No common operations found between the specified implementations');
  }

  // Create instances
  const instances = implementations.map(impl => impl.create(size));

  // Run benchmarks for each operation
  return operations.map(operation => {
    const results = implementations.map((impl, index) => {
      const instance = instances[index];

      // Create appropriate benchmark function based on operation
      const benchmarkFn = createBenchmarkFunction(operation, impl, instance);

      // Run the benchmark
      return benchmark(
        benchmarkFn,
        impl.name,
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

    return {
      name: `${operation} Operation Comparison`,
      description: `Comparing ${operation} across different implementations`,
      operation,
      inputSize: size,
      results: comparisonResults
    };
  });
}

/**
 * Creates a benchmark function for a specific operation
 *
 * @param operation - Operation name
 * @param implementation - Implementation
 * @param instance - Instance of the implementation
 * @returns Benchmark function
 */
function createBenchmarkFunction(
  operation: string,
  implementation: Implementation<any>,
  instance: any
): () => any {
  const opFn = implementation.operations[operation];

  // Handle different operation types based on naming conventions
  if (operation === 'get' || operation === 'has' || operation.startsWith('search')) {
    // For get/has/search operations, test with random indices/keys/values
    if (implementation.category === 'data-structure') {
      if (implementation.type === 'list' || implementation.type === 'stack') {
        // For list/stack, use random indices
        const size = typeof instance.size === 'function' ? instance.size() : instance.size;
        const randomIndices = Array.from(
          { length: 100 },
          () => Math.floor(Math.random() * size)
        );
        return () => {
          for (const idx of randomIndices) {
            opFn(instance, idx);
          }
        };
      } else if (implementation.type === 'map') {
        // For map, use random keys
        const size = typeof instance.size === 'function' ? instance.size() : instance.size;
        const keys = Array.from(
          { length: 100 },
          (_: any) => `key${Math.floor(Math.random() * size)}`
        );
        return () => {
          for (const key of keys) {
            opFn(instance, key);
          }
        };
      }
    } else if (implementation.category === 'algorithm') {
      if (implementation.type === 'searching') {
        // For searching algorithms, search for random values
        const arr = generateRandomArray(1000);
        const values = Array.from(
          { length: 100 },
          () => arr[Math.floor(Math.random() * arr.length)]
        );
        return () => {
          for (const value of values) {
            opFn(instance, arr, value);
          }
        };
      }
    }
  } else if (operation === 'map') {
    return () => opFn(instance, (x: any) => x * 2);
  } else if (operation === 'filter') {
    return () => opFn(instance, (x: any) => x % 2 === 0);
  } else if (operation === 'reduce') {
    return () => opFn(instance, (acc: any, x: any) => acc + x, 0);
  } else if (operation === 'sort' || operation.startsWith('sort')) {
    // For sorting algorithms
    const arr = generateRandomArray(1000);
    return () => opFn(instance, [...arr]);
  } else if (operation === 'append' || operation === 'prepend' || operation === 'push') {
    // For append/prepend/push operations, test with a single value
    return () => opFn(instance, 999);
  } else if (operation === 'set') {
    // For set operations, test with a random key and value
    return () => opFn(instance, `newKey${Math.random()}`, 999);
  } else if (operation === 'delete' || operation === 'pop') {
    // For delete/pop operations, just call the function
    return () => opFn(instance);
  }

  // Default: just call the function
  return () => opFn(instance);
}
