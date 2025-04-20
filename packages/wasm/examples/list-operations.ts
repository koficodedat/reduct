/**
 * Example demonstrating WebAssembly acceleration for list operations
 */
import { isWebAssemblySupported } from '../src/core/feature-detection';
import { ListAccelerator } from '../src/accelerators/data-structures/list-accelerator';
import { NumericArrayAccelerator } from '../src/accelerators/data-structures/numeric';

console.log('WebAssembly Acceleration Example');
console.log('===============================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a large array
console.log('\nCreating an array with 1 million elements...');
const size = 1000000;
const data = Array.from({ length: size }, (_, i) => i);
console.log(`Array size: ${data.length}`);

// Create accelerators
const listAccelerator = new ListAccelerator();
const numericAccelerator = new NumericArrayAccelerator();

// Example 1: Map operation with WebAssembly acceleration
console.log('\nExample 1: Map operation with WebAssembly acceleration');
console.log('----------------------------------------------------');

// Check if the accelerator is available
console.log(`List accelerator available: ${listAccelerator.isAvailable()}`);
console.log(`Estimated speedup: ${listAccelerator.getPerformanceProfile().estimatedSpeedup}x`);

// Define the mapping function
const mapFn = (x: number) => x * 2;

// Measure JavaScript performance
console.time('JavaScript Map');
const jsMapResult = data.map(mapFn);
console.timeEnd('JavaScript Map');

// Measure WebAssembly performance
console.time('WebAssembly List Map');
const wasmListMapResult = listAccelerator.map(data, mapFn);
console.timeEnd('WebAssembly List Map');

// Measure WebAssembly numeric performance
console.time('WebAssembly Numeric Map');
const wasmNumericMapResult = numericAccelerator.map(data, mapFn);
console.timeEnd('WebAssembly Numeric Map');

// Verify results
console.log(`JavaScript Map result length: ${jsMapResult.length}`);
console.log(`WebAssembly List Map result length: ${wasmListMapResult.length}`);
console.log(`WebAssembly Numeric Map result length: ${wasmNumericMapResult.length}`);

// Example 2: Filter operation with WebAssembly acceleration
console.log('\nExample 2: Filter operation with WebAssembly acceleration');
console.log('------------------------------------------------------');

// Define the filter function
const filterFn = (x: number) => x % 2 === 0;

// Measure JavaScript performance
console.time('JavaScript Filter');
const jsFilterResult = data.filter(filterFn);
console.timeEnd('JavaScript Filter');

// Measure WebAssembly performance
console.time('WebAssembly List Filter');
const wasmListFilterResult = listAccelerator.filter(data, filterFn);
console.timeEnd('WebAssembly List Filter');

// Measure WebAssembly numeric performance
console.time('WebAssembly Numeric Filter');
const wasmNumericFilterResult = numericAccelerator.filter(data, filterFn);
console.timeEnd('WebAssembly Numeric Filter');

// Verify results
console.log(`JavaScript Filter result length: ${jsFilterResult.length}`);
console.log(`WebAssembly List Filter result length: ${wasmListFilterResult.length}`);
console.log(`WebAssembly Numeric Filter result length: ${wasmNumericFilterResult.length}`);

// Example 3: Reduce operation with WebAssembly acceleration
console.log('\nExample 3: Reduce operation with WebAssembly acceleration');
console.log('------------------------------------------------------');

// Define the reduce function
const reduceFn = (acc: number, x: number) => acc + x;

// Measure JavaScript performance
console.time('JavaScript Reduce');
const jsReduceResult = data.reduce(reduceFn, 0);
console.timeEnd('JavaScript Reduce');

// Measure WebAssembly performance
console.time('WebAssembly List Reduce');
const wasmListReduceResult = listAccelerator.reduce(data, reduceFn, 0);
console.timeEnd('WebAssembly List Reduce');

// Measure WebAssembly numeric sum performance
console.time('WebAssembly Numeric Sum');
const wasmNumericSumResult = numericAccelerator.sum(data);
console.timeEnd('WebAssembly Numeric Sum');

// Verify results
console.log(`JavaScript Reduce result: ${jsReduceResult}`);
console.log(`WebAssembly List Reduce result: ${wasmListReduceResult}`);
console.log(`WebAssembly Numeric Sum result: ${wasmNumericSumResult}`);

// Example 4: Sort operation with WebAssembly acceleration
console.log('\nExample 4: Sort operation with WebAssembly acceleration');
console.log('------------------------------------------------------');

// Create a reversed array for sorting
const reversedData = [...data].reverse();

// Measure JavaScript performance
console.time('JavaScript Sort');
const jsSortResult = [...reversedData].sort((a, b) => a - b);
console.timeEnd('JavaScript Sort');

// Measure WebAssembly performance
console.time('WebAssembly List Sort');
const wasmListSortResult = listAccelerator.sort([...reversedData], (a, b) => a - b);
console.timeEnd('WebAssembly List Sort');

// Measure WebAssembly numeric performance
console.time('WebAssembly Numeric Sort');
const wasmNumericSortResult = numericAccelerator.sort([...reversedData]);
console.timeEnd('WebAssembly Numeric Sort');

// Verify results
console.log(`JavaScript Sort first 5 elements: ${jsSortResult.slice(0, 5)}`);
console.log(`WebAssembly List Sort first 5 elements: ${wasmListSortResult.slice(0, 5)}`);
console.log(`WebAssembly Numeric Sort first 5 elements: ${wasmNumericSortResult.slice(0, 5)}`);

// Example 5: Map-Filter operation with WebAssembly acceleration
console.log('\nExample 5: Map-Filter operation with WebAssembly acceleration');
console.log('----------------------------------------------------------');

// Measure JavaScript performance
console.time('JavaScript Map-Filter');
const jsMapFilterResult = data.map(mapFn).filter(filterFn);
console.timeEnd('JavaScript Map-Filter');

// Measure WebAssembly performance
console.time('WebAssembly List Map-Filter');
const wasmListMapFilterResult = listAccelerator.mapFilter(data, mapFn, filterFn);
console.timeEnd('WebAssembly List Map-Filter');

// Measure WebAssembly numeric performance
console.time('WebAssembly Numeric Map-Filter');
const wasmNumericMapFilterResult = numericAccelerator.mapFilter(data, mapFn, filterFn);
console.timeEnd('WebAssembly Numeric Map-Filter');

// Verify results
console.log(`JavaScript Map-Filter result length: ${jsMapFilterResult.length}`);
console.log(`WebAssembly List Map-Filter result length: ${wasmListMapFilterResult.length}`);
console.log(`WebAssembly Numeric Map-Filter result length: ${wasmNumericMapFilterResult.length}`);

console.log('\nWebAssembly acceleration example completed.');
