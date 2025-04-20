/**
 * Example demonstrating WebAssembly acceleration for statistical operations
 */
import { isWebAssemblySupported } from '../src/core/feature-detection';
import { NumericStatsAccelerator } from '../src/accelerators/data-structures/numeric-stats';

console.log('WebAssembly Statistical Operations Example');
console.log('=========================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a large array
console.log('\nCreating an array with 1 million elements...');
const size = 1000000;
const data = Array.from({ length: size }, () => Math.random() * 100);
console.log(`Array size: ${data.length}`);

// Create a second array for correlation
const data2 = Array.from({ length: size }, (_, i) => data[i] * 0.8 + Math.random() * 20);

// Create accelerator
const statsAccelerator = new NumericStatsAccelerator();

// Example 1: Median calculation
console.log('\nExample 1: Median calculation');
console.log('----------------------------');

// Measure JavaScript performance
console.time('JavaScript Median');
const jsMedian = calculateMedianJs(data);
console.timeEnd('JavaScript Median');

// Measure WebAssembly performance
console.time('WebAssembly Median');
const wasmMedian = statsAccelerator.median(data);
console.timeEnd('WebAssembly Median');

// Verify results
console.log(`JavaScript Median: ${jsMedian}`);
console.log(`WebAssembly Median: ${wasmMedian}`);

// Example 2: Standard Deviation calculation
console.log('\nExample 2: Standard Deviation calculation');
console.log('---------------------------------------');

// Measure JavaScript performance
console.time('JavaScript Standard Deviation');
const jsStdDev = calculateStdDevJs(data);
console.timeEnd('JavaScript Standard Deviation');

// Measure WebAssembly performance
console.time('WebAssembly Standard Deviation');
const wasmStdDev = statsAccelerator.standardDeviation(data);
console.timeEnd('WebAssembly Standard Deviation');

// Verify results
console.log(`JavaScript Standard Deviation: ${jsStdDev}`);
console.log(`WebAssembly Standard Deviation: ${wasmStdDev}`);

// Example 3: Correlation calculation
console.log('\nExample 3: Correlation calculation');
console.log('--------------------------------');

// Measure JavaScript performance
console.time('JavaScript Correlation');
const jsCorrelation = calculateCorrelationJs(data, data2);
console.timeEnd('JavaScript Correlation');

// Measure WebAssembly performance
console.time('WebAssembly Correlation');
const wasmCorrelation = statsAccelerator.correlation(data, data2);
console.timeEnd('WebAssembly Correlation');

// Verify results
console.log(`JavaScript Correlation: ${jsCorrelation}`);
console.log(`WebAssembly Correlation: ${wasmCorrelation}`);

// Example 4: Percentile calculation
console.log('\nExample 4: Percentile calculation');
console.log('--------------------------------');

// Measure JavaScript performance
console.time('JavaScript 90th Percentile');
const jsPercentile = calculatePercentileJs(data, 90);
console.timeEnd('JavaScript 90th Percentile');

// Measure WebAssembly performance
console.time('WebAssembly 90th Percentile');
const wasmPercentile = statsAccelerator.percentile(data, 90);
console.timeEnd('WebAssembly 90th Percentile');

// Verify results
console.log(`JavaScript 90th Percentile: ${jsPercentile}`);
console.log(`WebAssembly 90th Percentile: ${wasmPercentile}`);

console.log('\nWebAssembly statistical operations example completed.');

// JavaScript implementations for comparison

function calculateMedianJs(array: number[]): number {
  if (array.length === 0) {
    return NaN;
  }

  if (array.length === 1) {
    return array[0];
  }

  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

function calculateStdDevJs(array: number[]): number {
  if (array.length === 0) {
    return NaN;
  }

  if (array.length === 1) {
    return 0;
  }

  const mean = array.reduce((sum, value) => sum + value, 0) / array.length;
  const squaredDiffs = array.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / array.length;
  return Math.sqrt(variance);
}

function calculateCorrelationJs(x: number[], y: number[]): number {
  const length = Math.min(x.length, y.length);

  if (length === 0) {
    return NaN;
  }

  if (length === 1) {
    return 1;
  }

  const meanX = x.reduce((sum, value) => sum + value, 0) / length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / length;

  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < length; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    sumXY += diffX * diffY;
    sumX2 += diffX * diffX;
    sumY2 += diffY * diffY;
  }

  if (sumX2 === 0 || sumY2 === 0) {
    return 0;
  }

  return sumXY / (Math.sqrt(sumX2) * Math.sqrt(sumY2));
}

function calculatePercentileJs(array: number[], percentile: number): number {
  if (array.length === 0) {
    return NaN;
  }

  if (array.length === 1) {
    return array[0];
  }

  const p = Math.max(0, Math.min(100, percentile));
  const sorted = [...array].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
