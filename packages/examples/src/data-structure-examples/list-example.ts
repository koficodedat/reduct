/**
 * Basic List Example
 * 
 * This example demonstrates the basic usage of the List data structure.
 */

import { List } from '@reduct/data-structures';

console.log('Basic List Example');
console.log('=================');

// Create a list
const list = List.from([1, 2, 3, 4, 5]);
console.log('Original list:', list.toString());

// Basic operations
console.log('\nBasic Operations:');
console.log('Get element at index 2:', list.get(2));
console.log('Size of the list:', list.size);
console.log('Is the list empty?', list.isEmpty);
console.log('First element:', list.first());
console.log('Last element:', list.last());

// Immutable operations
console.log('\nImmutable Operations:');
const appendedList = list.append(6);
console.log('After append(6):', appendedList.toString());
console.log('Original list (unchanged):', list.toString());

const prependedList = list.prepend(0);
console.log('After prepend(0):', prependedList.toString());

const updatedList = list.set(2, 10);
console.log('After set(2, 10):', updatedList.toString());

const insertedList = list.insert(3, 3.5);
console.log('After insert(3, 3.5):', insertedList.toString());

const removedList = list.remove(1);
console.log('After remove(1):', removedList.toString());

// Functional operations
console.log('\nFunctional Operations:');
const doubledList = list.map(x => x * 2);
console.log('After map(x => x * 2):', doubledList.toString());

const evenList = list.filter(x => x % 2 === 0);
console.log('After filter(x => x % 2 === 0):', evenList.toString());

const sum = list.reduce((acc, x) => acc + x, 0);
console.log('After reduce((acc, x) => acc + x, 0):', sum);

// Slicing
console.log('\nSlicing:');
const slicedList = list.slice(1, 4);
console.log('After slice(1, 4):', slicedList.toString());

// Concatenation
console.log('\nConcatenation:');
const otherList = List.from([6, 7, 8]);
const concatenatedList = list.concat(otherList);
console.log('After concat([6, 7, 8]):', concatenatedList.toString());

// Conversion
console.log('\nConversion:');
const array = list.toArray();
console.log('After toArray():', array);

// Transient operations (for batch modifications)
console.log('\nTransient Operations:');
const transient = list.transient();
transient.append(6);
transient.append(7);
transient.set(0, 0);
const persistentAgain = transient.persistent();
console.log('After transient operations:', persistentAgain.toString());

// Finding elements
console.log('\nFinding Elements:');
const foundElement = list.find(x => x > 3);
console.log('First element > 3:', foundElement);

const foundIndex = list.findIndex(x => x > 3);
console.log('Index of first element > 3:', foundIndex);

console.log('\nList is an immutable data structure that provides efficient operations');
console.log('while maintaining immutability. It automatically adapts its internal');
console.log('representation based on the size of the collection and usage patterns.');
