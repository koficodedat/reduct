/**
 * Example demonstrating WebAssembly-accelerated time series analysis
 */
import { TimeSeriesAccelerator } from '../src/accelerators/data-structures/time-series';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated Time Series Analysis Example');
console.log('==================================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a time series accelerator
const timeSeriesAccelerator = new TimeSeriesAccelerator();

// Create test data
console.log('\nCreating test data...');
const size = 1000000;
const generateSineWave = (size: number, frequency: number, amplitude: number, noise: number): number[] => {
  return Array.from({ length: size }, (_, i) => {
    const t = i / size;
    const signal = amplitude * Math.sin(2 * Math.PI * frequency * t);
    const randomNoise = (Math.random() - 0.5) * 2 * noise;
    return signal + randomNoise;
  });
};

const data = generateSineWave(size, 5, 10, 2);
console.log(`Generated ${size} data points`);

// Add some outliers
const outlierIndices = [1000, 5000, 10000, 50000, 100000, 500000];
outlierIndices.forEach(index => {
  data[index] = data[index] * 10;
});
console.log(`Added outliers at indices: ${outlierIndices.join(', ')}`);

// Add some missing values (NaN)
const nanIndices = [2000, 6000, 20000, 60000, 200000, 600000];
nanIndices.forEach(index => {
  data[index] = NaN;
});
console.log(`Added missing values at indices: ${nanIndices.join(', ')}`);

// Simple Moving Average
console.log('\nSimple Moving Average:');
console.log('---------------------');
const windowSize = 100;
console.time('SMA (WASM)');
const sma = timeSeriesAccelerator.movingAverage(data, windowSize);
console.timeEnd('SMA (WASM)');
console.log(`SMA length: ${sma.length}`);
console.log(`SMA first 5 values: ${sma.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

// Exponential Moving Average
console.log('\nExponential Moving Average:');
console.log('--------------------------');
const alpha = 0.1;
console.time('EMA (WASM)');
const ema = timeSeriesAccelerator.exponentialMovingAverage(data, alpha);
console.timeEnd('EMA (WASM)');
console.log(`EMA length: ${ema.length}`);
console.log(`EMA first 5 values: ${ema.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

// Weighted Moving Average
console.log('\nWeighted Moving Average:');
console.log('-----------------------');
console.time('WMA (WASM)');
const wma = timeSeriesAccelerator.weightedMovingAverage(data, windowSize);
console.timeEnd('WMA (WASM)');
console.log(`WMA length: ${wma.length}`);
console.log(`WMA first 5 values: ${wma.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

// Outlier Detection
console.log('\nOutlier Detection:');
console.log('-----------------');
console.time('Outlier Detection (WASM)');
const outliers = timeSeriesAccelerator.detectOutliers(data, 3.0);
console.timeEnd('Outlier Detection (WASM)');
const detectedOutliers = outliers.reduce((indices, isOutlier, index) => {
  if (isOutlier) indices.push(index);
  return indices;
}, [] as number[]);
console.log(`Detected ${detectedOutliers.length} outliers`);
console.log(`First 10 outlier indices: ${detectedOutliers.slice(0, 10).join(', ')}`);

// Interpolate Missing Values
console.log('\nInterpolate Missing Values:');
console.log('-------------------------');
console.time('Interpolation (WASM)');
const interpolated = timeSeriesAccelerator.interpolateMissing(data);
console.timeEnd('Interpolation (WASM)');
console.log(`Interpolated length: ${interpolated.length}`);
console.log(`Original values at NaN indices: ${nanIndices.map(i => data[i])}`);
console.log(`Interpolated values at NaN indices: ${nanIndices.map(i => interpolated[i].toFixed(4))}`);

// Autocorrelation
console.log('\nAutocorrelation:');
console.log('---------------');
const lags = [1, 5, 10, 50, 100];
console.log('Autocorrelation at different lags:');
lags.forEach(lag => {
  console.time(`Autocorrelation lag ${lag} (WASM)`);
  const autocorr = timeSeriesAccelerator.autocorrelation(data, lag);
  console.timeEnd(`Autocorrelation lag ${lag} (WASM)`);
  console.log(`Lag ${lag}: ${autocorr.toFixed(4)}`);
});

// Compare with JavaScript implementations
console.log('\nComparison with JavaScript Implementations:');
console.log('----------------------------------------');

// Simple Moving Average
console.time('SMA (JS)');
const calculateMovingAverageJs = (array: number[], windowSize: number): number[] => {
  const result: number[] = [];
  let windowSum = 0;

  // Calculate the first window sum
  for (let i = 0; i < windowSize; i++) {
    windowSum += array[i];
  }

  // Add the first result
  result.push(windowSum / windowSize);

  // Calculate the rest of the moving averages using a sliding window
  for (let i = 1; i <= array.length - windowSize; i++) {
    windowSum = windowSum - array[i - 1] + array[i + windowSize - 1];
    result.push(windowSum / windowSize);
  }

  return result;
};
const smaJs = calculateMovingAverageJs(data, windowSize);
console.timeEnd('SMA (JS)');
console.log(`SMA (JS) length: ${smaJs.length}`);
console.log(`SMA (JS) first 5 values: ${smaJs.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

// Outlier Detection
console.time('Outlier Detection (JS)');
const detectOutliersJs = (array: number[], threshold: number): boolean[] => {
  // Calculate mean
  const mean = array.reduce((sum, value) => sum + value, 0) / array.length;

  // Calculate standard deviation
  const squaredDiffs = array.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / array.length;
  const stdDev = Math.sqrt(variance);

  // Detect outliers
  if (stdDev === 0) {
    // If standard deviation is 0, no outliers
    return array.map(() => false);
  } else {
    // Calculate Z-scores and detect outliers
    return array.map(value => {
      const zScore = Math.abs(value - mean) / stdDev;
      return zScore > threshold;
    });
  }
};
const outliersJs = detectOutliersJs(data, 3.0);
console.timeEnd('Outlier Detection (JS)');
const detectedOutliersJs = outliersJs.reduce((indices, isOutlier, index) => {
  if (isOutlier) indices.push(index);
  return indices;
}, [] as number[]);
console.log(`Detected ${detectedOutliersJs.length} outliers (JS)`);

console.log('\nWebAssembly-accelerated time series analysis example completed.');
