/**
 * Data structure benchmarking utilities
 *
 * Provides tools for measuring and comparing data structure performance.
 *
 * @packageDocumentation
 */

import { List } from '../list';
import { Stack } from '../stack';
import { ImmutableMap } from '../map';

/**
 * Result of a benchmark run
 */
export interface BenchmarkResult {
  /** Name of the benchmark */
  name: string;
  /** Operation being tested */
  operation: string;
  /** Execution time in milliseconds */
  timeMs: number;
  /** Number of operations per second */
  opsPerSecond: number;
  /** Input size used for testing */
  inputSize: number;
}

/**
 * Options for running a benchmark
 */
export interface BenchmarkOptions {
  /** Number of times to repeat the test */
  iterations?: number;
  /** Whether to warm up the function before measuring */
  warmup?: boolean;
  /** Number of warm-up runs */
  warmupIterations?: number;
}

/**
 * Default benchmark options
 */
const defaultOptions: BenchmarkOptions = {
  iterations: 100,
  warmup: true,
  warmupIterations: 5,
};

/**
 * Measures the execution time of a function
 *
 * @param fn - The function to benchmark
 * @param name - A name for the benchmark
 * @param operation - The operation being tested
 * @param inputSize - The size of the input (for ops/sec calculation)
 * @param options - Benchmark configuration options
 * @returns Benchmark results
 */
export function benchmark<T>(
  fn: () => T,
  name: string,
  operation: string,
  inputSize: number,
  options: BenchmarkOptions = {},
): BenchmarkResult {
  const opts = { ...defaultOptions, ...options };

  // Warm up the function to avoid JIT compilation affecting the measurement
  if (opts.warmup && opts.warmupIterations) {
    for (let i = 0; i < opts.warmupIterations; i++) {
      fn();
    }
  }

  const start = performance.now();

  // Run the function multiple times to get a more accurate measurement
  for (let i = 0; i < (opts.iterations || 1); i++) {
    fn();
  }

  const end = performance.now();
  const totalTime = end - start;
  const iterations = opts.iterations || 1;

  // Calculate average time per operation
  const timePerOperation = totalTime / iterations;
  const opsPerSecond = 1000 / timePerOperation;

  return {
    name,
    operation,
    timeMs: timePerOperation,
    opsPerSecond,
    inputSize,
  };
}

/**
 * Formats benchmark results as a string table
 *
 * @param results - Array of benchmark results
 * @returns Formatted string with results
 */
export function formatBenchmarkResults(results: BenchmarkResult[]): string {
  // Group results by data structure
  const groupedResults = results.reduce((groups, result) => {
    if (!groups[result.name]) {
      groups[result.name] = [];
    }
    groups[result.name].push(result);
    return groups;
  }, {} as Record<string, BenchmarkResult[]>);

  let output = '';

  // Create a table for each data structure
  for (const [dataStructure, results] of Object.entries(groupedResults)) {
    output += `\n## ${dataStructure} (size: ${results[0].inputSize})\n\n`;
    output += 'Operation     | Time (ms) | Ops/Sec   \n';
    output += '------------- | --------- | ----------\n';

    // Sort operations by performance (fastest first)
    results.sort((a, b) => a.timeMs - b.timeMs);

    for (const result of results) {
      output += `${result.operation.padEnd(13)} | ${result.timeMs
        .toFixed(4)
        .padStart(9)} | ${Math.floor(result.opsPerSecond).toLocaleString().padStart(10)}\n`;
    }

    output += '\n';
  }

  return output;
}

/**
 * Runs benchmarks for the immutable List data structure
 *
 * @param size - Size of the list to test
 * @returns Formatted benchmark results
 */
