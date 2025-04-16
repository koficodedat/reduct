# @reduct/algorithms

Functional algorithm implementations for the Reduct library.

## Features

- Sorting algorithms (QuickSort, MergeSort, HeapSort)
- Searching algorithms (Binary Search, Linear Search)
- Immutable implementations
- Functional variants
- Support for custom comparators

## Installation

```bash
npm install @reduct/algorithms
# or
yarn add @reduct/algorithms
```

## Usage

```typescript
import { quickSort, binarySearch } from '@reduct/algorithms';
import { List } from '@reduct/data-structures';

// Sorting arrays
const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];
const sorted = quickSort(unsorted);
console.log(sorted); // [1, 1, 2, 3, 4, 5, 6, 9]

// Sorting with custom comparator
const strings = ['apple', 'banana', 'kiwi', 'grape'];
const byLength = quickSort(strings, (a, b) => a.length - b.length);
console.log(byLength); // ['kiwi', 'apple', 'grape', 'banana']

// Searching
const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const index = binarySearch(array, 7);
console.log(index); // 6

// Working with Reduct data structures
const list = List.of(1, 2, 3, 4, 5);
const result = binarySearchList(list, 3);
console.log(result.get()); // 2
```

## Documentation

For detailed documentation, see the [API documentation](https://reduct.dev/docs/api/algorithms).
