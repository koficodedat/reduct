/**
 * Example demonstrating lazy operations in the Reduct library
 */

import { List } from '@reduct/data-structures';

console.log('Lazy Operations Example');
console.log('======================');

// Create a list with 1 million elements
console.log('Creating a list with 1 million elements...');
const size = 1000000;
const list = List.of(size, i => i);
console.log(`List size: ${list.size}`);

// Measure time for eager operations
console.log('\nPerforming eager operations...');
console.time('Eager operations');
const eagerResult = list
  .map(x => x * 2)
  .filter(x => x % 3 === 0)
  .map(x => x - 1)
  .slice(0, 10)
  .toArray();
console.timeEnd('Eager operations');
console.log('Eager result (first 10 elements):', eagerResult);

// Measure time for lazy operations
console.log('\nPerforming lazy operations...');
console.time('Lazy operations');
const lazyResult = list
  .lazyMap(x => x * 2)
  .lazyFilter(x => x % 3 === 0)
  .lazyMap(x => x - 1)
  .lazySlice(0, 10)
  .toArray();
console.timeEnd('Lazy operations');
console.log('Lazy result (first 10 elements):', lazyResult);

// Demonstrate lazy evaluation
console.log('\nDemonstrating lazy evaluation...');
console.log('Creating a lazy list with expensive operations...');

// Create a function that logs when it's called
let mapCallCount = 0;
let filterCallCount = 0;

const expensiveMap = (x: number) => {
  mapCallCount++;
  return x * 2;
};

const expensiveFilter = (x: number) => {
  filterCallCount++;
  return x % 3 === 0;
};

// Create a lazy list with expensive operations
const lazyList = list
  .lazyMap(expensiveMap)
  .lazyFilter(expensiveFilter)
  .lazyMap(x => x - 1);

console.log('Lazy list created, but no operations have been performed yet.');
console.log(`Map function called ${mapCallCount} times`);
console.log(`Filter function called ${filterCallCount} times`);

// Get the first element
console.log('\nGetting the first element...');
console.time('Get first element');
const firstElement = lazyList.get(0);
console.timeEnd('Get first element');
console.log(`First element: ${firstElement}`);
console.log(`Map function called ${mapCallCount} times`);
console.log(`Filter function called ${filterCallCount} times`);

// Get the second element
console.log('\nGetting the second element...');
console.time('Get second element');
const secondElement = lazyList.get(1);
console.timeEnd('Get second element');
console.log(`Second element: ${secondElement}`);
console.log(`Map function called ${mapCallCount} times`);
console.log(`Filter function called ${filterCallCount} times`);

// Get the first 10 elements
console.log('\nGetting the first 10 elements...');
console.time('Get first 10 elements');
const first10 = lazyList.slice(0, 10).toArray();
console.timeEnd('Get first 10 elements');
console.log(`First 10 elements: ${first10}`);
console.log(`Map function called ${mapCallCount} times`);
console.log(`Filter function called ${filterCallCount} times`);

// Demonstrate caching
console.log('\nDemonstrating caching...');
console.log('Getting the first 10 elements again...');
console.time('Get first 10 elements again');
const first10Again = lazyList.slice(0, 10).toArray();
console.timeEnd('Get first 10 elements again');
console.log(`First 10 elements: ${first10Again}`);
console.log(`Map function called ${mapCallCount} times (should be the same as before)`);
console.log(`Filter function called ${filterCallCount} times (should be the same as before)`);

// Demonstrate chaining with both eager and lazy operations
console.log('\nDemonstrating chaining with both eager and lazy operations...');
console.time('Mixed operations');
const mixedResult = list
  .filter(x => x < 100) // Eager operation
  .lazyMap(x => x * 2) // Lazy operation
  .map(x => x + 1) // Eager operation (forces evaluation of the lazy map)
  .lazyFilter(x => x % 3 === 0) // Lazy operation
  .slice(0, 5) // Eager operation (forces evaluation of the lazy filter)
  .toArray();
console.timeEnd('Mixed operations');
console.log('Mixed result:', mixedResult);

// Demonstrate memory efficiency
console.log('\nDemonstrating memory efficiency...');
console.log('Creating a large list and performing operations...');

// Create a function to measure memory usage
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

// Measure memory usage before operations
const memoryBefore = getMemoryUsage();
console.log('Memory usage before operations:', memoryBefore);

// Perform eager operations
console.log('\nPerforming eager operations...');
console.time('Eager operations (memory)');
const _eagerMemoryResult = list
  .map(x => x * 2)
  .filter(x => x % 3 === 0)
  .map(x => x - 1);
console.timeEnd('Eager operations (memory)');

// Measure memory usage after eager operations
const memoryAfterEager = getMemoryUsage();
console.log('Memory usage after eager operations:', memoryAfterEager);
console.log(`Memory increase: ${memoryAfterEager.heapUsed - memoryBefore.heapUsed} MB`);

// Perform lazy operations
console.log('\nPerforming lazy operations...');
console.time('Lazy operations (memory)');
const lazyMemoryResult = list
  .lazyMap(x => x * 2)
  .lazyFilter(x => x % 3 === 0)
  .lazyMap(x => x - 1);
console.timeEnd('Lazy operations (memory)');

// Measure memory usage after lazy operations
const memoryAfterLazy = getMemoryUsage();
console.log('Memory usage after lazy operations:', memoryAfterLazy);
console.log(`Memory increase: ${memoryAfterLazy.heapUsed - memoryAfterEager.heapUsed} MB`);

// Force evaluation of the lazy operations
console.log('\nForcing evaluation of lazy operations...');
console.time('Lazy operations evaluation');
lazyMemoryResult.size; // This forces evaluation of the filter operation
console.timeEnd('Lazy operations evaluation');

// Measure memory usage after lazy operations evaluation
const memoryAfterLazyEval = getMemoryUsage();
console.log('Memory usage after lazy operations evaluation:', memoryAfterLazyEval);
console.log(`Memory increase: ${memoryAfterLazyEval.heapUsed - memoryAfterLazy.heapUsed} MB`);

console.log('\nLazy operations example completed.');
