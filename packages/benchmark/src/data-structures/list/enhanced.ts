/**
 * Enhanced List Benchmarks
 *
 * Provides benchmarks for enhanced List implementations.
 *
 * @packageDocumentation
 */

import { List } from '@reduct/data-structures';

import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import { benchmark, generateRandomArray } from '../../utils';

/**
 * Runs benchmarks for enhanced List operations
 *
 * @param size - Size of the list to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function runEnhancedListBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const results: BenchmarkResult[] = [];

  // Create array for testing
  const array = generateRandomArray(size);

  // Create a list for testing
  const list = List.from(array);

  // Standard operations
  results.push(
    benchmark(() => list.map(x => x * 2), 'List', 'map', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  results.push(
    benchmark(() => list.filter(x => x % 2 === 0), 'List', 'filter', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  results.push(
    benchmark(() => list.reduce((sum, x) => sum + x, 0), 'List', 'reduce', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  // Chained operations
  results.push(
    benchmark(
      () => list.map(x => x * 2).filter(x => x % 4 === 0),
      'List',
      'map+filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => list.filter(x => x % 2 === 0).map(x => x * 2),
      'List',
      'filter+map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => list.map(x => x * 2).reduce((sum, x) => sum + x, 0),
      'List',
      'map+reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => list.filter(x => x % 2 === 0).reduce((sum, x) => sum + x, 0),
      'List',
      'filter+reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => list.map(x => x * 2).filter(x => x % 4 === 0).reduce((sum, x) => sum + x, 0),
      'List',
      'map+filter+reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Fused operations (simulated)
  results.push(
    benchmark(
      () => {
        const result: number[] = [];
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined) {
            const mapped = value * 2;
            if (mapped % 4 === 0) {
              result.push(mapped);
            }
          }
        }
        return List.from(result);
      },
      'List',
      'mapFilter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        const result: number[] = [];
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined && value % 2 === 0) {
            result.push(value * 2);
          }
        }
        return List.from(result);
      },
      'List',
      'filterMap',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        let result = 0;
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined) {
            result += value * 2;
          }
        }
        return result;
      },
      'List',
      'mapReduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        let result = 0;
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined && value % 2 === 0) {
            result += value;
          }
        }
        return result;
      },
      'List',
      'filterReduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        let result = 0;
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined) {
            const mapped = value * 2;
            if (mapped % 4 === 0) {
              result += mapped;
            }
          }
        }
        return result;
      },
      'List',
      'mapFilterReduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Specialized operations
  const numberList = List.from(array);
  results.push(
    benchmark(
      () => numberList.reduce((sum, x) => sum + x, 0),
      'List',
      'sum',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        const sum = numberList.reduce((acc, x) => acc + x, 0);
        return sum / numberList.size;
      },
      'List',
      'average',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // String list operations
  const stringArray = Array.from({ length: size }, (_, i) => `item-${i}`);
  const stringList = List.from(stringArray);
  results.push(
    benchmark(
      () => stringList.toArray().join(','),
      'List',
      'join',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Object list operations
  const objectArray = Array.from({ length: size }, (_, i) => ({ id: i, value: `value-${i}` }));
  const objectList = List.from(objectArray);
  results.push(
    benchmark(
      () => objectList.map(obj => obj.id),
      'List',
      'pluck',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  return {
    name: 'Enhanced List Benchmarks',
    description: 'Performance benchmarks for enhanced List operations',
    benchmarks: results,
  };
}

/**
 * Measures how enhanced List operations scale with input size
 *
 * @param operation - The operation to test
 * @param maxSize - Maximum list size to test
 * @param steps - Number of size increments to test
 * @param options - Benchmark options
 * @returns Scalability results
 */
