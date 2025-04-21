/**
 * Example demonstrating the tiered optimization for numeric operations
 */
import { NumericArrayAccelerator } from '../src/accelerators/data-structures/numeric';
import { AcceleratorTier } from '../src/accelerators/accelerator';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('Tiered Numeric Operations Example');
console.log('================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a numeric array accelerator
const numericAccelerator = new NumericArrayAccelerator();

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
const sizes = [100, 1000, 10000, 50000, 100000];

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

// Test filter operation
console.log('\nTesting filter operation with different array sizes:');
console.log('------------------------------------------------');

for (const size of sizes) {
  // Generate a random array
  const array = generateArray(size);

  // Determine the tier
  const tier = numericAccelerator.determineTier(array);

  // Filter the array and measure performance
  console.time(`Filter ${size} elements (${tier})`);
  const filtered = numericAccelerator.filter(array, x => x > 0.5);
  console.timeEnd(`Filter ${size} elements (${tier})`);

  console.log(`Array size: ${size}, Tier: ${tier}, Result length: ${filtered.length}`);
}

// Test reduce operation
console.log('\nTesting reduce operation with different array sizes:');
console.log('------------------------------------------------');

for (const size of sizes) {
  // Generate a random array
  const array = generateArray(size);

  // Determine the tier
  const tier = numericAccelerator.determineTier(array);

  // Reduce the array and measure performance
  console.time(`Reduce ${size} elements (${tier})`);
  const sum = numericAccelerator.reduce(array, (acc, x) => acc + x, 0);
  console.timeEnd(`Reduce ${size} elements (${tier})`);

  console.log(`Array size: ${size}, Tier: ${tier}, Result: ${sum.toFixed(2)}`);
}

// Test sort operation
console.log('\nTesting sort operation with different array sizes:');
console.log('-----------------------------------------------');

for (const size of sizes) {
  // Generate a random array
  const array = generateArray(size);

  // Determine the tier
  const tier = numericAccelerator.determineTier(array);

  // Sort the array and measure performance
  console.time(`Sort ${size} elements (${tier})`);
  const sorted = numericAccelerator.sort(array);
  console.timeEnd(`Sort ${size} elements (${tier})`);

  console.log(`Array size: ${size}, Tier: ${tier}, Result length: ${sorted.length}`);
}

// Get performance statistics
console.log('\nPerformance Statistics:');
console.log('---------------------');
const stats = numericAccelerator.getPerformanceStats();

console.log('Tier usage:');
for (const tier in stats.tierUsage) {
  console.log(`  ${tier}: ${stats.tierUsage[tier as AcceleratorTier]} times`);
}

console.log('\nAverage execution time:');
for (const tier in stats.averageExecutionTime) {
  console.log(`  ${tier}: ${stats.averageExecutionTime[tier as AcceleratorTier].toFixed(3)} ms`);
}

console.log('\nInput size distribution:');
for (const tier in stats.inputSizeDistribution) {
  const sizes = stats.inputSizeDistribution[tier as AcceleratorTier];
  if (sizes.length > 0) {
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    const avg = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    console.log(`  ${tier}: min=${min}, max=${max}, avg=${avg.toFixed(2)}`);
  } else {
    console.log(`  ${tier}: No data`);
  }
}

// Compare with manual tier selection
console.log('\nComparing with manual tier selection:');
console.log('----------------------------------');

// Generate a large array
const largeArray = generateArray(50000);

// Test with different tiers
const tiers = [
  AcceleratorTier.HIGH_VALUE,
  AcceleratorTier.CONDITIONAL,
  AcceleratorTier.JS_PREFERRED,
];

for (const tier of tiers) {
  console.log(`\nTesting with tier: ${tier}`);

  // Create a custom numeric accelerator with fixed tier
  const fixedTierAccelerator = new NumericArrayAccelerator();

  // Override the determineTier method
  fixedTierAccelerator.determineTier = () => tier;

  // Map the array and measure performance
  console.time(`Map with ${tier}`);
  fixedTierAccelerator.map(largeArray, x => x * 2);
  console.timeEnd(`Map with ${tier}`);

  // Filter the array and measure performance
  console.time(`Filter with ${tier}`);
  fixedTierAccelerator.filter(largeArray, x => x > 0.5);
  console.timeEnd(`Filter with ${tier}`);

  // Reduce the array and measure performance
  console.time(`Reduce with ${tier}`);
  fixedTierAccelerator.reduce(largeArray, (acc, x) => acc + x, 0);
  console.timeEnd(`Reduce with ${tier}`);

  // Sort the array and measure performance
  console.time(`Sort with ${tier}`);
  fixedTierAccelerator.sort(largeArray);
  console.timeEnd(`Sort with ${tier}`);
}

console.log('\nTiered numeric operations example completed.');
