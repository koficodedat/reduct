/**
 * Statistical analysis utilities for benchmark results
 *
 * @packageDocumentation
 */

import { BenchmarkResult, BenchmarkComparison, ScalabilityResult } from '../types';

/**
 * Statistical metrics for a set of values
 */
export interface StatisticalMetrics {
  /** Mean (average) value */
  mean: number;
  /** Median value */
  median: number;
  /** Standard deviation */
  stdDev: number;
  /** Variance */
  variance: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Range (max - min) */
  range: number;
  /** Interquartile range */
  iqr: number;
  /** First quartile (25th percentile) */
  q1: number;
  /** Third quartile (75th percentile) */
  q3: number;
  /** Confidence interval (95%) - lower bound */
  ciLower: number;
  /** Confidence interval (95%) - upper bound */
  ciUpper: number;
  /** Number of samples */
  sampleSize: number;
  /** Outliers */
  outliers: number[];
}

/**
 * Statistical analysis options
 */
export interface StatisticalAnalysisOptions {
  /** Confidence level for confidence intervals (default: 0.95) */
  confidenceLevel?: number;
  /** Method for outlier detection (default: 'iqr') */
  outlierDetectionMethod?: 'iqr' | 'zscore';
  /** Threshold for outlier detection (default: 1.5 for IQR, 2 for Z-score) */
  outlierThreshold?: number;
}

/**
 * Default options for statistical analysis
 */
const defaultOptions: Required<StatisticalAnalysisOptions> = {
  confidenceLevel: 0.95,
  outlierDetectionMethod: 'iqr',
  outlierThreshold: 1.5
};

/**
 * Calculate the mean of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Mean value
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the median of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

/**
 * Calculate the variance of an array of numbers
 *
 * @param values - Array of numbers
 * @param mean - Mean value (optional, will be calculated if not provided)
 * @returns Variance
 */
export function calculateVariance(values: number[], mean?: number): number {
  if (values.length <= 1) return 0;

  const avg = mean !== undefined ? mean : calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  return squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1);
}

/**
 * Calculate the standard deviation of an array of numbers
 *
 * @param values - Array of numbers
 * @param variance - Variance (optional, will be calculated if not provided)
 * @returns Standard deviation
 */
export function calculateStdDev(values: number[], variance?: number): number {
  if (values.length <= 1) return 0;

  const var_ = variance !== undefined ? variance : calculateVariance(values);
  return Math.sqrt(var_);
}

/**
 * Calculate the quartiles of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Object with q1 (25th percentile) and q3 (75th percentile)
 */
export function calculateQuartiles(values: number[]): { q1: number, q3: number } {
  if (values.length === 0) return { q1: 0, q3: 0 };

  const sorted = [...values].sort((a, b) => a - b);

  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);

  return {
    q1: sorted[q1Index],
    q3: sorted[q3Index]
  };
}

/**
 * Calculate the interquartile range (IQR) of an array of numbers
 *
 * @param values - Array of numbers
 * @param quartiles - Quartiles (optional, will be calculated if not provided)
 * @returns Interquartile range
 */
export function calculateIQR(values: number[], quartiles?: { q1: number, q3: number }): number {
  if (values.length === 0) return 0;

  const q = quartiles || calculateQuartiles(values);
  return q.q3 - q.q1;
}

/**
 * Detect outliers in an array of numbers using the IQR method
 *
 * @param values - Array of numbers
 * @param threshold - Threshold for outlier detection (default: 1.5)
 * @returns Array of outliers
 */
export function detectOutliersIQR(values: number[], threshold: number = 1.5): number[] {
  if (values.length === 0) return [];

  const quartiles = calculateQuartiles(values);
  const iqr = calculateIQR(values, quartiles);

  const lowerBound = quartiles.q1 - threshold * iqr;
  const upperBound = quartiles.q3 + threshold * iqr;

  return values.filter(val => val < lowerBound || val > upperBound);
}

/**
 * Detect outliers in an array of numbers using the Z-score method
 *
 * @param values - Array of numbers
 * @param threshold - Threshold for outlier detection (default: 2)
 * @returns Array of outliers
 */
export function detectOutliersZScore(values: number[], threshold: number = 2): number[] {
  if (values.length === 0) return [];

  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  if (stdDev === 0) return [];

  return values.filter(val => Math.abs((val - mean) / stdDev) > threshold);
}

/**
 * Calculate the confidence interval for a set of values
 *
 * @param values - Array of numbers
 * @param confidenceLevel - Confidence level (default: 0.95)
 * @param mean - Mean value (optional, will be calculated if not provided)
 * @param stdDev - Standard deviation (optional, will be calculated if not provided)
 * @returns Object with lower and upper bounds of the confidence interval
 */
export function calculateConfidenceInterval(
  values: number[],
  _confidenceLevel: number = 0.95,
  mean?: number,
  stdDev?: number
): { lower: number, upper: number } {
  if (values.length <= 1) return { lower: 0, upper: 0 };

  const avg = mean !== undefined ? mean : calculateMean(values);
  const sd = stdDev !== undefined ? stdDev : calculateStdDev(values);

  // For 95% confidence level, use 1.96 (normal distribution)
  // For other confidence levels, we'd need to use the appropriate z-score
  const z = 1.96;
  const marginOfError = z * (sd / Math.sqrt(values.length));

  return {
    lower: avg - marginOfError,
    upper: avg + marginOfError
  };
}

/**
 * Calculate statistical metrics for an array of numbers
 *
 * @param values - Array of numbers
 * @param options - Statistical analysis options
 * @returns Statistical metrics
 */
