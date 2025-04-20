/**
 * Example demonstrating additional performance optimizations
 */

import { List } from '@reduct/data-structures';

console.log('Additional Performance Optimizations Example');
console.log('-------------------------------------------');

// Create a large list for testing
const size = 10000;
console.log(`Creating a list with ${size} elements...`);
const list = List.of(size, (i: number) => i);

// Measure performance of standard operations
console.log('\n1. Standard Operations:');

// Map operation
console.time('Standard map');
list.map((x: number) => x * 2);
console.timeEnd('Standard map');

// Filter operation
console.time('Standard filter');
list.filter((x: number) => x % 2 === 0);
console.timeEnd('Standard filter');

// Reduce operation
console.time('Standard reduce');
list.reduce((acc: number, x: number) => acc + x, 0);
console.timeEnd('Standard reduce');

// Map and filter operations
console.time('Map then filter');
list.map((x: number) => x * 2).filter((x: number) => x % 4 === 0);
console.timeEnd('Map then filter');

// Filter and map operations
console.time('Filter then map');
list.filter((x: number) => x % 2 === 0).map((x: number) => x * 2);
console.timeEnd('Filter then map');

// Measure performance of combined operations
console.log('\n2. Combined Operations:');

// Combined map and filter in a single pass
console.time('Combined map and filter');
const result1 = list.toArray().reduce((acc: number[], x: number) => {
  const mapped = x * 2;
  if (mapped % 4 === 0) {
    acc.push(mapped);
  }
  return acc;
}, []);
List.from(result1);
console.timeEnd('Combined map and filter');

// Combined filter and map in a single pass
console.time('Combined filter and map');
const result2 = list.toArray().reduce((acc: number[], x: number) => {
  if (x % 2 === 0) {
    acc.push(x * 2);
  }
  return acc;
}, []);
List.from(result2);
console.timeEnd('Combined filter and map');

// Combined map, filter, and reduce in a single pass
console.time('Combined map, filter, and reduce');
list.toArray().reduce((acc: number, x: number) => {
  const mapped = x * 2;
  if (mapped % 4 === 0) {
    return acc + mapped;
  }
  return acc;
}, 0);
console.timeEnd('Combined map, filter, and reduce');

// Measure performance of specialized operations
console.log('\n3. Specialized Operations:');

// Create a list of numbers
const numbers = List.from(Array.from({ length: 10000 }, (_, i) => i));

// Sum operation
console.time('Manual sum');
let manualSum = 0;
for (let i = 0; i < numbers.size; i++) {
  manualSum += numbers.get(i) || 0;
}
console.timeEnd('Manual sum');

// Optimized sum operation
console.time('Optimized sum');
numbers.reduce((acc: number, x: number) => acc + x, 0);
console.timeEnd('Optimized sum');

// Min operation
console.time('Manual min');
let manualMin = Infinity;
for (let i = 0; i < numbers.size; i++) {
  const value = numbers.get(i);
  if (value !== undefined && value < manualMin) {
    manualMin = value;
  }
}
console.timeEnd('Manual min');

// Optimized min operation
console.time('Optimized min');
Math.min(...numbers.toArray());
console.timeEnd('Optimized min');

// Max operation
console.time('Manual max');
let manualMax = -Infinity;
for (let i = 0; i < numbers.size; i++) {
  const value = numbers.get(i);
  if (value !== undefined && value > manualMax) {
    manualMax = value;
  }
}
console.timeEnd('Manual max');

// Optimized max operation
console.time('Optimized max');
Math.max(...numbers.toArray());
console.timeEnd('Optimized max');

// Measure performance of batch operations
console.log('\n4. Batch Operations:');

// Create a list for batch operations
const batchList = List.from(Array.from({ length: 1000 }, (_, i) => i));

// Batch update
console.time('Multiple set operations');
let multiSetList = batchList;
for (let i = 0; i < 100; i++) {
  const index = Math.floor(Math.random() * batchList.size);
  multiSetList = multiSetList.set(index, index * 10);
}
console.timeEnd('Multiple set operations');

// Optimized batch update
console.time('Optimized batch update');
const updates: [number, number][] = [];
for (let i = 0; i < 100; i++) {
  const index = Math.floor(Math.random() * batchList.size);
  updates.push([index, index * 10]);
}
const updatedArray = [...batchList.toArray()];
for (const [index, value] of updates) {
  updatedArray[index] = value;
}
List.from(updatedArray);
console.timeEnd('Optimized batch update');

// Summary of optimizations
console.log('\n5. Summary of Optimizations:');
console.log('- Memory pooling for frequently allocated structures');
console.log('- Result caching for expensive operations');
console.log('- Operation fusion for common patterns');
console.log('- Specialized implementations for different data types');
console.log('- Batch operations for multiple updates');
console.log('- Adaptive implementation selection based on usage patterns');
console.log('- Runtime profiling to automatically select optimal algorithms');
