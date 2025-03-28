/**
 * Complexity analysis tools
 *
 * Provides utilities for analyzing algorithmic complexity
 * and verifying Big O guarantees.
 *
 * @packageDocumentation
 */

/**
 * Common complexity classes for algorithm analysis
 */
export enum ComplexityClass {
  CONSTANT = 'O(1)',
  LOGARITHMIC = 'O(log n)',
  LINEAR = 'O(n)',
  LINEARITHMIC = 'O(n log n)',
  QUADRATIC = 'O(n²)',
  CUBIC = 'O(n³)',
  EXPONENTIAL = 'O(2^n)',
  FACTORIAL = 'O(n!)',
}

/**
 * Result of a complexity analysis
 */
export interface ComplexityAnalysisResult {
  /** Algorithm name */
  name: string;
  /** Measured complexity class */
  measuredClass: ComplexityClass;
  /** Expected complexity class */
  expectedClass: ComplexityClass;
  /** Whether the measured complexity matches expected */
  matches: boolean;
  /** Goodness of fit (R² value) for the complexity model */
  fitQuality: number;
  /** Raw timing data used for analysis */
  data: Array<{ size: number; time: number }>;
}

/**
 * Options for complexity analysis
 */
export interface ComplexityAnalysisOptions {
  /** Minimum input size to test */
  minSize?: number;
  /** Maximum input size to test */
  maxSize?: number;
  /** Number of size steps to measure */
  steps?: number;
  /** Number of times to repeat measurements for each size */
  samples?: number;
  /** Timeout in milliseconds for each test run */
  timeout?: number;
}

/**
 * Default complexity analysis options
 */
const defaultOptions: ComplexityAnalysisOptions = {
  minSize: 100,
  maxSize: 10000,
  steps: 10,
  samples: 5,
  timeout: 5000,
};

/**
 * Analyzes the time complexity of an algorithm
 *
 * @param name - Algorithm name
 * @param algorithm - Function to analyze
 * @param inputGenerator - Function to generate input of given size
 * @param expectedClass - Expected complexity class
 * @param options - Analysis options
 * @returns Analysis results
 *
 * @example
 * ```typescript
 * const result = analyzeTimeComplexity(
 *   'quickSort',
 *   quickSort,
 *   size => generateRandomArray(size),
 *   ComplexityClass.LINEARITHMIC
 * );
 * ```
 */
export async function analyzeTimeComplexity<T, R>(
  name: string,
  algorithm: (input: T) => R,
  inputGenerator: (size: number) => T,
  expectedClass: ComplexityClass,
  options: ComplexityAnalysisOptions = {},
): Promise<ComplexityAnalysisResult> {
  const opts = { ...defaultOptions, ...options };

  if (!opts.minSize || !opts.maxSize || !opts.steps || !opts.samples) {
    throw new Error('Invalid options: min/max size, steps, and samples must be defined');
  }

  const sizeStep = (opts.maxSize - opts.minSize) / (opts.steps - 1);
  const sizes = Array.from({ length: opts.steps }, (_, i) =>
    Math.floor(opts?.minSize ?? 0 + i * sizeStep),
  );

  const data: Array<{ size: number; time: number }> = [];

  // Measure execution time for each input size
  for (const size of sizes) {
    let totalTime = 0;

    for (let sample = 0; sample < opts.samples; sample++) {
      const input = inputGenerator(size);

      const start = performance.now();
      algorithm(input);
      const end = performance.now();

      totalTime += end - start;
    }

    // Calculate average time per sample
    const avgTime = totalTime / opts.samples;
    data.push({ size, time: avgTime });
  }

  // Analyze the complexity based on the timing data
  const result = fitComplexityModel(data, expectedClass);

  return {
    name,
    measuredClass: result.bestFit,
    expectedClass,
    matches: result.bestFit === expectedClass,
    fitQuality: result.bestFitQuality,
    data,
  };
}

/**
 * Fits timing data to different complexity models and determines the best fit
 *
 * @param data - Timing data with input sizes and execution times
 * @param expectedClass - Expected complexity class
 * @returns The best fitting complexity model
 * @internal
 */
function fitComplexityModel(
  data: Array<{ size: number; time: number }>,
  expectedClass: ComplexityClass,
): { bestFit: ComplexityClass; bestFitQuality: number } {
  const complexityFunctions: Record<ComplexityClass, (n: number) => number> = {
    [ComplexityClass.CONSTANT]: _n => 1,
    [ComplexityClass.LOGARITHMIC]: _n => Math.log(_n),
    [ComplexityClass.LINEAR]: _n => _n,
    [ComplexityClass.LINEARITHMIC]: _n => _n * Math.log(_n),
    [ComplexityClass.QUADRATIC]: _n => _n * _n,
    [ComplexityClass.CUBIC]: _n => _n * _n * _n,
    [ComplexityClass.EXPONENTIAL]: _n => Math.pow(2, _n),
    [ComplexityClass.FACTORIAL]: _n => {
      // Approximate factorial with Stirling's formula for large n
      // to avoid overflow
      if (_n > 20) {
        return Math.sqrt(2 * Math.PI * _n) * Math.pow(_n / Math.E, _n);
      }

      let result = 1;
      for (let i = 2; i <= _n; i++) {
        result *= i;
      }
      return result;
    },
  };

  // Calculate coefficient of determination (R²) for each model
  const results: Record<ComplexityClass, number> = {} as Record<ComplexityClass, number>;

  for (const [className, complexityFn] of Object.entries(complexityFunctions)) {
    if (className === ComplexityClass.EXPONENTIAL || className === ComplexityClass.FACTORIAL) {
      // Skip extremely complex models for large inputs
      if (data.some(d => d.size > 20)) {
        results[className as ComplexityClass] = 0;
        continue;
      }
    }

    // Fit the data to the model using linear regression
    results[className as ComplexityClass] = calculateRSquared(data, complexityFn);
  }

  // Find the best fit model
  let bestFit = expectedClass;
  let bestFitQuality = results[expectedClass];

  for (const [className, r2] of Object.entries(results)) {
    if (r2 > bestFitQuality) {
      bestFit = className as ComplexityClass;
      bestFitQuality = r2;
    }
  }

  return { bestFit, bestFitQuality };
}

