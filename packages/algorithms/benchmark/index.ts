/**
 * Benchmark utilities
 *
 * Provides tools for measuring and comparing algorithm performance.
 *
 * @packageDocumentation
 */

/**
 * Result of a benchmark run
 */
export interface BenchmarkResult {
  /** Name of the benchmark */
  name: string;
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
 * @param inputSize - The size of the input (for ops/sec calculation)
 * @param options - Benchmark configuration options
 * @returns Benchmark results
 *
 * @example
 * ```typescript
 * const result = benchmark(
 *   () => quickSort(largeArray),
 *   'QuickSort',
 *   largeArray.length
 * );
 * ```
 */
export function benchmark<T>(
  fn: () => T,
  name: string,
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
    timeMs: timePerOperation,
    opsPerSecond,
    inputSize,
  };
}

/**
 * Compares the performance of multiple functions
 *
 * @param fns - Object mapping function names to functions
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
 * }, largeArray.length);
 * ```
 */
export function compareBenchmarks<T>(
  fns: Record<string, () => T>,
  inputSize: number,
  options: BenchmarkOptions = {},
): Record<string, BenchmarkResult> {
  const results: Record<string, BenchmarkResult> = {};

  for (const [name, fn] of Object.entries(fns)) {
    results[name] = benchmark(fn, name, inputSize, options);
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
  let output = 'Algorithm       | Time (ms) | Ops/Sec   | vs. Fastest\n';
  output += '--------------- | --------- | --------- | -----------\n';

  // Add each result
  for (const result of entries.sort((a, b) => a.timeMs - b.timeMs)) {
    const relativeSpeed = result.timeMs / fastestTime;
    const relativeText =
      result.timeMs === fastestTime ? 'fastest' : `${relativeSpeed.toFixed(2)}x slower`;

    output += `${result.name.padEnd(15)} | ${result.timeMs.toFixed(4).padStart(9)} | ${Math.floor(
      result.opsPerSecond,
    )
      .toString()
      .padStart(9)} | ${relativeText}\n`;
  }

  return output;
}
