/**
 * List data structure benchmarks
 *
 * @packageDocumentation
 */

import { List } from '@reduct/data-structures';
import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import { benchmark, generateRandomArray } from '../../utils';
import { compareListWithNativeArrayAdapter } from './adapter-comparison';

/**
 * Runs benchmarks for the immutable List data structure
 *
 * @param size - Size of the list to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function runListBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const results: BenchmarkResult[] = [];

  // Create arrays for testing
  const array = generateRandomArray(size);
  const smallArray = generateRandomArray(10);

  // Create a list for testing
  const list = List.from(array);
  const smallList = List.from(smallArray);

  // Construction benchmark
  results.push(
    benchmark(() => List.from(array), 'List', 'construction', size, options),
  );

  // Access benchmark
  results.push(
    benchmark(
      () => {
        for (let i = 0; i < 100; i++) {
          const index = Math.floor(Math.random() * size);
          list.get(index);
        }
      },
      'List',
      'get(random)',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Map benchmark
  results.push(
    benchmark(() => list.map(x => x * 2), 'List', 'map', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  // Filter benchmark
  results.push(
    benchmark(() => list.filter(x => x % 2 === 0), 'List', 'filter', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  // Reduce benchmark
  results.push(
    benchmark(() => list.reduce((sum, x) => sum + x, 0), 'List', 'reduce', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  // Append benchmark
  results.push(
    benchmark(
      () => {
        let result = smallList;
        for (let i = 0; i < 100; i++) {
          result = result.append(i);
        }
      },
      'List',
      'append(100x)',
      smallArray.length,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Prepend benchmark
  results.push(
    benchmark(
      () => {
        let result = smallList;
        for (let i = 0; i < 100; i++) {
          result = result.prepend(i);
        }
      },
      'List',
      'prepend(100x)',
      smallArray.length,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Concat benchmark
  results.push(
    benchmark(() => list.concat(smallList), 'List', 'concat', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  return {
    name: 'List Benchmarks',
    description: 'Performance benchmarks for the immutable List data structure',
    benchmarks: results,
  };
}

/**
 * Compares the List implementation with native JavaScript arrays
 *
 * @param size - Size of the data structures to test
 * @param options - Benchmark options
 * @returns Formatted benchmark results
 */
export function compareListWithNativeArray(
  size: number = 10000,
  options: BenchmarkOptions = {},
): string {
  // Use the adapter-based implementation
  return compareListWithNativeArrayAdapter(size, options);
}

/**
 * Measures how List operations scale with input size
 *
 * @param operation - The operation to test
 * @param maxSize - Maximum list size to test
 * @param steps - Number of size increments to test
 * @param options - Benchmark options
 * @returns Scalability results
 */
export function measureListScalability(
  operation: 'map' | 'filter' | 'reduce' | 'get' | 'append' | 'prepend',
  maxSize: number = 100000,
  steps: number = 5,
  options: BenchmarkOptions = {},
): ScalabilityResult {
  const results: ScalabilityResult['results'] = [];

  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((maxSize / steps) * step);
    const array = generateRandomArray(size);
    const list = List.from(array);

    let result: BenchmarkResult;

    switch (operation) {
      case 'map':
        result = benchmark(() => list.map(x => x * 2), 'List', 'map', size, {
          ...options,
          iterations: Math.min(options.iterations || 100, 10),
        });
        break;
      case 'filter':
        result = benchmark(() => list.filter(x => x % 2 === 0), 'List', 'filter', size, {
          ...options,
          iterations: Math.min(options.iterations || 100, 10),
        });
        break;
      case 'reduce':
        result = benchmark(() => list.reduce((sum, x) => sum + x, 0), 'List', 'reduce', size, {
          ...options,
          iterations: Math.min(options.iterations || 100, 10),
        });
        break;
      case 'get':
        const randomIndices = Array.from({ length: 100 }, () => Math.floor(Math.random() * size));
        result = benchmark(
          () => {
            for (const index of randomIndices) {
              list.get(index);
            }
          },
          'List',
          'get(100x)',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      case 'append':
        result = benchmark(() => list.append(999), 'List', 'append', size, options);
        break;
      case 'prepend':
        result = benchmark(() => list.prepend(999), 'List', 'prepend', size, options);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    results.push({
      inputSize: size,
      timeMs: result.timeMs,
      opsPerSecond: result.opsPerSecond,
      memoryBytes: result.memoryBytes,
    });
  }

  return {
    implementation: 'List',
    operation,
    results,
  };
}