/**
 * Calculates the coefficient of determination (R²) to measure how well
 * the data fits the complexity model
 *
 * @param data - Timing data
 * @param complexityFn - Complexity function to evaluate
 * @returns R² value (0-1) with 1 being a perfect fit
 * @internal
 */
function calculateRSquared(
  data: Array<{ size: number; time: number }>,
  complexityFn: (n: number) => number,
): number {
  // Normalize the complexity function values
  const xValues = data.map(d => complexityFn(d.size));
  const yValues = data.map(d => d.time);

  // Simple linear regression
  const n = data.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const predicted = xValues.map(x => intercept + slope * x);
  const residualSumOfSquares = yValues.reduce(
    (sum, y, i) => sum + Math.pow(y - predicted[i], 2),
    0,
  );
  const totalSumOfSquares = yValues.reduce((sum, y) => sum + Math.pow(y - sumY / n, 2), 0);

  if (totalSumOfSquares === 0) return 0;

  const rSquared = 1 - residualSumOfSquares / totalSumOfSquares;

  // R² should be between 0 and 1
  return Math.max(0, Math.min(1, rSquared));
}

/**
 * Options for operation counting
 */
export interface OperationCounterOptions {
  /** Whether to count comparisons */
  countComparisons?: boolean;
  /** Whether to count swaps */
  countSwaps?: boolean;
  /** Whether to count accesses */
  countAccesses?: boolean;
  /** Whether to count creations/allocations */
  countCreations?: boolean;
}

/**
 * Provides operation counting for complexity verification
 */
export class OperationCounter<T> {
  private readonly array: T[];
  private comparisons = 0;
  private swaps = 0;
  private accesses = 0;
  private creations = 0;

  /**
   * Creates a new operation counter
   *
   * @param array - Array to wrap for operation counting
   * @param options - Counting options
   */
  constructor(
    array: readonly T[],
    private readonly options: OperationCounterOptions = {
      countComparisons: true,
      countSwaps: true,
      countAccesses: true,
      countCreations: true,
    },
  ) {
    this.array = [...array];
  }

  /**
   * Gets an element from the array
   *
   * @param index - Element index
   * @returns The element at the index
   */
  get(index: number): T {
    if (this.options.countAccesses) {
      this.accesses++;
    }

    if (index < 0 || index >= this.array.length) {
      throw new Error(`Index out of bounds: ${index}`);
    }

    return this.array[index];
  }

  /**
   * Sets an element in the array
   *
   * @param index - Element index
   * @param value - New element value
   */
  set(index: number, value: T): void {
    if (this.options.countAccesses) {
      this.accesses++;
    }

    if (index < 0 || index >= this.array.length) {
      throw new Error(`Index out of bounds: ${index}`);
    }

    this.array[index] = value;
  }

  /**
   * Swaps two elements in the array
   *
   * @param i - First index
   * @param j - Second index
   */
  swap(i: number, j: number): void {
    if (this.options.countSwaps) {
      this.swaps++;
    }

    if (this.options.countAccesses) {
      this.accesses += 2;
    }

    if (i < 0 || i >= this.array.length || j < 0 || j >= this.array.length) {
      throw new Error(`Index out of bounds: ${i} or ${j}`);
    }

    const temp = this.array[i];
    this.array[i] = this.array[j];
    this.array[j] = temp;
  }

  /**
   * Compares two elements
   *
   * @param a - First element
   * @param b - Second element
   * @returns Comparison result (-1, 0, or 1)
   */
  compare(a: T, b: T): number {
    if (this.options.countComparisons) {
      this.comparisons++;
    }

    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /**
   * Creates a new array
   *
   * @param length - Array length
   * @returns New array
   */
  createArray(length: number): T[] {
    if (this.options.countCreations) {
      this.creations++;
    }

    return new Array(length);
  }

  /**
   * Gets the current operation counts
   */
  getCounts(): { comparisons: number; swaps: number; accesses: number; creations: number } {
    return {
      comparisons: this.comparisons,
      swaps: this.swaps,
      accesses: this.accesses,
      creations: this.creations,
    };
  }

  /**
   * Gets the underlying array
   */
  getArray(): T[] {
    return [...this.array];
  }

  /**
   * Gets the array length
   */
  get length(): number {
    return this.array.length;
  }

  /**
   * Resets the operation counters
   */
  reset(): void {
    this.comparisons = 0;
    this.swaps = 0;
    this.accesses = 0;
    this.creations = 0;
  }
}
