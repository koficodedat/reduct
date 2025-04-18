/**
 * Map data structure benchmarks
 *
 * @packageDocumentation
 */

// TODO: Import ImmutableMap when it's implemented
// import { ImmutableMap } from '@reduct/data-structures';

/**
 * Temporary ImmutableMap implementation for benchmarking
 */
export class ImmutableMap<K, V> {
  private readonly _data: Map<K, V>;

  constructor(data: Map<K, V> = new Map()) {
    this._data = data;
  }

  static empty<K, V>(): ImmutableMap<K, V> {
    return new ImmutableMap<K, V>();
  }

  static from<K, V>(entries: [K, V][]): ImmutableMap<K, V> {
    return new ImmutableMap<K, V>(new Map(entries));
  }

  get size(): number {
    return this._data.size;
  }

  get isEmpty(): boolean {
    return this._data.size === 0;
  }

  has(key: K): boolean {
    return this._data.has(key);
  }

  get(key: K): V | undefined {
    return this._data.get(key);
  }

  set(key: K, value: V): ImmutableMap<K, V> {
    const newMap = new Map(this._data);
    newMap.set(key, value);
    return new ImmutableMap<K, V>(newMap);
  }

  delete(key: K): ImmutableMap<K, V> {
    if (!this._data.has(key)) {
      return this;
    }
    const newMap = new Map(this._data);
    newMap.delete(key);
    return new ImmutableMap<K, V>(newMap);
  }

  map<U>(fn: (value: V, key: K) => U): ImmutableMap<K, U> {
    const newMap = new Map<K, U>();
    this._data.forEach((value, key) => {
      newMap.set(key, fn(value, key));
    });
    return new ImmutableMap<K, U>(newMap);
  }

  filter(fn: (value: V, key: K) => boolean): ImmutableMap<K, V> {
    const newMap = new Map<K, V>();
    this._data.forEach((value, key) => {
      if (fn(value, key)) {
        newMap.set(key, value);
      }
    });
    return new ImmutableMap<K, V>(newMap);
  }

  keys(): K[] {
    return Array.from(this._data.keys());
  }

  values(): V[] {
    return Array.from(this._data.values());
  }

  entries(): [K, V][] {
    return Array.from(this._data.entries());
  }
}
import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import { benchmark, generateRandomEntries } from '../../utils';

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
