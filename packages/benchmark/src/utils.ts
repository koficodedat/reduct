/**
 * Benchmark utilities
 *
 * @packageDocumentation
 */

import { BenchmarkOptions, BenchmarkResult } from './types';

/**
 * Default benchmark options
 */
export const defaultOptions: BenchmarkOptions = {
  iterations: 100,
  warmup: true,
  warmupIterations: 5,
  measureMemory: false,
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
 *
 * @example
 * ```typescript
 * const result = benchmark(
 *   () => quickSort(largeArray),
 *   'QuickSort',
 *   'sort',
 *   largeArray.length
 * );
 * ```
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

  let memoryBefore = 0;
  let memoryAfter = 0;

  // Measure memory usage if requested
  if (opts.measureMemory && global.gc) {
    global.gc(); // Force garbage collection
    memoryBefore = process.memoryUsage().heapUsed;
  }

  const start = performance.now();

  // Run the function multiple times to get a more accurate measurement
  for (let i = 0; i < (opts.iterations || 1); i++) {
    fn();
  }

  const end = performance.now();
  const totalTime = end - start;
  const iterations = opts.iterations || 1;

  // Measure memory usage after execution if requested
  if (opts.measureMemory && global.gc) {
    global.gc(); // Force garbage collection
    memoryAfter = process.memoryUsage().heapUsed;
  }

  // Calculate average time per operation
  const timePerOperation = totalTime / iterations;
  const opsPerSecond = 1000 / timePerOperation;

  const result: BenchmarkResult = {
    name,
    operation,
    timeMs: timePerOperation,
    opsPerSecond,
    inputSize,
  };

  // Add memory usage if measured
  if (opts.measureMemory) {
    result.memoryBytes = memoryAfter - memoryBefore;
  }

  return result;
}

/**
 * Compares the performance of multiple functions
 *
 * @param fns - Object mapping function names to functions
 * @param operation - The operation being tested
 * @param inputSize - The size of the input
 * @param options - Benchmark configuration options
 * @returns Object with benchmark results for each function
 *
 * @example
 * ```typescript
 * const results = compareBenchmarks({
 *   quickSort: () => quickSort(largeArray),
 *   mergeSort: () => mergeSort(largeArray),
 *   heapSort: () => heapSort(largeArray)
 * }, 'sort', largeArray.length);
 * ```
 */
export function compareBenchmarks<T>(
  fns: Record<string, () => T>,
  operation: string,
  inputSize: number,
  options: BenchmarkOptions = {},
): Record<string, BenchmarkResult> {
  const results: Record<string, BenchmarkResult> = {};

  for (const [name, fn] of Object.entries(fns)) {
    results[name] = benchmark(fn, name, operation, inputSize, options);
  }

  return results;
}

/**
 * Generates an array of random numbers for benchmarking
 *
 * @param size - The size of the array to generate
 * @param min - Minimum possible value (default: 0)
 * @param max - Maximum possible value (default: 1000)
 * @returns An array of random numbers
 */
export function generateRandomArray(size: number, min: number = 0, max: number = 1000): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Creates a sorted array for benchmarking
 *
 * @param size - The size of the array to generate
 * @returns A sorted array of sequential integers
 */
export function generateSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Creates a reverse-sorted array for benchmarking worst-case scenarios
 *
 * @param size - The size of the array to generate
 * @returns A reverse-sorted array of integers
 */
export function generateReverseSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i - 1);
}

/**
 * Creates an array with mostly sorted elements and some random elements
 *
 * @param size - The size of the array to generate
 * @param randomFactor - Percentage of elements that will be random (0-1)
 * @returns A mostly sorted array with some random elements
 */
export function generatePartiallySortedArray(size: number, randomFactor: number = 0.1): number[] {
  const result = Array.from({ length: size }, (_, i) => i);

  // Randomly swap elements based on the random factor
  const swapsCount = Math.floor(size * randomFactor);

  for (let i = 0; i < swapsCount; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);

    [result[idx1], result[idx2]] = [result[idx2], result[idx1]];
  }

  return result;
}

/**
 * Generates random key-value pairs for map benchmarking
 *
 * @param size - The number of entries to generate
 * @returns An array of key-value pairs
 */
export function generateRandomEntries(size: number): Array<[string, number]> {
  return Array.from({ length: size }, (_, i) => [`key${i}`, Math.floor(Math.random() * 1000)]);
}

/**
 * Formats benchmark results as a string table
 *
 * @param results - Object with benchmark results
 * @returns Formatted string with results
 */
export function formatBenchmarkResults(results: Record<string, BenchmarkResult>): string {
  // Get a list of all of the results
  const entries = Object.values(results);

  // Determine the fastest implementation
  const fastestTime = Math.min(...entries.map(r => r.timeMs));

  // Create header
  let output = 'Implementation  | Time (ms) | Ops/Sec   | vs. Fastest';
  if (entries.some(r => r.memoryBytes !== undefined)) {
    output += ' | Memory (KB)';
  }
  output += '\n';
  
  output += '--------------- | --------- | --------- | -----------';
  if (entries.some(r => r.memoryBytes !== undefined)) {
    output += ' | -----------';
  }
  output += '\n';

  // Add each result
  for (const result of entries.sort((a, b) => a.timeMs - b.timeMs)) {
    const relativeSpeed = result.timeMs / fastestTime;
    const relativeText =
      result.timeMs === fastestTime ? 'fastest' : `${relativeSpeed.toFixed(2)}x slower`;

    output += `${result.name.padEnd(15)} | ${result.timeMs.toFixed(4).padStart(9)} | ${Math.floor(
      result.opsPerSecond,
    )
      .toString()
      .padStart(9)} | ${relativeText.padStart(11)}`;
    
    if (result.memoryBytes !== undefined) {
      const memoryKB = (result.memoryBytes / 1024).toFixed(2);
      output += ` | ${memoryKB.padStart(11)}`;
    }
    
    output += '\n';
  }

  return output;
}
