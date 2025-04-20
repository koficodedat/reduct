/**
 * Benchmarking utilities for WebAssembly
 */
import { Accelerator } from '../accelerators/accelerator';

/**
 * Options for benchmarking
 */
export interface BenchmarkOptions {
  /**
   * Number of iterations to run
   * @default 10
   */
  iterations?: number;
  
  /**
   * Number of warmup iterations to run
   * @default 3
   */
  warmupIterations?: number;
  
  /**
   * Whether to validate that the results are equal
   * @default true
   */
  validateResults?: boolean;
  
  /**
   * Custom equality function for result validation
   */
  equalityFn?: (a: any, b: any) => boolean;
}

/**
 * Result of a benchmark
 */
export interface BenchmarkResult {
  /**
   * Time taken by the JavaScript implementation (ms)
   */
  jsTime: number;
  
  /**
   * Time taken by the WebAssembly implementation (ms)
   */
  wasmTime: number;
  
  /**
   * Speedup factor (jsTime / wasmTime)
   */
  speedup: number;
  
  /**
   * Result of the JavaScript implementation
   */
  jsResult: any;
  
  /**
   * Result of the WebAssembly implementation
   */
  wasmResult: any;
  
  /**
   * Whether the results are equal
   */
  resultsEqual: boolean;
  
  /**
   * Detailed timing information for each iteration
   */
  details: {
    jsTimings: number[];
    wasmTimings: number[];
  };
}

/**
 * Benchmark a JavaScript implementation against a WebAssembly accelerator
 * @param jsImplementation The JavaScript implementation
 * @param wasmAccelerator The WebAssembly accelerator
 * @param input The input for the operation
 * @param options Options for the benchmark
 * @returns The benchmark result
 */
export function benchmark<T, R>(
  jsImplementation: (input: T) => R,
  wasmAccelerator: Accelerator<T, R>,
  input: T,
  options: BenchmarkOptions = {}
): BenchmarkResult {
  const {
    iterations = 10,
    warmupIterations = 3,
    validateResults = true,
    equalityFn = defaultEqualityFn,
  } = options;
  
  // Check if the accelerator is available
  if (!wasmAccelerator.isAvailable()) {
    throw new Error('WebAssembly accelerator is not available');
  }
  
  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    jsImplementation(input);
    wasmAccelerator.execute(input);
  }
  
  // Benchmark JavaScript implementation
  const jsTimings: number[] = [];
  let jsResult: R;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    jsResult = jsImplementation(input);
    const end = performance.now();
    jsTimings.push(end - start);
  }
  
  // Benchmark WebAssembly implementation
  const wasmTimings: number[] = [];
  let wasmResult: R;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    wasmResult = wasmAccelerator.execute(input);
    const end = performance.now();
    wasmTimings.push(end - start);
  }
  
  // Calculate average times
  const jsTime = jsTimings.reduce((sum, time) => sum + time, 0) / iterations;
  const wasmTime = wasmTimings.reduce((sum, time) => sum + time, 0) / iterations;
  
  // Calculate speedup
  const speedup = jsTime / wasmTime;
  
  // Validate results
  const resultsEqual = validateResults ? equalityFn(jsResult!, wasmResult!) : true;
  
  return {
    jsTime,
    wasmTime,
    speedup,
    jsResult: jsResult!,
    wasmResult: wasmResult!,
    resultsEqual,
    details: {
      jsTimings,
      wasmTimings,
    },
  };
}

/**
 * Default equality function for result validation
 * @param a First value
 * @param b Second value
 * @returns True if the values are equal, false otherwise
 */
function defaultEqualityFn(a: any, b: any): boolean {
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!defaultEqualityFn(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Handle objects
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!defaultEqualityFn(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  // Handle primitives
  return a === b;
}

/**
 * Format a benchmark result as a string
 * @param result The benchmark result
 * @returns The formatted result
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  const { jsTime, wasmTime, speedup, resultsEqual } = result;
  
  return `
JavaScript time: ${jsTime.toFixed(2)}ms
WebAssembly time: ${wasmTime.toFixed(2)}ms
Speedup: ${speedup.toFixed(2)}x
Results equal: ${resultsEqual}
`;
}

/**
 * Format a benchmark result as Markdown
 * @param result The benchmark result
 * @param title Title for the benchmark
 * @returns The formatted result as Markdown
 */
export function formatBenchmarkResultMarkdown(result: BenchmarkResult, title = 'Benchmark Result'): string {
  const { jsTime, wasmTime, speedup, resultsEqual, details } = result;
  
  // Calculate statistics
  const jsMin = Math.min(...details.jsTimings);
  const jsMax = Math.max(...details.jsTimings);
  const jsStdDev = calculateStandardDeviation(details.jsTimings);
  
  const wasmMin = Math.min(...details.wasmTimings);
  const wasmMax = Math.max(...details.wasmTimings);
  const wasmStdDev = calculateStandardDeviation(details.wasmTimings);
  
  return `
## ${title}

| Implementation | Average Time | Min Time | Max Time | Standard Deviation |
|---------------|--------------|----------|----------|-------------------|
| JavaScript    | ${jsTime.toFixed(2)}ms | ${jsMin.toFixed(2)}ms | ${jsMax.toFixed(2)}ms | ${jsStdDev.toFixed(2)}ms |
| WebAssembly   | ${wasmTime.toFixed(2)}ms | ${wasmMin.toFixed(2)}ms | ${wasmMax.toFixed(2)}ms | ${wasmStdDev.toFixed(2)}ms |

**Speedup**: ${speedup.toFixed(2)}x
**Results Equal**: ${resultsEqual}
`;
}

/**
 * Calculate the standard deviation of an array of numbers
 * @param values The values
 * @returns The standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(variance);
}
