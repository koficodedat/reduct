/**
 * Example demonstrating adaptive thresholds for WebAssembly acceleration
 */
import { NumericArrayAccelerator } from '../src/accelerators/data-structures/numeric';
import { AcceleratorTier } from '../src/accelerators/accelerator';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('Adaptive Thresholds Example');
console.log('==========================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a numeric array accelerator with adaptive thresholds
const numericAccelerator = new NumericArrayAccelerator({
  thresholds: {
    // Enable adaptive thresholds
    adaptive: true,
    // Initial thresholds
    minArraySize: 10000,
    // Configuration for adaptive thresholds
    adaptiveConfig: {
      // Maximum number of samples to keep
      maxSamples: 100,
      // Minimum number of samples required before adapting thresholds
      minSamplesForAdaptation: 5,
      // Minimum speedup required for HIGH_VALUE tier
      highValueMinSpeedup: 1.5,
      // Minimum speedup required for CONDITIONAL tier
      conditionalMinSpeedup: 1.1,
      // Safety margin to add to thresholds (percentage)
      safetyMargin: 0.1, // 10%
      // How frequently to adapt thresholds (in number of operations)
      adaptationFrequency: 10,
    },
  },
});

// Generate test data
console.log('\nGenerating test data...');

// Generate arrays of different sizes
const generateArray = (size: number): number[] => {
  const array = new Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = Math.random();
  }
  return array;
};

// Test arrays of different sizes
const sizes = [100, 1000, 5000, 10000, 20000, 50000, 100000];

// Run multiple iterations to allow adaptive thresholds to adjust
const iterations = 5;

console.log('\nRunning multiple iterations to allow adaptive thresholds to adjust...');

for (let iteration = 1; iteration <= iterations; iteration++) {
  console.log(`\nIteration ${iteration}:`);
  
  // Test map operation
  console.log('\nTesting map operation with different array sizes:');
  console.log('---------------------------------------------');
  
  for (const size of sizes) {
    // Generate a random array
    const array = generateArray(size);
    
    // Determine the tier
    const tier = numericAccelerator.determineTier(array);
    
    // Map the array and measure performance
    console.time(`Map ${size} elements (${tier})`);
    const mapped = numericAccelerator.map(array, x => x * 2);
    console.timeEnd(`Map ${size} elements (${tier})`);
    
    console.log(`Array size: ${size}, Tier: ${tier}, Result length: ${mapped.length}`);
  }
  
  // Get adaptive threshold statistics
  const adaptiveStats = numericAccelerator.getAdaptiveThresholdStats();
  
  if (adaptiveStats) {
    console.log('\nAdaptive Threshold Statistics:');
    console.log('----------------------------');
    console.log(`Sample count: ${adaptiveStats.sampleCount}`);
    console.log(`Average speedup: ${adaptiveStats.averageSpeedup.toFixed(2)}`);
    console.log(`HIGH_VALUE threshold: ${adaptiveStats.thresholds[AcceleratorTier.HIGH_VALUE].toFixed(0)}`);
    console.log(`CONDITIONAL threshold: ${adaptiveStats.thresholds[AcceleratorTier.CONDITIONAL].toFixed(0)}`);
  }
}

// Compare with fixed thresholds
console.log('\nComparing with fixed thresholds:');
console.log('-----------------------------');

// Create a numeric array accelerator with fixed thresholds
const fixedAccelerator = new NumericArrayAccelerator({
  thresholds: {
    minArraySize: 10000,
  },
});

// Generate a large array
const largeArray = generateArray(50000);

// Test with both accelerators
console.log('\nTesting with adaptive thresholds:');
console.time('Adaptive thresholds');
numericAccelerator.map(largeArray, x => x * 2);
console.timeEnd('Adaptive thresholds');

console.log('\nTesting with fixed thresholds:');
console.time('Fixed thresholds');
fixedAccelerator.map(largeArray, x => x * 2);
console.timeEnd('Fixed thresholds');

// Get performance statistics
console.log('\nPerformance Statistics:');
console.log('---------------------');

console.log('\nAdaptive thresholds:');
const adaptiveStats = numericAccelerator.getPerformanceStats();
console.log('Tier usage:');
for (const tier in adaptiveStats.tierUsage) {
  console.log(`  ${tier}: ${adaptiveStats.tierUsage[tier as AcceleratorTier]} times`);
}

console.log('\nFixed thresholds:');
const fixedStats = fixedAccelerator.getPerformanceStats();
console.log('Tier usage:');
for (const tier in fixedStats.tierUsage) {
  console.log(`  ${tier}: ${fixedStats.tierUsage[tier as AcceleratorTier]} times`);
}

console.log('\nAdaptive thresholds example completed.');