export function runListBenchmarks(size: number = 10000): string {
  const results: BenchmarkResult[] = [];

  // Create arrays for testing
  const array = Array.from({ length: size }, (_, i) => i);
  const smallArray = Array.from({ length: 10 }, (_, i) => i);

  // Create a list for testing
  const list = List.from(array);
  const smallList = List.from(smallArray);

  // Construction benchmark
  results.push(benchmark(() => List.from(array), 'List', 'construction', size));

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
      { iterations: 10 },
    ),
  );

  // Map benchmark
  results.push(benchmark(() => list.map(x => x * 2), 'List', 'map', size, { iterations: 10 }));

  // Filter benchmark
  results.push(
    benchmark(() => list.filter(x => x % 2 === 0), 'List', 'filter', size, { iterations: 10 }),
  );

  // Reduce benchmark
  results.push(
    benchmark(() => list.reduce((sum, x) => sum + x, 0), 'List', 'reduce', size, {
      iterations: 10,
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
      { iterations: 10 },
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
      { iterations: 10 },
    ),
  );

  // Concatenation benchmark
  results.push(benchmark(() => list.concat(list), 'List', 'concat', size, { iterations: 10 }));

  return formatBenchmarkResults(results);
}

/**
 * Runs benchmarks for the persistent Stack data structure
 *
 * @param size - Size of the stack to test
 * @returns Formatted benchmark results
 */
export function runStackBenchmarks(size: number = 10000): string {
  const results: BenchmarkResult[] = [];

  // Create arrays for testing
  const array = Array.from({ length: size }, (_, i) => i);
  const smallArray = Array.from({ length: 10 }, (_, i) => i);

  // Create stacks for testing
  const stack = Stack.from(array);
  const smallStack = Stack.from(smallArray);

  // Construction benchmark
  results.push(benchmark(() => Stack.from(array), 'Stack', 'construction', size));

  // Peek benchmark
  results.push(
    benchmark(
      () => {
        for (let i = 0; i < 1000; i++) {
          stack.peek();
        }
      },
      'Stack',
      'peek(1000x)',
      size,
      { iterations: 10 },
    ),
  );

  // Push benchmark
  results.push(
    benchmark(
      () => {
        let result = smallStack;
        for (let i = 0; i < 100; i++) {
          result = result.push(i);
        }
      },
      'Stack',
      'push(100x)',
      smallArray.length,
      { iterations: 10 },
    ),
  );

  // Pop benchmark
  results.push(
    benchmark(
      () => {
        let result = stack;
        for (let i = 0; i < 100; i++) {
          result = result.pop();
        }
      },
      'Stack',
      'pop(100x)',
      size,
      { iterations: 10 },
    ),
  );

  // Map benchmark
  results.push(benchmark(() => stack.map(x => x * 2), 'Stack', 'map', size, { iterations: 10 }));

  // Filter benchmark
  results.push(
    benchmark(() => stack.filter(x => x % 2 === 0), 'Stack', 'filter', size, { iterations: 10 }),
  );

  return formatBenchmarkResults(results);
}

/**
 * Runs benchmarks for the immutable Map data structure
 *
 * @param size - Number of entries in the map to test
 * @returns Formatted benchmark results
 */
export function runMapBenchmarks(size: number = 10000): string {
  const results: BenchmarkResult[] = [];

  // Create entries for testing
  const entries = Array.from({ length: size }, (_, i) => [`key${i}`, i] as [string, number]);
  const smallEntries = Array.from({ length: 10 }, (_, i) => [`key${i}`, i] as [string, number]);

  // Create a map for testing
  const map = ImmutableMap.from(entries);
  const smallMap = ImmutableMap.from(smallEntries);

  // Random keys for lookup tests
  const randomKeys = Array.from(
    { length: 100 },
    () => `key${Math.floor(Math.random() * size)}`,
  );

  // Construction benchmark
  results.push(benchmark(() => ImmutableMap.from(entries), 'Map', 'construction', size));

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
      { iterations: 10 },
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
      { iterations: 10 },
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
      { iterations: 10 },
    ),
  );

  // Delete benchmark
  results.push(
    benchmark(
      () => {
        let result = map;
        for (const key of randomKeys.slice(0, 10)) {
          result = result.delete(key);
        }
      },
      'Map',
      'delete(10x)',
      size,
      { iterations: 10 },
    ),
  );

  // Keys benchmark
  results.push(benchmark(() => map.keys(), 'Map', 'keys()', size, { iterations: 10 }));

  // Values benchmark
  results.push(benchmark(() => map.values(), 'Map', 'values()', size, { iterations: 10 }));

  // Entries benchmark
  results.push(benchmark(() => map.entries(), 'Map', 'entries()', size, { iterations: 10 }));

  // Map benchmark
  results.push(benchmark(() => map.map(x => x * 2), 'Map', 'map', size, { iterations: 10 }));

  // Filter benchmark
  results.push(
    benchmark(() => map.filter(x => x % 2 === 0), 'Map', 'filter', size, { iterations: 10 }),
  );

  return formatBenchmarkResults(results);
}

