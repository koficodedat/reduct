/**
 * MapFilterReduce Benchmark
 *
 * Compares the performance of the specialized mapFilterReduce operation
 * against separate map, filter, and reduce operations.
 */

import { List } from '@reduct/data-structures';
import { performance } from 'perf_hooks';

// Create test data
const size = 10000;
const data = Array.from({ length: size }, () => Math.floor(Math.random() * 1000));

// Create instances
const list = List.from(data);
const array = [...data];

// Benchmark functions
const mapFn = (x: number): number => x * 2;
const filterFn = (x: number): boolean => x % 3 === 0;
const reduceFn = (acc: number, x: number): number => acc + x;
const initialValue = 0;

// Number of iterations
const iterations = 1000;

// Run benchmarks
console.log(`\nBenchmarking with collection size: ${size}, iterations: ${iterations}\n`);

// Benchmark List.mapFilterReduce
console.log('List.mapFilterReduce:');
let listResult = 0;
const listStart = performance.now();
for (let i = 0; i < iterations; i++) {
  listResult = list.mapFilterReduce(mapFn, filterFn, reduceFn, initialValue);
}
const listEnd = performance.now();
const listTime = listEnd - listStart;
console.log(`  Time: ${listTime.toFixed(2)}ms`);
console.log(`  Result: ${listResult}`);
console.log(`  Ops/sec: ${Math.floor(iterations / (listTime / 1000))}`);

// Benchmark Native Array (separate operations)
console.log('\nNative Array (separate operations):');
let arrayResult = 0;
const arrayStart = performance.now();
for (let i = 0; i < iterations; i++) {
  arrayResult = array
    .map(mapFn)
    .filter(filterFn)
    .reduce(reduceFn, initialValue);
}
const arrayEnd = performance.now();
const arrayTime = arrayEnd - arrayStart;
console.log(`  Time: ${arrayTime.toFixed(2)}ms`);
console.log(`  Result: ${arrayResult}`);
console.log(`  Ops/sec: ${Math.floor(iterations / (arrayTime / 1000))}`);

// Benchmark Native Array (single pass)
console.log('\nNative Array (single pass):');
let singlePassResult = 0;
const singlePassStart = performance.now();
for (let i = 0; i < iterations; i++) {
  let result = initialValue;
  let filteredIndex = 0;
  
  for (let j = 0; j < array.length; j++) {
    const mappedValue = mapFn(array[j]);
    if (filterFn(mappedValue)) {
      result = reduceFn(result, mappedValue);
      filteredIndex++;
    }
  }
  
  singlePassResult = result;
}
const singlePassEnd = performance.now();
const singlePassTime = singlePassEnd - singlePassStart;
console.log(`  Time: ${singlePassTime.toFixed(2)}ms`);
console.log(`  Result: ${singlePassResult}`);
console.log(`  Ops/sec: ${Math.floor(iterations / (singlePassTime / 1000))}`);

// Compare results
console.log('\nComparison:');
console.log(`  List.mapFilterReduce vs Native Array (separate): ${(arrayTime / listTime).toFixed(2)}x ${arrayTime > listTime ? 'faster' : 'slower'}`);
console.log(`  List.mapFilterReduce vs Native Array (single pass): ${(singlePassTime / listTime).toFixed(2)}x ${singlePassTime > listTime ? 'faster' : 'slower'}`);
