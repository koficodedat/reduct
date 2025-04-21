/**
 * Example demonstrating advanced WebAssembly-accelerated statistical operations
 */
import { NumericStatsAccelerator } from '../src/accelerators/data-structures/numeric-stats';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('Advanced WebAssembly-Accelerated Statistical Operations Example');
console.log('===========================================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a numeric stats accelerator
const statsAccelerator = new NumericStatsAccelerator();

// Create test data
console.log('\nCreating test data...');
const size = 1000000;
const x = Array.from({ length: size }, () => Math.random() * 100 - 50); // Random values between -50 and 50
const y = Array.from({ length: size }, (_, i) => x[i] * 2 + Math.random() * 10 - 5); // Correlated with x

// Basic statistics
console.log('\nBasic Statistics:');
console.log('-----------------');

console.time('Mean (JS)');
const mean = x.reduce((sum, val) => sum + val, 0) / x.length;
console.timeEnd('Mean (JS)');
console.log(`Mean: ${mean.toFixed(4)}`);

console.time('Standard Deviation (WASM)');
const stdDev = statsAccelerator.standardDeviation(x);
console.timeEnd('Standard Deviation (WASM)');
console.log(`Standard Deviation: ${stdDev.toFixed(4)}`);

console.time('Median (WASM)');
const median = statsAccelerator.median(x);
console.timeEnd('Median (WASM)');
console.log(`Median: ${median.toFixed(4)}`);

// Advanced statistics
console.log('\nAdvanced Statistics:');
console.log('-------------------');

console.time('Covariance (WASM)');
const covariance = statsAccelerator.covariance(x, y);
console.timeEnd('Covariance (WASM)');
console.log(`Covariance: ${covariance.toFixed(4)}`);

console.time('Correlation (WASM)');
const correlation = statsAccelerator.correlation(x, y);
console.timeEnd('Correlation (WASM)');
console.log(`Correlation: ${correlation.toFixed(4)}`);

console.time('Skewness (WASM)');
const skewness = statsAccelerator.skewness(x);
console.timeEnd('Skewness (WASM)');
console.log(`Skewness: ${skewness.toFixed(4)}`);

console.time('Kurtosis (WASM)');
const kurtosis = statsAccelerator.kurtosis(x);
console.timeEnd('Kurtosis (WASM)');
console.log(`Kurtosis: ${kurtosis.toFixed(4)}`);

// Percentiles and quantiles
console.log('\nPercentiles and Quantiles:');
console.log('-------------------------');

console.time('90th Percentile (WASM)');
const p90 = statsAccelerator.percentile(x, 90);
console.timeEnd('90th Percentile (WASM)');
console.log(`90th Percentile: ${p90.toFixed(4)}`);

console.time('Quantiles (WASM)');
const quantiles = statsAccelerator.quantiles(x, [0.25, 0.5, 0.75]);
console.timeEnd('Quantiles (WASM)');
console.log(`Quantiles (25%, 50%, 75%): ${quantiles.map(q => q.toFixed(4)).join(', ')}`);

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// Standard Deviation
console.time('Standard Deviation (JS)');
const mean2 = x.reduce((sum, val) => sum + val, 0) / x.length;
const variance = x.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / x.length;
const stdDevJs = Math.sqrt(variance);
console.timeEnd('Standard Deviation (JS)');
console.log(`Standard Deviation (JS): ${stdDevJs.toFixed(4)}`);
console.log(`Standard Deviation (WASM): ${stdDev.toFixed(4)}`);
console.log(`Difference: ${Math.abs(stdDev - stdDevJs).toFixed(8)}`);

// Median
console.time('Median (JS)');
const sortedX = [...x].sort((a, b) => a - b);
const medianJs = x.length % 2 === 0
  ? (sortedX[x.length / 2 - 1] + sortedX[x.length / 2]) / 2
  : sortedX[Math.floor(x.length / 2)];
console.timeEnd('Median (JS)');
console.log(`Median (JS): ${medianJs.toFixed(4)}`);
console.log(`Median (WASM): ${median.toFixed(4)}`);
console.log(`Difference: ${Math.abs(median - medianJs).toFixed(8)}`);

// Covariance
console.time('Covariance (JS)');
const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
let sumCov = 0;
for (let i = 0; i < x.length; i++) {
  sumCov += (x[i] - meanX) * (y[i] - meanY);
}
const covarianceJs = sumCov / x.length;
console.timeEnd('Covariance (JS)');
console.log(`Covariance (JS): ${covarianceJs.toFixed(4)}`);
console.log(`Covariance (WASM): ${covariance.toFixed(4)}`);
console.log(`Difference: ${Math.abs(covariance - covarianceJs).toFixed(8)}`);

console.log('\nAdvanced WebAssembly-accelerated statistical operations example completed.');
