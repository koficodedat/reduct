# Reduct

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Algorithmic excellence through functional programming

Reduct is a comprehensive TypeScript library that reimagines algorithms and data structures through the lens of functional programming.

## Features

- 🧩 **Functional-First**: Immutable data structures and pure algorithm implementations
- 🔧 **Type-Safe**: Leverages TypeScript's type system for safe, predictable code
- ⚡ **Performant**: Optimized implementations with predictable complexity
- 🔄 **Immutable**: All operations produce new values without side effects
- 🧠 **Educational**: Clearly documented implementations to learn from

## Installation

```bash
# Using npm
npm install @reduct/core @reduct/data-structures @reduct/algorithms

# Using yarn
yarn add @reduct/core @reduct/data-structures @reduct/algorithms

# Using pnpm
pnpm add @reduct/core @reduct/data-structures @reduct/algorithms
```

## Packages

Reduct is organized into focused packages:

- `@reduct/core`: Fundamental functional programming utilities
- `@reduct/data-structures`: Immutable data structures
- `@reduct/algorithms`: Pure algorithm implementations

## Quick Start

```typescript
import { pipe } from '@reduct/core';
import { List } from '@reduct/data-structures';
import { quickSort } from '@reduct/algorithms';

// Create an immutable list
const numbers = List.of(5, 3, 8, 1, 4);

// Transformations return new values
const doubled = numbers.map(x => x * 2);

// Use functional composition
const process = pipe(
  (list: List<number>) => list.map(x => x * 2),
  list => list.filter(x => x > 5),
  list => quickSort(list.toArray())
);

const result = process(numbers); // [6, 8, 10, 16]
```

## Data Structures

Reduct provides immutable implementations of essential data structures:

### Immutable List

```typescript
import { List } from '@reduct/data-structures';

const list = List.of(1, 2, 3);
const appended = list.append(4); // List.of(1, 2, 3, 4)
const filtered = list.filter(x => x % 2 === 0); // List.of(2)

// Original list is unchanged
console.log(list.toArray()); // [1, 2, 3]
```

### Persistent Stack

```typescript
import { Stack } from '@reduct/data-structures';

const stack = Stack.empty<number>();
const stack1 = stack.push(1);
const stack2 = stack1.push(2);

const [value, newStack] = stack2.popWithElement();
console.log(value.get()); // 2
console.log(newStack.size); // 1
```

### Immutable Map

```typescript
import { ImmutableMap } from '@reduct/data-structures';

const map = ImmutableMap.from([
  ['key1', 'value1'],
  ['key2', 'value2']
]);

const updated = map.set('key3', 'value3');
console.log(updated.get('key3').get()); // 'value3'
console.log(map.has('key3')); // false (original unchanged)
```

## Algorithms

Pure functional implementations of classic algorithms:

### Sorting

```typescript
import { quickSort, mergeSort, heapSort } from '@reduct/algorithms';

const unsorted = [3, 1, 4, 1, 5, 9, 2, 6];

console.log(quickSort(unsorted)); // [1, 1, 2, 3, 4, 5, 6, 9]
console.log(mergeSort(unsorted)); // [1, 1, 2, 3, 4, 5, 6, 9]
console.log(heapSort(unsorted));  // [1, 1, 2, 3, 4, 5, 6, 9]

// Original array unchanged
console.log(unsorted); // [3, 1, 4, 1, 5, 9, 2, 6]
```

### Searching

```typescript
import { binarySearch, linearSearch } from '@reduct/algorithms';

const array = [1, 2, 3, 4, 5];

console.log(binarySearch(array, 3)); // 2 (index where 3 is found)
console.log(linearSearch(array, 6)); // -1 (not found)
```

## Functional Utilities

Core functional programming primitives:

### Option/Maybe

```typescript
import { fromNullable } from '@reduct/core';

const maybeValue = fromNullable(possiblyNullValue);

// Safe access without null/undefined errors
const result = maybeValue
  .map(value => value.toUpperCase())
  .getOrElse('default');
```

### Lazy Evaluation

```typescript
import { Lazy, LazySequence, infiniteSequence } from '@reduct/core';

// Value not computed until needed
const lazyValue = Lazy.of(() => expensiveOperation());

// Only computed once, then cached
console.log(lazyValue.get());
console.log(lazyValue.get()); // Uses cached value

// Process infinite sequences without memory issues
const numbers = infiniteSequence(i => i);
const evenNumbers = numbers
  .filter(n => n % 2 === 0)
  .take(10)
  .toArray(); // [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
```

## Philosophy

Reduct is built on these core principles:

1. **Immutability by default**: No unexpected side effects
2. **Pure functions**: Same inputs always produce same outputs
3. **Composition over inheritance**: Building complex behavior from simple parts
4. **Type safety**: Catch errors at compile time, not runtime
5. **Clarity over cleverness**: Readable, maintainable implementations

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.