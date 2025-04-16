/**
 * Map data structure benchmarks
 *
 * @packageDocumentation
 */

import { ImmutableMap } from '@reduct/data-structures';
import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../types';
import { benchmark, formatBenchmarkResults, generateRandomEntries } from '../utils';

/**
 * Runs benchmarks for the immutable Map data structure
 *
 * @param size - Size of the map to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function runMapBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const results: BenchmarkResult[] = [];

  // Create entries for testing
  const entries = generateRandomEntries(size);
  const smallEntries = generateRandomEntries(10);

  // Create maps for testing
  const map = ImmutableMap.from(entries);
  const smallMap = ImmutableMap.from(smallEntries);

  // Random keys for lookup tests
  const randomIndices = Array.from({ length: 100 }, () => Math.floor(Math.random() * size));
  const randomKeys = randomIndices.map(i => `key${i}`);

  // Construction benchmark
  results.push(
    benchmark(() => ImmutableMap.from(entries), 'Map', 'construction', size, options),
  );

  // Get benchmark (existing keys)
  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          map.get(key);
        }
      },
      'Map',
      'get(100 random)',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Has benchmark
  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          map.has(key);
        }
      },
      'Map',
      'has(100 random)',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Set benchmark
  results.push(
    benchmark(
      () => {
        let result = smallMap;
        for (let i = 0; i < 100; i++) {
          result = result.set(`newKey${i}`, i);
        }
      },
      'Map',
      'set(100x)',
      smallEntries.length,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Delete benchmark
  results.push(
    benchmark(
      () => {
        let result = smallMap;
        for (let i = 0; i < 10; i++) {
          result = result.delete(`key${i}`);
        }
      },
      'Map',
      'delete(10x)',
      smallEntries.length,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Map benchmark
  results.push(
    benchmark(
      () => map.map((value: number) => value * 2),
      'Map',
      'map',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Filter benchmark
  results.push(
    benchmark(
      () => map.filter((value: number) => value % 2 === 0),
      'Map',
      'filter',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Keys benchmark
  results.push(benchmark(() => map.keys(), 'Map', 'keys()', size, options));

  // Values benchmark
  results.push(benchmark(() => map.values(), 'Map', 'values()', size, options));

  // Entries benchmark
  results.push(
    benchmark(() => map.entries(), 'Map', 'entries()', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  return {
    name: 'Map Benchmarks',
    description: 'Performance benchmarks for the immutable Map data structure',
    benchmarks: results,
  };
}

/**
 * Compares the Map implementation with native JavaScript Map and plain objects
 *
 * @param size - Size of the data structures to test
 * @param options - Benchmark options
 * @returns Formatted benchmark results
 */
