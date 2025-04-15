/**
 * Operation complexity analysis tools
 *
 * Provides utilities for analyzing algorithm complexity
 * based on operation counts.
 *
 * @packageDocumentation
 */

import { ComplexityClass, OperationCounter } from './index';

/**
 * Result of an operation complexity analysis
 */
export interface OperationComplexityResult {
  /** Algorithm name */
  name: string;
  /** Operation counts for different input sizes */
  data: Array<{
    size: number;
    operations: {
      comparisons: number;
      swaps: number;
      accesses: number;
      creations: number;
      total: number;
    };
  }>;
  /** Estimated complexity class */
  estimatedClass: ComplexityClass;
  /** Goodness of fit (R² value) for the complexity model */
  fitQuality: number;
}

/**
 * Options for operation complexity analysis
 */
export interface OperationComplexityOptions {
  /** Minimum input size to test */
  minSize?: number;
  /** Maximum input size to test */
  maxSize?: number;
  /** Number of size steps to measure */
  steps?: number;
}

/**
 * Default operation complexity analysis options
 */
const defaultOptions: OperationComplexityOptions = {
  minSize: 100,
  maxSize: 10000,
  steps: 5,
};

/**
 * Analyzes the operation complexity of an algorithm
 *
 * @param name - Algorithm name
 * @param algorithm - Function to analyze
 * @param counterGenerator - Function to generate operation counter of given size
 * @param options - Analysis options
 * @returns Analysis results
 *
 * @example
 * ```typescript
 * const result = analyzeOperationComplexity(
 *   'QuickSort',
 *   counter => instrumentedQuickSort(counter),
 *   size => new OperationCounter(generateRandomArray(size))
 * );
 * ```
 */
export function analyzeOperationComplexity<T>(
  name: string,
  algorithm: (counter: OperationCounter<T>) => void | T[],
  counterGenerator: (size: number) => OperationCounter<T>,
  options: OperationComplexityOptions = {},
): OperationComplexityResult {
  const opts = { ...defaultOptions, ...options };

  if (!opts.minSize || !opts.maxSize || !opts.steps) {
    throw new Error('Invalid options: min/max size and steps must be defined');
  }

  const sizeStep = (opts.maxSize - opts.minSize) / (opts.steps - 1);
  const sizes = Array.from({ length: opts.steps }, (_, i) =>
    Math.floor(opts.minSize! + i * sizeStep),
  );

  const data: OperationComplexityResult['data'] = [];

  // Measure operation counts for each input size
  for (const size of sizes) {
    const counter = counterGenerator(size);
    counter.reset();

    algorithm(counter);

    const counts = counter.getCounts();
    data.push({
      size,
      operations: {
        ...counts,
        total: counts.comparisons + counts.swaps + counts.accesses + counts.creations,
      },
    });
  }

  // Analyze the complexity based on the operation data
  const totalOperations = data.map(d => ({ size: d.size, count: d.operations.total }));
  const result = estimateComplexityClass(totalOperations);

  return {
    name,
    data,
    estimatedClass: result.complexityClass,
    fitQuality: result.fitQuality,
  };
}

/**
 * Estimates the complexity class based on operation counts
 *
 * @param data - Operation count data with input sizes
 * @returns The estimated complexity class and fit quality
 * @internal
 */
function estimateComplexityClass(
  data: Array<{ size: number; count: number }>,
): { complexityClass: ComplexityClass; fitQuality: number } {
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
    results[className as ComplexityClass] = calculateRSquared(
      data.map(d => ({ x: d.size, y: d.count })),
      complexityFn,
    );
  }

  // Find the best fit model
  let bestFit = ComplexityClass.LINEAR;
  let bestFitQuality = results[ComplexityClass.LINEAR];

  for (const [className, r2] of Object.entries(results)) {
    if (r2 > bestFitQuality) {
      bestFit = className as ComplexityClass;
      bestFitQuality = r2;
    }
  }

  return { complexityClass: bestFit, fitQuality: bestFitQuality };
}

/**
 * Calculates the coefficient of determination (R²) to measure how well
 * the data fits the complexity model
 *
 * @param data - Data points
 * @param complexityFn - Complexity function to evaluate
 * @returns R² value (0-1) with 1 being a perfect fit
 * @internal
 */
function calculateRSquared(
  data: Array<{ x: number; y: number }>,
  complexityFn: (n: number) => number,
): number {
  // Normalize the complexity function values
  const xValues = data.map(d => complexityFn(d.x));
  const yValues = data.map(d => d.y);

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
 * Formats a complexity analysis result as a string report
 *
 * @param result - Complexity analysis result
 * @returns Formatted string with results
 */
export function formatComplexityReport(result: OperationComplexityResult): string {
  let output = `## ${result.name} Complexity Analysis\n\n`;
  output += `Estimated complexity: ${result.estimatedClass} (R² = ${result.fitQuality.toFixed(4)})\n\n`;

  output += '| Input Size | Comparisons | Swaps | Accesses | Creations | Total |\n';
  output += '|------------|-------------|-------|----------|-----------|-------|\n';

  for (const entry of result.data) {
    output += `| ${entry.size.toString().padStart(10)} | `;
    output += `${entry.operations.comparisons.toString().padStart(11)} | `;
    output += `${entry.operations.swaps.toString().padStart(5)} | `;
    output += `${entry.operations.accesses.toString().padStart(8)} | `;
    output += `${entry.operations.creations.toString().padStart(9)} | `;
    output += `${entry.operations.total.toString().padStart(5)} |\n`;
  }

  return output;
}
