# Reduct Quick Start Guide

This guide will help you get up and running with Reduct quickly, showing how to leverage its core features.

## Installation

First, install the Reduct packages you need:

```bash
# Install all packages
npm install @reduct/core @reduct/data-structures @reduct/algorithms

# Or just what you need
npm install @reduct/core
```

## Core Functional Utilities

### Composition

Use `pipe` and `compose` to build data processing pipelines:

```typescript
import { pipe, compose } from '@reduct/core';

// pipe: Left-to-right composition
const processPipe = pipe(
  (n: number) => n + 1,
  n => n * 2,
  n => `Result: ${n}`,
);

console.log(processPipe(5)); // "Result: 12"

// compose: Right-to-left composition
const processCompose = compose(
  (n: string) => `Result: ${n}`,
  (n: number) => n * 2,
  (n: number) => n + 1,
);

console.log(processCompose(5)); // "Result: 12"
```

### Option Type (Maybe)

Handle nullable values safely:

```typescript
import { fromNullable, some, none } from '@reduct/core';

// Safe extraction from potentially null/undefined
function getName(user: { name?: string } | null | undefined) {
  return fromNullable(user)
    .flatMap(u => fromNullable(u.name))
    .map(name => name.toUpperCase())
    .getOrElse('GUEST');
}

console.log(getName({ name: 'Alice' })); // "ALICE"
console.log(getName({})); // "GUEST"
console.log(getName(null)); // "GUEST"
```

### Result Type (Either)

Handle errors functionally:

```typescript
import { ok, err, tryCatch } from '@reduct/core';

// Parse JSON safely
function parseJSON(input: string) {
  return tryCatch(
    () => JSON.parse(input),
    e => `Failed to parse: ${e instanceof Error ? e.message : String(e)}`,
  );
}

const result1 = parseJSON('{"name":"Alice"}');
const result2 = parseJSON('invalid json');

if (result1.isOk()) {
  console.log(result1.get().name); // "Alice"
}

if (result2.isErr()) {
  console.log(result2.getErr()); // "Failed to parse: ..."
}
```

### Lazy Evaluation

Defer computations until needed:

```typescript
import { Lazy, LazySequence, infiniteSequence } from '@reduct/core';

// Expensive computation not performed until needed
const lazyData = Lazy.of(() => {
  console.log('Computing...');
  return fetchLargeDataset();
});

// Later when needed
const data = lazyData.get(); // "Computing..." logged only now

// Infinite sequences with lazy evaluation
const fibonacci = (() => {
  let a = 0,
    b = 1;
  return infiniteSequence(() => {
    const value = b;
    [a, b] = [b, a + b];
    return value;
  });
})();

const first10Fibs = fibonacci.take(10).toArray();
// [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

## Data Structures

### Immutable List

```typescript
import { List } from '@reduct/data-structures';

// Creating lists
const emptyList = List.empty<number>();
const fromArray = List.from([1, 2, 3]);
const withValues = List.of(1, 2, 3);

// Transformations (all return new lists)
const appended = fromArray.append(4); // [1, 2, 3, 4]
const prepended = fromArray.prepend(0); // [0, 1, 2, 3]
const mapped = fromArray.map(x => x * 2); // [2, 4, 6]
const filtered = fromArray.filter(x => x % 2 === 1); // [1, 3]

// Access
const head = fromArray.head.getOrElse(0); // 1
const item = fromArray.get(1).getOrElse(0); // 2
const allItems = fromArray.toArray(); // [1, 2, 3]
```

### Persistent Stack

```typescript
import { Stack } from '@reduct/data-structures';

// Creating stacks
const emptyStack = Stack.empty<string>();
const withItems = Stack.of('a', 'b', 'c'); // 'c' is on top

// Push and pop (return new stacks)
const pushed = emptyStack.push('item');
const popped = withItems.pop(); // Stack with 'a', 'b'

// Get top element with peek
const topItem = withItems.peek().getOrElse('default'); // 'c'

// Get element and new stack in one operation
const [element, newStack] = withItems.popWithElement();
console.log(element.get()); // 'c'
console.log(newStack.size); // 2
```

### Immutable Map

```typescript
import { ImmutableMap } from '@reduct/data-structures';

// Creating maps
const emptyMap = ImmutableMap.empty<string, number>();
const fromEntries = ImmutableMap.from([
  ['a', 1],
  ['b', 2],
]);
const fromObject = ImmutableMap.fromObject({
  key1: 'value1',
  key2: 'value2',
});

