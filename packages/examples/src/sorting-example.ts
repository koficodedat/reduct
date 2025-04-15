/**
 * Reduct Sorting Algorithms Example
 *
 * This example demonstrates how to use various sorting algorithms
 * provided by the Reduct library.
 */

import { List } from '@reduct/data-structures';
import {
  quickSort,
  mergeSort,
  heapSort,
  functionalQuickSort
} from '@reduct/algorithms';
import { runSortingBenchmarks, formatBenchmarkSuite } from '@reduct/benchmark';

// Example 1: Basic sorting with arrays
console.log('Example 1: Basic Array Sorting');
const unsortedArray = [3, 1, 4, 1, 5, 9, 2, 6];
console.log('Original array:', unsortedArray);

const quickSorted = quickSort(unsortedArray);
console.log('QuickSort:', quickSorted);

const mergeSorted = mergeSort(unsortedArray);
console.log('MergeSort:', mergeSorted);

const heapSorted = heapSort(unsortedArray);
console.log('HeapSort:', heapSorted);

// Original array is unchanged (immutability)
console.log('Original array (unchanged):', unsortedArray);
console.log('');

// Example 2: Sorting with custom comparators
console.log('Example 2: Custom Comparators');
const people = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 },
  { name: 'David', age: 20 },
];

// Sort by age (ascending)
const sortedByAge = quickSort(people, (a, b) => a.age - b.age);
console.log('Sorted by age (ascending):');
sortedByAge.forEach(person => console.log(`${person.name}: ${person.age}`));
console.log('');

// Sort by name length (descending)
const sortedByNameLength = mergeSort(people, (a, b) => b.name.length - a.name.length);
console.log('Sorted by name length (descending):');
sortedByNameLength.forEach(person => console.log(`${person.name}: ${person.name.length}`));
console.log('');

// Example 3: Working with immutable data structures
console.log('Example 3: Working with List');
const numberList = List.of(5, 2, 8, 1, 9, 3);
console.log('Original List:', numberList.toString());

// Functional composition with sorting and other operations
const processedList = numberList
  .map(x => x * 2) // Double each number
  .filter(x => x > 5) // Keep only values > 5
  .reduce((a, b) => a + b, 0); // Sum the results

console.log('Processed result:', processedList);

// Sort the List using provided algorithm extensions
const sortedList = heapSort(numberList.toArray());
console.log('Sorted List array:', sortedList);
console.log('');

// Example 4: Using pure functional variants
console.log('Example 4: Pure Functional Variants');
const functionalSorted = functionalQuickSort(unsortedArray);
console.log('Functional QuickSort:', functionalSorted);
console.log('');

// Example 5: Benchmarking different algorithms
console.log('Example 5: Benchmarking');
console.log('Running benchmarks (this may take a moment)...');
const benchmarkResults = runSortingBenchmarks(1000);
console.log(formatBenchmarkSuite(benchmarkResults));