/**
 * Runs benchmarks for all data structures
 *
 * @param size - Size of data structures to test
 * @returns Formatted benchmark results
 */
export function runAllDataStructureBenchmarks(size: number = 10000): string {
  let output = '# Data Structure Benchmark Results\n';
  output += `\nInput size: ${size.toLocaleString()} elements\n`;

  output += runListBenchmarks(size);
  output += runStackBenchmarks(size);
  output += runMapBenchmarks(size);

  return output;
}

/**
 * Compares immutable data structures against native JavaScript equivalents
 *
 * @param size - Size of data structures to test
 * @returns Formatted benchmark results
 */
export function compareWithNativeStructures(size: number = 10000): string {
  const results: BenchmarkResult[] = [];

  // Create test data
  const array = Array.from({ length: size }, (_, i) => i);
  const list = List.from(array);

  // Map entries for testing
  const mapEntries = Array.from({ length: size }, (_, i) => [`key${i}`, i] as [string, number]);
  const immutableMap = ImmutableMap.from(mapEntries);
  const nativeMap = new Map(mapEntries);
  const plainObject = Object.fromEntries(mapEntries);

  // Random keys for lookup tests
  const randomIndices = Array.from({ length: 100 }, () => Math.floor(Math.random() * size));
  const randomKeys = randomIndices.map(i => `key${i}`);

  // Array vs List: Map operation
  results.push(benchmark(() => array.map(x => x * 2), 'Array', 'map', size, { iterations: 10 }));

  results.push(benchmark(() => list.map(x => x * 2), 'List', 'map', size, { iterations: 10 }));

  // Array vs List: Filter operation
  results.push(
    benchmark(() => array.filter(x => x % 2 === 0), 'Array', 'filter', size, { iterations: 10 }),
  );

  results.push(
    benchmark(() => list.filter(x => x % 2 === 0), 'List', 'filter', size, { iterations: 10 }),
  );

  // Array vs List: Reduce operation
  results.push(
    benchmark(() => array.reduce((sum, x) => sum + x, 0), 'Array', 'reduce', size, {
      iterations: 10,
    }),
  );

  results.push(
    benchmark(() => list.reduce((sum, x) => sum + x, 0), 'List', 'reduce', size, {
      iterations: 10,
    }),
  );

  // Map vs ImmutableMap: Get operation
  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          nativeMap.get(key);
        }
      },
      'Map',
      'get(100 random)',
      size,
      { iterations: 10 },
    ),
  );

  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          immutableMap.get(key);
        }
      },
      'ImmutableMap',
      'get(100 random)',
      size,
      { iterations: 10 },
    ),
  );

  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          plainObject[key];
        }
      },
      'Object',
      'access(100 random)',
      size,
      { iterations: 10 },
    ),
  );

  // Map vs ImmutableMap: Has operation
  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          nativeMap.has(key);
        }
      },
      'Map',
      'has(100 random)',
      size,
      { iterations: 10 },
    ),
  );

  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          immutableMap.has(key);
        }
      },
      'ImmutableMap',
      'has(100 random)',
      size,
      { iterations: 10 },
    ),
  );

  results.push(
    benchmark(
      () => {
        for (const key of randomKeys) {
          key in plainObject;
        }
      },
      'Object',
      'in(100 random)',
      size,
      { iterations: 10 },
    ),
  );

  return formatBenchmarkResults(results);
}