export function measureEnhancedListScalability(
  operation: 'mapFilter' | 'filterMap' | 'mapReduce' | 'filterReduce' | 'mapFilterReduce',
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
      case 'mapFilter':
        result = benchmark(
          () => {
            const result: number[] = [];
            for (let i = 0; i < list.size; i++) {
              const value = list.get(i);
              if (value !== undefined) {
                const mapped = value * 2;
                if (mapped % 4 === 0) {
                  result.push(mapped);
                }
              }
            }
            return List.from(result);
          },
          'List',
          'mapFilter',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      case 'filterMap':
        result = benchmark(
          () => {
            const result: number[] = [];
            for (let i = 0; i < list.size; i++) {
              const value = list.get(i);
              if (value !== undefined && value % 2 === 0) {
                result.push(value * 2);
              }
            }
            return List.from(result);
          },
          'List',
          'filterMap',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      case 'mapReduce':
        result = benchmark(
          () => {
            let result = 0;
            for (let i = 0; i < list.size; i++) {
              const value = list.get(i);
              if (value !== undefined) {
                result += value * 2;
              }
            }
            return result;
          },
          'List',
          'mapReduce',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      case 'filterReduce':
        result = benchmark(
          () => {
            let result = 0;
            for (let i = 0; i < list.size; i++) {
              const value = list.get(i);
              if (value !== undefined && value % 2 === 0) {
                result += value;
              }
            }
            return result;
          },
          'List',
          'filterReduce',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      case 'mapFilterReduce':
        result = benchmark(
          () => {
            let result = 0;
            for (let i = 0; i < list.size; i++) {
              const value = list.get(i);
              if (value !== undefined) {
                const mapped = value * 2;
                if (mapped % 4 === 0) {
                  result += mapped;
                }
              }
            }
            return result;
          },
          'List',
          'mapFilterReduce',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
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

/**
 * Compares standard operations with fused operations
 *
 * @param size - Size of the list to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function compareStandardVsFusedOperations(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const results: BenchmarkResult[] = [];

  // Create array for testing
  const array = generateRandomArray(size);

  // Create a list for testing
  const list = List.from(array);

  // Map-Filter operations
  results.push(
    benchmark(
      () => list.map(x => x * 2).filter(x => x % 4 === 0),
      'Standard',
      'map+filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        const result: number[] = [];
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined) {
            const mapped = value * 2;
            if (mapped % 4 === 0) {
              result.push(mapped);
            }
          }
        }
        return List.from(result);
      },
      'Fused',
      'mapFilter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Filter-Map operations
  results.push(
    benchmark(
      () => list.filter(x => x % 2 === 0).map(x => x * 2),
      'Standard',
      'filter+map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        const result: number[] = [];
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined && value % 2 === 0) {
            result.push(value * 2);
          }
        }
        return List.from(result);
      },
      'Fused',
      'filterMap',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Map-Reduce operations
  results.push(
    benchmark(
      () => list.map(x => x * 2).reduce((sum, x) => sum + x, 0),
      'Standard',
      'map+reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        let result = 0;
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined) {
            result += value * 2;
          }
        }
        return result;
      },
      'Fused',
      'mapReduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Filter-Reduce operations
  results.push(
    benchmark(
      () => list.filter(x => x % 2 === 0).reduce((sum, x) => sum + x, 0),
      'Standard',
      'filter+reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        let result = 0;
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined && value % 2 === 0) {
            result += value;
          }
        }
        return result;
      },
      'Fused',
      'filterReduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Map-Filter-Reduce operations
  results.push(
    benchmark(
      () => list.map(x => x * 2).filter(x => x % 4 === 0).reduce((sum, x) => sum + x, 0),
      'Standard',
      'map+filter+reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => {
        let result = 0;
        for (let i = 0; i < list.size; i++) {
          const value = list.get(i);
          if (value !== undefined) {
            const mapped = value * 2;
            if (mapped % 4 === 0) {
              result += mapped;
            }
          }
        }
        return result;
      },
      'Fused',
      'mapFilterReduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  return {
    name: 'Standard vs. Fused Operations',
    description: 'Comparison of standard operations with fused operations',
    benchmarks: results,
  };
}

/**
 * Compares standard lists with specialized lists
 *
 * @param size - Size of the list to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function compareStandardVsSpecializedLists(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const results: BenchmarkResult[] = [];

  // Create arrays for testing
  const numberArray = generateRandomArray(size);
  const stringArray = Array.from({ length: size }, (_, i) => `item-${i}`);
  const objectArray = Array.from({ length: size }, (_, i) => ({ id: i, value: `value-${i}` }));

  // Create standard lists
  const standardNumberList = List.from(numberArray);
  const standardStringList = List.from(stringArray);
  const standardObjectList = List.from(objectArray);

  // Create specialized lists (simulated)
  const specializedNumberList = List.from(numberArray);
  const specializedStringList = List.from(stringArray);
  const specializedObjectList = List.from(objectArray);

  // Number list operations
  results.push(
    benchmark(
      () => standardNumberList.map(x => x * 2),
      'Standard',
      'number-map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedNumberList.map(x => x * 2),
      'Specialized',
      'number-map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => standardNumberList.filter(x => x % 2 === 0),
      'Standard',
      'number-filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedNumberList.filter(x => x % 2 === 0),
      'Specialized',
      'number-filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => standardNumberList.reduce((sum, x) => sum + x, 0),
      'Standard',
      'number-reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedNumberList.reduce((sum, x) => sum + x, 0),
      'Specialized',
      'number-reduce',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedNumberList.reduce((sum, x) => sum + x, 0),
      'Specialized',
      'number-sum',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // String list operations
  results.push(
    benchmark(
      () => standardStringList.map(s => s.toUpperCase()),
      'Standard',
      'string-map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedStringList.map(s => s.toUpperCase()),
      'Specialized',
      'string-map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => standardStringList.filter(s => s.length > 5),
      'Standard',
      'string-filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedStringList.filter(s => s.length > 5),
      'Specialized',
      'string-filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => standardStringList.toArray().join(','),
      'Standard',
      'string-join',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedStringList.toArray().join(','),
      'Specialized',
      'string-join',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Object list operations
  results.push(
    benchmark(
      () => standardObjectList.map(obj => ({ ...obj, id: obj.id * 2 })),
      'Standard',
      'object-map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedObjectList.map(obj => ({ ...obj, id: obj.id * 2 })),
      'Specialized',
      'object-map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => standardObjectList.filter(obj => obj.id % 2 === 0),
      'Standard',
      'object-filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedObjectList.filter(obj => obj.id % 2 === 0),
      'Specialized',
      'object-filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => standardObjectList.map(obj => obj.id),
      'Standard',
      'object-pluck',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  results.push(
    benchmark(
      () => specializedObjectList.map(obj => obj.id),
      'Specialized',
      'object-pluck',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  return {
    name: 'Standard vs. Specialized Lists',
    description: 'Comparison of standard lists with specialized lists',
    benchmarks: results,
  };
}
