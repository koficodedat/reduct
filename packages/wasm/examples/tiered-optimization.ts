/**
 * Example demonstrating the tiered optimization framework
 */
import { TieredSortAccelerator, SortInput } from '../src/accelerators/data-structures/tiered-sort';
import { AcceleratorTier } from '../src/accelerators/accelerator';
import { findOptimalThreshold, visualizeThreshold } from '../src/utils/threshold-finder';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('Tiered Optimization Framework Example');
console.log('====================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a tiered sort accelerator
const sortAccelerator = new TieredSortAccelerator();

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

console.log('\nTesting sort performance with different array sizes:');
console.log('--------------------------------------------------');

for (const size of sizes) {
  // Generate a random array
  const array = generateArray(size);
  
  // Create the input
  const input: SortInput<number> = { array };
  
  // Determine the tier
  const tier = sortAccelerator.determineTier(input);
  
  // Sort the array and measure performance
  console.time(`Sort ${size} elements (${tier})`);
  const sorted = sortAccelerator.execute(input);
  console.timeEnd(`Sort ${size} elements (${tier})`);
  
  console.log(`Array size: ${size}, Tier: ${tier}, Result length: ${sorted.length}`);
}

// Get performance statistics
console.log('\nPerformance Statistics:');
console.log('---------------------');
const stats = sortAccelerator.getPerformanceStats();

console.log('Tier usage:');
for (const tier in stats.tierUsage) {
  console.log(`  ${tier}: ${stats.tierUsage[tier as AcceleratorTier]} times`);
}

console.log('\nAverage execution time:');
for (const tier in stats.averageExecutionTime) {
  console.log(`  ${tier}: ${stats.averageExecutionTime[tier as AcceleratorTier].toFixed(3)} ms`);
}

// Find the optimal threshold
console.log('\nFinding optimal threshold...');
console.log('-------------------------');

// JavaScript implementation
const jsSortImplementation = (input: SortInput<number>): number[] => {
  const { array, compareFn } = input;
  const result = [...array];
  
  if (compareFn) {
    result.sort(compareFn);
  } else {
    result.sort();
  }
  
  return result;
};

// Find the optimal threshold
findOptimalThreshold(
  jsSortImplementation,
  sortAccelerator,
  (size: number) => ({ array: generateArray(size) }),
  [100, 100000],
  10
).then(result => {
  console.log(`Optimal threshold: ${result.threshold}`);
  console.log(`Crossover point: ${result.crossoverPoint !== null ? result.crossoverPoint.toFixed(2) : 'N/A'}`);
  
  console.log('\nPerformance data:');
  console.log('----------------');
  console.log('Size\tJS Time\tWASM Time\tSpeedup');
  for (const data of result.performanceData) {
    console.log(`${data.size}\t${data.jsTime.toFixed(3)}\t${data.wasmTime.toFixed(3)}\t${data.speedup.toFixed(3)}`);
  }
  
  // Visualize the threshold
  console.log('\nThreshold Visualization:');
  console.log('----------------------');
  console.log(visualizeThreshold(result));
  
  console.log('\nTiered optimization example completed.');
});

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
  
  // Create a custom sort accelerator with fixed tier
  class FixedTierSortAccelerator extends TieredSortAccelerator<number> {
    public determineTier(): AcceleratorTier {
      return tier;
    }
  }
  
  const fixedTierAccelerator = new FixedTierSortAccelerator();
  
  // Sort the array and measure performance
  console.time(`Sort with ${tier}`);
  fixedTierAccelerator.execute({ array: largeArray });
  console.timeEnd(`Sort with ${tier}`);
}
