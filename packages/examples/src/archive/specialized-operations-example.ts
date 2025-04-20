/**
 * Example demonstrating specialized batch operations in the Reduct library
 */

import { List } from '@reduct/data-structures';

console.log('Specialized Batch Operations Example');
console.log('===================================');

// Create a list with 1 million elements
console.log('\nCreating a list with 1 million elements...');
const size = 1000000;
const list = List.of(size, i => i);
console.log(`List size: ${list.size}`);

// Example 1: mapFilter vs map+filter
console.log('\nExample 1: mapFilter vs map+filter');
console.log('----------------------------------');

// Define operations
const mapFn = (x: number) => x * 2;
const filterFn = (x: number) => x % 3 === 0;

// Measure time for separate operations
console.time('map+filter');
const separateResult = list
  .map(mapFn)
  .filter(filterFn);
console.timeEnd('map+filter');

// Measure time for combined operation
console.time('mapFilter');
const combinedResult = list.mapFilter(mapFn, filterFn);
console.timeEnd('mapFilter');

// Verify results are the same
console.log('Results match:', JSON.stringify(separateResult.slice(0, 5).toArray()) === JSON.stringify(combinedResult.slice(0, 5).toArray()));

// Example 2: mapFilterReduce vs map+filter+reduce
console.log('\nExample 2: mapFilterReduce vs map+filter+reduce');
console.log('---------------------------------------------');

// Define operations
const reduceFn = (acc: number, x: number) => acc + x;
const initial = 0;

// Measure time for separate operations
console.time('map+filter+reduce');
const separateReduceResult = list
  .map(mapFn)
  .filter(filterFn)
  .reduce(reduceFn, initial);
console.timeEnd('map+filter+reduce');

// Measure time for combined operation
console.time('mapFilterReduce');
const combinedReduceResult = list.mapFilterReduce(mapFn, filterFn, reduceFn, initial);
console.timeEnd('mapFilterReduce');

// Verify results are the same
console.log('Results match:', separateReduceResult === combinedReduceResult);
console.log(`Result: ${combinedReduceResult}`);

// Example 3: mapSlice vs map+slice
console.log('\nExample 3: mapSlice vs map+slice');
console.log('-------------------------------');

// Define operations
const start = 500000;
const end = 500010;

// Measure time for separate operations
console.time('map+slice');
const separateSliceResult = list
  .map(mapFn)
  .slice(start, end);
console.timeEnd('map+slice');

// Measure time for combined operation
console.time('mapSlice');
const combinedSliceResult = list.mapSlice(mapFn, start, end);
console.timeEnd('mapSlice');

// Verify results are the same
console.log('Results match:', JSON.stringify(separateSliceResult.toArray()) === JSON.stringify(combinedSliceResult.toArray()));
console.log(`Result: ${JSON.stringify(combinedSliceResult.toArray())}`);

// Example 4: filterSlice vs filter+slice
console.log('\nExample 4: filterSlice vs filter+slice');
console.log('------------------------------------');

// Measure time for separate operations
console.time('filter+slice');
const separateFilterSliceResult = list
  .filter(filterFn)
  .slice(0, 10);
console.timeEnd('filter+slice');

// Measure time for combined operation
console.time('filterSlice');
const combinedFilterSliceResult = list.filterSlice(filterFn, 0, 10);
console.timeEnd('filterSlice');

// Verify results are the same
console.log('Results match:', JSON.stringify(separateFilterSliceResult.toArray()) === JSON.stringify(combinedFilterSliceResult.toArray()));
console.log(`Result: ${JSON.stringify(combinedFilterSliceResult.toArray())}`);

// Example 5: concatMap vs concat+map
console.log('\nExample 5: concatMap vs concat+map');
console.log('--------------------------------');

// Create another list
const list2 = List.of(1000, i => i + size);

// Measure time for separate operations
console.time('concat+map');
const separateConcatResult = list
  .concat(list2)
  .map(mapFn);
console.timeEnd('concat+map');

// Measure time for combined operation
console.time('concatMap');
const combinedConcatResult = list.concatMap(list2, mapFn);
console.timeEnd('concatMap');

// Verify results are the same
console.log('Results match:', separateConcatResult.size === combinedConcatResult.size && 
  JSON.stringify(separateConcatResult.slice(0, 5).toArray()) === JSON.stringify(combinedConcatResult.slice(0, 5).toArray()) &&
  JSON.stringify(separateConcatResult.slice(size, size + 5).toArray()) === JSON.stringify(combinedConcatResult.slice(size, size + 5).toArray()));

// Example 6: Memory usage comparison
console.log('\nExample 6: Memory usage comparison');
console.log('--------------------------------');

// Function to measure memory usage
const getMemoryUsage = () => {
  if (global.gc) {
    global.gc(); // Force garbage collection if available
  }
  
  const memoryUsage = process.memoryUsage();
  return {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
  };
};

// Measure memory before operations
const memoryBefore = getMemoryUsage();
console.log('Memory before operations:', memoryBefore);

// Measure memory after separate operations
console.log('\nPerforming separate operations (map+filter)...');
const separateMemoryResult = list
  .map(mapFn)
  .filter(filterFn);
const memoryAfterSeparate = getMemoryUsage();
console.log('Memory after separate operations:', memoryAfterSeparate);
console.log(`Memory increase: ${memoryAfterSeparate.heapUsed - memoryBefore.heapUsed} MB`);

// Measure memory after combined operation
console.log('\nPerforming combined operation (mapFilter)...');
const combinedMemoryResult = list.mapFilter(mapFn, filterFn);
const memoryAfterCombined = getMemoryUsage();
console.log('Memory after combined operation:', memoryAfterCombined);
console.log(`Memory increase: ${memoryAfterCombined.heapUsed - memoryAfterSeparate.heapUsed} MB`);

// Verify results are the same
console.log('Results match:', separateMemoryResult.size === combinedMemoryResult.size);

console.log('\nSpecialized batch operations example completed.');
