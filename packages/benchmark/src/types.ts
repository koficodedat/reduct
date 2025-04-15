/**
 * Common types for benchmarking
 *
 * @packageDocumentation
 */

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
  /** Memory usage in bytes (if available) */
  memoryBytes?: number;
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
  /** Whether to measure memory usage */
  measureMemory?: boolean;
}

/**
 * A suite of benchmarks
 */
export interface BenchmarkSuite {
  /** Name of the benchmark suite */
  name: string;
  /** Description of the benchmark suite */
  description?: string;
  /** Individual benchmarks in the suite */
  benchmarks: BenchmarkResult[];
}

/**
 * Comparison of multiple implementations
 */
export interface BenchmarkComparison {
  /** Name of the comparison */
  name: string;
  /** Description of the comparison */
  description?: string;
  /** Operation being compared */
  operation: string;
  /** Input size used for testing */
  inputSize: number;
  /** Results for each implementation */
  results: {
    /** Implementation name */
    implementation: string;
    /** Execution time in milliseconds */
    timeMs: number;
    /** Number of operations per second */
    opsPerSecond: number;
    /** Memory usage in bytes (if available) */
    memoryBytes?: number;
    /** Relative performance compared to the fastest implementation */
    relativeFactor: number;
  }[];
}

/**
 * Scalability test result
 */
export interface ScalabilityResult {
  /** Name of the implementation */
  implementation: string;
  /** Operation being tested */
  operation: string;
  /** Results for different input sizes */
  results: {
    /** Input size */
    inputSize: number;
    /** Execution time in milliseconds */
    timeMs: number;
    /** Number of operations per second */
    opsPerSecond: number;
    /** Memory usage in bytes (if available) */
    memoryBytes?: number;
  }[];
}
