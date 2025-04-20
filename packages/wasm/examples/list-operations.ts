/**
 * Example demonstrating WebAssembly acceleration for list operations
 */
import { 
  getAccelerator, 
  isWebAssemblySupported, 
  benchmark, 
  formatBenchmarkResult 
} from '../src';

console.log('WebAssembly Acceleration Example');
console.log('===============================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a large array
console.log('\nCreating an array with 1 million elements...');
const size = 1000000;
const data = Array.from({ length: size }, (_, i) => i);
console.log(`Array size: ${data.length}`);

// Example 1: Map operation with WebAssembly acceleration
console.log('\nExample 1: Map operation with WebAssembly acceleration');
console.log('----------------------------------------------------');

// Get the accelerator for the map operation
const mapAccelerator = getAccelerator<number[], number[]>(
  'data-structures',
  'list',
  'map'
);

// Check if the accelerator is available
console.log(`Map accelerator available: ${mapAccelerator.isAvailable()}`);
console.log(`Estimated speedup: ${mapAccelerator.getPerformanceProfile().estimatedSpeedup}x`);

// Define the mapping function
const mapFn = (x: number) => x * 2;

// Benchmark JavaScript vs WebAssembly
const mapBenchmark = benchmark(
  (input: number[]) => input.map(mapFn),
  mapAccelerator,
  { data, fn: mapFn },
  { iterations: 5, warmupIterations: 2 }
);

console.log(formatBenchmarkResult(mapBenchmark));

// Example 2: Filter operation with WebAssembly acceleration
console.log('\nExample 2: Filter operation with WebAssembly acceleration');
console.log('------------------------------------------------------');

// Get the accelerator for the filter operation
const filterAccelerator = getAccelerator<number[], number[]>(
  'data-structures',
  'list',
  'filter'
);

// Check if the accelerator is available
console.log(`Filter accelerator available: ${filterAccelerator.isAvailable()}`);
console.log(`Estimated speedup: ${filterAccelerator.getPerformanceProfile().estimatedSpeedup}x`);

// Define the filter function
const filterFn = (x: number) => x % 2 === 0;

// Benchmark JavaScript vs WebAssembly
const filterBenchmark = benchmark(
  (input: number[]) => input.filter(filterFn),
  filterAccelerator,
  { data, fn: filterFn },
  { iterations: 5, warmupIterations: 2 }
);

console.log(formatBenchmarkResult(filterBenchmark));

// Example 3: Reduce operation with WebAssembly acceleration
console.log('\nExample 3: Reduce operation with WebAssembly acceleration');
console.log('------------------------------------------------------');

// Get the accelerator for the reduce operation
const reduceAccelerator = getAccelerator<number[], number>(
  'data-structures',
  'list',
  'reduce'
);

// Check if the accelerator is available
console.log(`Reduce accelerator available: ${reduceAccelerator.isAvailable()}`);
console.log(`Estimated speedup: ${reduceAccelerator.getPerformanceProfile().estimatedSpeedup}x`);

// Define the reduce function
const reduceFn = (acc: number, x: number) => acc + x;

// Benchmark JavaScript vs WebAssembly
const reduceBenchmark = benchmark(
  (input: number[]) => input.reduce(reduceFn, 0),
  reduceAccelerator,
  { data, fn: reduceFn, initial: 0 },
  { iterations: 5, warmupIterations: 2 }
);

console.log(formatBenchmarkResult(reduceBenchmark));

console.log('\nWebAssembly acceleration example completed.');
console.log('Note: This is a placeholder implementation. Actual WebAssembly acceleration will be implemented in future versions.');