export function calculateStatistics(
  values: number[],
  options?: StatisticalAnalysisOptions
): StatisticalMetrics {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      range: 0,
      iqr: 0,
      q1: 0,
      q3: 0,
      ciLower: 0,
      ciUpper: 0,
      sampleSize: 0,
      outliers: []
    };
  }

  const opts = { ...defaultOptions, ...options };

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  const mean = calculateMean(values);
  const median = calculateMedian(values);
  const variance = calculateVariance(values, mean);
  const stdDev = Math.sqrt(variance);

  const quartiles = calculateQuartiles(values);
  const iqr = quartiles.q3 - quartiles.q1;

  const ci = calculateConfidenceInterval(values, opts.confidenceLevel, mean, stdDev);

  let outliers: number[];
  if (opts.outlierDetectionMethod === 'iqr') {
    outliers = detectOutliersIQR(values, opts.outlierThreshold);
  } else {
    outliers = detectOutliersZScore(values, opts.outlierThreshold);
  }

  return {
    mean,
    median,
    stdDev,
    variance,
    min,
    max,
    range,
    iqr,
    q1: quartiles.q1,
    q3: quartiles.q3,
    ciLower: ci.lower,
    ciUpper: ci.upper,
    sampleSize: values.length,
    outliers
  };
}

/**
 * Analyze benchmark results statistically
 *
 * @param results - Array of benchmark results
 * @param options - Statistical analysis options
 * @returns Object with statistical metrics for each result
 */
export function analyzeBenchmarkResults(
  results: BenchmarkResult[],
  options?: StatisticalAnalysisOptions
): Record<string, StatisticalMetrics> {
  const metrics: Record<string, StatisticalMetrics> = {};

  // Group results by name and operation
  const groupedResults: Record<string, BenchmarkResult[]> = {};

  for (const result of results) {
    const key = `${result.name}-${result.operation}`;
    if (!groupedResults[key]) {
      groupedResults[key] = [];
    }
    groupedResults[key].push(result);
  }

  // Calculate statistics for each group
  for (const [key, group] of Object.entries(groupedResults)) {
    const timesMs = group.map(r => r.timeMs);
    metrics[key] = calculateStatistics(timesMs, options);
  }

  return metrics;
}

/**
 * Analyze benchmark comparison statistically
 *
 * @param comparison - Benchmark comparison
 * @param options - Statistical analysis options
 * @returns Object with statistical metrics for each implementation
 */
export function analyzeBenchmarkComparison(
  comparison: BenchmarkComparison,
  options?: StatisticalAnalysisOptions
): Record<string, StatisticalMetrics> {
  const metrics: Record<string, StatisticalMetrics> = {};

  // Group results by implementation
  const groupedResults: Record<string, number[]> = {};

  for (const result of comparison.results) {
    if (!groupedResults[result.implementation]) {
      groupedResults[result.implementation] = [];
    }
    groupedResults[result.implementation].push(result.timeMs);
  }

  // Calculate statistics for each implementation
  for (const [impl, times] of Object.entries(groupedResults)) {
    metrics[impl] = calculateStatistics(times, options);
  }

  return metrics;
}

/**
 * Analyze scalability result statistically
 *
 * @param scalability - Scalability result
 * @param options - Statistical analysis options
 * @returns Object with statistical metrics for each input size
 */
export function analyzeScalabilityResult(
  scalability: ScalabilityResult,
  options?: StatisticalAnalysisOptions
): Record<number, StatisticalMetrics> {
  const metrics: Record<number, StatisticalMetrics> = {};

  // Group results by input size
  const groupedResults: Record<number, number[]> = {};

  for (const result of scalability.results) {
    if (!groupedResults[result.inputSize]) {
      groupedResults[result.inputSize] = [];
    }
    groupedResults[result.inputSize].push(result.timeMs);
  }

  // Calculate statistics for each input size
  for (const [sizeStr, times] of Object.entries(groupedResults)) {
    const size = parseInt(sizeStr, 10);
    metrics[size] = calculateStatistics(times, options);
  }

  return metrics;
}

/**
 * Format statistical metrics as a string
 *
 * @param metrics - Statistical metrics
 * @param precision - Number of decimal places (default: 4)
 * @returns Formatted string
 */
export function formatStatisticalMetrics(
  metrics: StatisticalMetrics,
  precision: number = 4
): string {
  const format = (num: number) => num.toFixed(precision);

  let output = 'Statistical Analysis:\n';
  output += `  Mean: ${format(metrics.mean)} ms\n`;
  output += `  Median: ${format(metrics.median)} ms\n`;
  output += `  Std Dev: ${format(metrics.stdDev)} ms\n`;
  output += `  Min: ${format(metrics.min)} ms\n`;
  output += `  Max: ${format(metrics.max)} ms\n`;
  output += `  Range: ${format(metrics.range)} ms\n`;
  output += `  95% CI: [${format(metrics.ciLower)}, ${format(metrics.ciUpper)}] ms\n`;

  if (metrics.outliers.length > 0) {
    output += `  Outliers: ${metrics.outliers.map(o => format(o)).join(', ')} ms\n`;
  } else {
    output += '  Outliers: None\n';
  }

  return output;
}

/**
 * Format statistical analysis of benchmark results as a string
 *
 * @param analysis - Statistical analysis results
 * @param precision - Number of decimal places (default: 4)
 * @returns Formatted string
 */
export function formatStatisticalAnalysis(
  analysis: Record<string, StatisticalMetrics>,
  precision: number = 4
): string {
  let output = '';

  for (const [key, metrics] of Object.entries(analysis)) {
    output += `${key}:\n`;
    output += formatStatisticalMetrics(metrics, precision);
    output += '\n';
  }

  return output;
}
