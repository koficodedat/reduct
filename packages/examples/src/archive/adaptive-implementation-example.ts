/**
 * Example demonstrating adaptive implementation selection based on usage patterns
 */

import { List } from '@reduct/data-structures';

console.log('Adaptive Implementation Selection Example');
console.log('----------------------------------------');

// Create a list with some initial data
const list = List.from(Array.from({ length: 100 }, (_, i) => i));
console.log('Initial list size:', list.size);

// Perform operations that favor chunked representation
console.log('\nPerforming operations that favor chunked representation...');

// Many get operations
for (let i = 0; i < 1000; i++) {
  list.get(i % list.size);
}

// Perform operations that favor vector representation
console.log('\nPerforming operations that favor vector representation...');

// Create a larger list
const largeList = List.from(Array.from({ length: 5000 }, (_, i) => i));
console.log('Large list size:', largeList.size);

// Many map/filter operations
for (let i = 0; i < 100; i++) {
  largeList.map(x => x * 2);
  largeList.filter(x => x % 2 === 0);
}

// Perform operations that favor HAMT vector representation
console.log('\nPerforming operations that favor HAMT vector representation...');

// Create a very large list
const veryLargeList = List.from(Array.from({ length: 20000 }, (_, i) => i));
console.log('Very large list size:', veryLargeList.size);

// Many append/prepend operations
for (let i = 0; i < 50; i++) {
  veryLargeList.append(i);
  veryLargeList.prepend(i);
}

console.log('\nAdaptive implementation selection allows the List data structure');
console.log('to automatically choose the best internal representation based on');
console.log('the usage patterns of the application. This improves performance');
console.log('and memory efficiency for different types of operations and');
console.log('collection sizes.');