// Operations (all return new maps)
const withNewEntry = fromEntries.set('c', 3);
const withoutEntry = fromEntries.delete('a');
const merged = fromEntries.merge(ImmutableMap.from([['c', 3]]));

// Access
const value = fromEntries.get('a').getOrElse(0); // 1
const hasKey = fromEntries.has('b'); // true
const allKeys = fromEntries.keys().toArray(); // ['a', 'b']
const allValues = fromEntries.values().toArray(); // [1, 2]
```

## Algorithms

### Sorting

```typescript
import { quickSort, mergeSort, heapSort } from '@reduct/algorithms';
import { List } from '@reduct/data-structures';

const array = [3, 1, 4, 1, 5, 9, 2, 6];
const list = List.from(array);

// Sort arrays (returns new arrays)
const sortedQuick = quickSort(array);
const sortedMerge = mergeSort(array);
const sortedHeap = heapSort(array);

// Custom comparators
const descending = quickSort(array, (a, b) => b - a);

// Sort lists
const sortedList = quickSort(list.toArray());
const newList = List.from(sortedList);
```

### Searching

```typescript
import { binarySearch, linearSearch } from '@reduct/algorithms';
import { List } from '@reduct/data-structures';

const sortedArray = [1, 2, 3, 4, 5];
const list = List.from(sortedArray);

// Find elements (returns index or -1)
const indexBinary = binarySearch(sortedArray, 3); // 2
const indexLinear = linearSearch(sortedArray, 3); // 2

// Search with Option return type
const resultInList = binarySearchList(list, 3);
if (resultInList.isSome()) {
  console.log(`Found at index ${resultInList.get()}`);
}

// Find all occurrences
const allTwos = findAll([1, 2, 3, 2, 4], 2); // [1, 3]

// Find with predicate
const firstEven = findIndex(sortedArray, x => x % 2 === 0); // 1
```

## Benchmarking

```typescript
import { compareBenchmarks, formatBenchmarkResults, generateRandomArray } from '@reduct/algorithms';
import { quickSort, mergeSort, heapSort } from '@reduct/algorithms';

// Generate test data
const testArray = generateRandomArray(10000);

// Compare algorithm performance
const results = compareBenchmarks(
  {
    quickSort: () => quickSort([...testArray]),
    mergeSort: () => mergeSort([...testArray]),
    heapSort: () => heapSort([...testArray]),
    'Array.sort': () => [...testArray].sort((a, b) => a - b),
  },
  testArray.length,
);

// Display results
console.log(formatBenchmarkResults(results));
```

## Complete Example

Here's a complete example combining multiple Reduct features:

```typescript
import { pipe, fromNullable } from '@reduct/core';
import { List } from '@reduct/data-structures';
import { quickSort } from '@reduct/algorithms';

interface User {
  name: string;
  score: number;
}

function processUserData(data: unknown) {
  return pipe(
    // Safely handle potentially invalid input
    () =>
      fromNullable(data).flatMap(d => {
        if (Array.isArray(d)) return some(d);
        return none;
      }),

    // Convert to List for immutable operations
    maybeData => maybeData.map(List.from),

    // Filter and transform users
    maybeList =>
      maybeList.map(list =>
        list
          .filter(user => user && typeof user === 'object' && 'score' in user)
          .map(user => ({
            name: String(user.name || 'Anonymous'),
            score: Number(user.score || 0),
          })),
      ),

    // Sort users by score
    maybeList =>
      maybeList.map(list => {
        const array = list.toArray();
        const sorted = quickSort(array, (a, b) => b.score - a.score);
        return List.from(sorted);
      }),

    // Extract top performers
    maybeList => maybeList.map(list => list.take(3).toArray()),

    // Provide default if data invalid
    maybeResult => maybeResult.getOrElse([]),
  )();
}

// Example usage
const userData = [
  { name: 'Alice', score: 95 },
  { name: 'Bob', score: 82 },
  { name: 'Charlie', score: 90 },
  { name: 'Diana', score: 87 },
];

const topUsers = processUserData(userData);
console.log(topUsers);
// [{ name: "Alice", score: 95 }, { name: "Charlie", score: 90 }, { name: "Diana", score: 87 }]
```

## Next Steps

- Learn about [Reduct's architecture](architecture.md)
- Explore [performance considerations](performance.md)
- See the [type system utilities](types.md)
- Check out [API documentation](api/index.md)