export function compareMapWithNativeMap(
  size: number = 10000,
  options: BenchmarkOptions = {},
): string {
  const entries = generateRandomEntries(size);

  // Create different map implementations
  const nativeMap = new Map(entries);
  const immutableMap = ImmutableMap.from(entries);
  const plainObject: Record<string, number> = {};
  for (const [key, value] of entries) {
    plainObject[key] = value;
  }

  // Random keys for lookup tests
  const randomIndices = Array.from({ length: 100 }, () => Math.floor(Math.random() * size));
  const randomKeys = randomIndices.map(i => `key${i}`);

  const results: Record<string, BenchmarkResult> = {};

  // Construction
  results['Map constructor'] = benchmark(
    () => new Map(entries),
    'Map',
    'construction',
    size,
    options,
  );

  results['ImmutableMap.from'] = benchmark(
    () => ImmutableMap.from(entries),
    'ImmutableMap',
    'construction',
    size,
    options,
  );

  results['Object.fromEntries'] = benchmark(
    () => Object.fromEntries(entries),
    'Object',
    'construction',
    size,
    options,
  );

  // Get operation
  results['Map.get'] = benchmark(
    () => {
      for (const key of randomKeys) {
        nativeMap.get(key);
      }
    },
    'Map',
    'get(100 random)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['ImmutableMap.get'] = benchmark(
    () => {
      for (const key of randomKeys) {
        immutableMap.get(key);
      }
    },
    'ImmutableMap',
    'get(100 random)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Object access'] = benchmark(
    () => {
      for (const key of randomKeys) {
        plainObject[key];
      }
    },
    'Object',
    'access(100 random)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Has operation
  results['Map.has'] = benchmark(
    () => {
      for (const key of randomKeys) {
        nativeMap.has(key);
      }
    },
    'Map',
    'has(100 random)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['ImmutableMap.has'] = benchmark(
    () => {
      for (const key of randomKeys) {
        immutableMap.has(key);
      }
    },
    'ImmutableMap',
    'has(100 random)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Object in'] = benchmark(
    () => {
      for (const key of randomKeys) {
        key in plainObject;
      }
    },
    'Object',
    'in(100 random)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Set operation (small scale)
  const smallSize = 100;
  const smallEntries = generateRandomEntries(smallSize);
  const smallNativeMap = new Map(smallEntries);
  const smallImmutableMap = ImmutableMap.from(smallEntries);
  const smallObject: Record<string, number> = {};
  for (const [key, value] of smallEntries) {
    smallObject[key] = value;
  }

  results['Map.set'] = benchmark(
    () => {
      const map = new Map(smallNativeMap);
      for (let i = 0; i < 100; i++) {
        map.set(`newKey${i}`, i);
      }
    },
    'Map',
    'set(100x)',
    smallSize,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['ImmutableMap.set'] = benchmark(
    () => {
      let map = smallImmutableMap;
      for (let i = 0; i < 100; i++) {
        map = map.set(`newKey${i}`, i);
      }
    },
    'ImmutableMap',
    'set(100x)',
    smallSize,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Object assignment'] = benchmark(
    () => {
      const obj = { ...smallObject };
      for (let i = 0; i < 100; i++) {
        obj[`newKey${i}`] = i;
      }
    },
    'Object',
    'assignment(100x)',
    smallSize,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  return formatBenchmarkResults(results);
}

/**
 * Measures how Map operations scale with input size
 *
 * @param operation - The operation to test
 * @param maxSize - Maximum map size to test
 * @param steps - Number of size increments to test
 * @param options - Benchmark options
 * @returns Scalability results
 */
export function measureMapScalability(
  operation: 'get' | 'has' | 'set' | 'delete' | 'map' | 'filter',
  maxSize: number = 100000,
  steps: number = 5,
  options: BenchmarkOptions = {},
): ScalabilityResult {
  const results: ScalabilityResult['results'] = [];

  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((maxSize / steps) * step);
    const entries = generateRandomEntries(size);
    const map = ImmutableMap.from(entries);

    let result: BenchmarkResult;

    switch (operation) {
      case 'get': {
        const randomIndices = Array.from({ length: 100 }, () => Math.floor(Math.random() * size));
        const randomKeys = randomIndices.map(i => `key${i}`);
        result = benchmark(
          () => {
            for (const key of randomKeys) {
              map.get(key);
            }
          },
          'ImmutableMap',
          'get(100 random)',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      }
      case 'has': {
        const randomIndices = Array.from({ length: 100 }, () => Math.floor(Math.random() * size));
        const randomKeys = randomIndices.map(i => `key${i}`);
        result = benchmark(
          () => {
            for (const key of randomKeys) {
              map.has(key);
            }
          },
          'ImmutableMap',
          'has(100 random)',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      }
      case 'set':
        result = benchmark(() => map.set('newKey', 999), 'ImmutableMap', 'set', size, options);
        break;
      case 'delete':
        result = benchmark(() => map.delete(`key0`), 'ImmutableMap', 'delete', size, options);
        break;
      case 'map':
        result = benchmark(
          () => map.map((value: number) => value * 2),
          'ImmutableMap',
          'map',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      case 'filter':
        result = benchmark(
          () => map.filter((value: number) => value % 2 === 0),
          'ImmutableMap',
          'filter',
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
    implementation: 'ImmutableMap',
    operation,
    results,
  };
}
