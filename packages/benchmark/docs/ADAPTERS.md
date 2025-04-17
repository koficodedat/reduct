# Operation Adapters Documentation

The `@reduct/benchmark` package provides a powerful system of operation adapters for standardizing benchmarks across different implementations. This allows for fair and consistent comparisons between different data structures and algorithms.

## Table of Contents

- [Overview](#overview)
- [Implementation Adapters](#implementation-adapters)
  - [Registering Implementations](#registering-implementations)
  - [Built-in Implementations](#built-in-implementations)
  - [Custom Implementations](#custom-implementations)
- [Operation Adapters](#operation-adapters)
  - [Registering Operations](#registering-operations)
  - [Built-in Operations](#built-in-operations)
  - [Custom Operations](#custom-operations)
- [Using Adapters for Benchmarking](#using-adapters-for-benchmarking)
  - [Comparing Implementations](#comparing-implementations)
  - [Measuring Scalability](#measuring-scalability)
- [Advanced Usage](#advanced-usage)
  - [Extending Built-in Adapters](#extending-built-in-adapters)
  - [Creating Composite Operations](#creating-composite-operations)
  - [Benchmarking with Custom Data](#benchmarking-with-custom-data)

## Overview

The adapter system consists of two main components:

1. **Implementation Adapters**: Define how to create and interact with different data structure or algorithm implementations.
2. **Operation Adapters**: Define operations that can be performed on these implementations, along with how to generate test data.

This separation allows for a flexible and extensible benchmarking system that can be used to compare different implementations of the same data structure or algorithm, or even different data structures that support similar operations.

## Implementation Adapters

An implementation adapter defines:

- How to create an instance of the implementation
- How to perform various operations on the implementation

### Registering Implementations

Implementations are registered with a unique ID and an adapter object:

```typescript
import { registerImplementation } from '@reduct/benchmark';

registerImplementation('my-list', {
  name: 'My Custom List',
  factory: (size) => createMyList(size),
  operations: {
    get: (list, index) => list.getAt(index),
    map: (list, fn) => list.mapValues(fn),
    filter: (list, fn) => list.filterValues(fn),
    append: (list, value) => list.addLast(value),
    prepend: (list, value) => list.addFirst(value)
  }
});
```

### Built-in Implementations

The benchmark package includes several built-in implementation adapters:

#### List Implementations

- `reduct-list`: The Reduct List implementation
- `native-array`: Native JavaScript arrays

```typescript
// Example of the built-in reduct-list adapter
{
  name: 'Reduct List',
  factory: (size) => {
    const array = Array.from({ length: size }, (_, i) => i);
    return List.from(array);
  },
  operations: {
    get: (list, index) => list.get(index),
    map: (list, fn) => list.map(fn),
    filter: (list, fn) => list.filter(fn),
    append: (list, value) => list.append(value),
    prepend: (list, value) => list.prepend(value)
  }
}
```

#### Map Implementations

- `reduct-map`: The Reduct Map implementation
- `native-map`: Native JavaScript Map
- `plain-object`: Plain JavaScript objects

```typescript
// Example of the built-in reduct-map adapter
{
  name: 'Reduct Map',
  factory: (size) => {
    const entries = Array.from({ length: size }, (_, i) => [`key${i}`, i]);
    return ImmutableMap.from(entries);
  },
  operations: {
    get: (map, key) => map.get(key),
    has: (map, key) => map.has(key),
    set: (map, key, value) => map.set(key, value),
    delete: (map, key) => map.delete(key)
  }
}
```

#### Stack Implementations

- `reduct-stack`: The Reduct Stack implementation
- `native-array-stack`: Native JavaScript arrays used as a stack

```typescript
// Example of the built-in reduct-stack adapter
{
  name: 'Reduct Stack',
  factory: (size) => {
    const array = Array.from({ length: size }, (_, i) => i);
    return Stack.from(array);
  },
  operations: {
    peek: (stack) => stack.peek(),
    push: (stack, value) => stack.push(value),
    pop: (stack) => stack.pop(),
    map: (stack, fn) => stack.map(fn),
    filter: (stack, fn) => stack.filter(fn)
  }
}
```

### Custom Implementations

You can register your own implementations to benchmark them against the built-in ones:

```typescript
import { registerImplementation } from '@reduct/benchmark';
import { MyCustomList } from './my-custom-list';

registerImplementation('my-custom-list', {
  name: 'My Custom List',
  factory: (size) => {
    const array = Array.from({ length: size }, (_, i) => i);
    return new MyCustomList(array);
  },
  operations: {
    get: (list, index) => list.getAt(index),
    map: (list, fn) => list.transform(fn),
    filter: (list, fn) => list.select(fn),
    append: (list, value) => list.addToEnd(value),
    prepend: (list, value) => list.addToStart(value)
  }
});
```

## Operation Adapters

An operation adapter defines:

- The name and description of the operation
- How to generate arguments for the operation
- A baseline implementation of the operation (usually using native JavaScript arrays)

### Registering Operations

Operations are registered with a unique ID and an adapter object:

```typescript
import { registerOperation } from '@reduct/benchmark';

registerOperation('reverse', {
  name: 'Reverse',
  description: 'Reverses the elements in the collection',
  argsGenerator: (size) => [],
  baseline: (array) => array.reverse()
});
```

### Built-in Operations

The benchmark package includes several built-in operation adapters:

#### List Operations

- `get`: Get an element at a specific index
- `map`: Transform each element
- `filter`: Filter elements based on a predicate
- `append`: Add an element to the end
- `prepend`: Add an element to the beginning

```typescript
// Example of the built-in get operation adapter
{
  name: 'Get',
  description: 'Get an element at a specific index',
  argsGenerator: (size) => {
    // Generate 100 random indices
    return [Math.floor(Math.random() * size)];
  },
  baseline: (array, index) => array[index]
}
```

#### Map Operations

- `get`: Get a value by key
- `has`: Check if a key exists
- `set`: Set a key-value pair
- `delete`: Delete a key-value pair

```typescript
// Example of the built-in set operation adapter
{
  name: 'Set',
  description: 'Set a key-value pair',
  argsGenerator: (size) => {
    return [`key${Math.floor(Math.random() * size)}`, Math.random()];
  },
  baseline: (map, key, value) => {
    map.set(key, value);
    return map;
  }
}
```

#### Stack Operations

- `peek`: Get the top element
- `push`: Add an element to the top
- `pop`: Remove the top element

```typescript
// Example of the built-in push operation adapter
{
  name: 'Push',
  description: 'Add an element to the top of the stack',
  argsGenerator: (size) => [Math.random()],
  baseline: (array, value) => {
    array.push(value);
    return array;
  }
}
```

### Custom Operations

You can register your own operations to benchmark them:

```typescript
import { registerOperation } from '@reduct/benchmark';

registerOperation('sum', {
  name: 'Sum',
  description: 'Calculate the sum of all elements',
  argsGenerator: (size) => [],
  baseline: (array) => array.reduce((sum, x) => sum + x, 0)
});

registerOperation('every', {
  name: 'Every',
  description: 'Check if all elements satisfy a condition',
  argsGenerator: (size) => [(x) => x >= 0],
  baseline: (array, predicate) => array.every(predicate)
});
```

## Using Adapters for Benchmarking

### Comparing Implementations

The adapter system allows for easy comparison of different implementations:

```typescript
import { 
  compareImplementationsWithAdapters, 
  formatBenchmarkComparison 
} from '@reduct/benchmark';

// Compare Reduct List with native arrays
const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  {
    size: 10000,
    operations: ['get', 'map', 'filter', 'append', 'prepend']
  }
);

// Format and display results
for (const comparison of comparisons) {
  console.log(formatBenchmarkComparison(comparison));
}
```

### Measuring Scalability

You can also measure how different implementations scale with input size:

```typescript
import { 
  measureImplementationScalability, 
  formatScalabilityResult 
} from '@reduct/benchmark';

// Measure scalability of the get operation for Reduct List
const scalability = measureImplementationScalability(
  'reduct-list',
  'get',
  {
    maxSize: 100000,
    steps: 5
  }
);

// Format and display results
console.log(formatScalabilityResult(scalability));
```

## Advanced Usage

### Extending Built-in Adapters

You can extend built-in adapters to add custom operations:

```typescript
import { 
  getRegisteredImplementation, 
  registerImplementation 
} from '@reduct/benchmark';

// Get the built-in Reduct List adapter
const reductListAdapter = getRegisteredImplementation('reduct-list');

// Extend it with a custom operation
registerImplementation('extended-reduct-list', {
  ...reductListAdapter,
  name: 'Extended Reduct List',
  operations: {
    ...reductListAdapter.operations,
    sum: (list) => list.reduce((sum, x) => sum + x, 0)
  }
});
```

### Creating Composite Operations

You can create composite operations that combine multiple operations:

```typescript
import { registerOperation } from '@reduct/benchmark';

registerOperation('map-filter', {
  name: 'Map and Filter',
  description: 'Map elements and then filter them',
  argsGenerator: (size) => [
    (x) => x * 2,
    (x) => x % 2 === 0
  ],
  baseline: (array, mapFn, filterFn) => array.map(mapFn).filter(filterFn)
});
```

### Benchmarking with Custom Data

You can customize the data used for benchmarking:

```typescript
import { 
  registerImplementation, 
  registerOperation 
} from '@reduct/benchmark';

// Register a custom implementation with specific data
registerImplementation('sorted-array', {
  name: 'Sorted Array',
  factory: (size) => {
    return Array.from({ length: size }, (_, i) => i);
  },
  operations: {
    binarySearch: (array, value) => {
      // Binary search implementation
      let left = 0;
      let right = array.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (array[mid] === value) return mid;
        if (array[mid] < value) left = mid + 1;
        else right = mid - 1;
      }
      return -1;
    }
  }
});

// Register a custom operation for binary search
registerOperation('binarySearch', {
  name: 'Binary Search',
  description: 'Search for a value using binary search',
  argsGenerator: (size) => [Math.floor(Math.random() * size)],
  baseline: (array, value) => {
    // Linear search as baseline
    return array.indexOf(value);
  }
});
```
