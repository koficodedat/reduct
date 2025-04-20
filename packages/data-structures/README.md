# @reduct/data-structures

Immutable data structures for the Reduct library.

## Features

- Immutable List
- Immutable Map
- Persistent Stack
- Lazy evaluation
- Structural sharing for performance
- WebAssembly acceleration for numeric operations

## Installation

```bash
npm install @reduct/data-structures
# or
yarn add @reduct/data-structures
```

## Usage

```typescript
import { List, Stack, ImmutableMap } from '@reduct/data-structures';

// List example
const list = List.of(1, 2, 3);
const newList = list.append(4).prepend(0);
console.log(newList.toArray()); // [0, 1, 2, 3, 4]

// Stack example
const stack = Stack.empty<number>();
const newStack = stack.push(1).push(2).push(3);
console.log(newStack.peek().get()); // 3

// Map example
const map = ImmutableMap.from([
  ['a', 1],
  ['b', 2],
  ['c', 3]
]);
const newMap = map.set('d', 4);
console.log(newMap.get('d').get()); // 4
```

## WebAssembly Acceleration

The library automatically uses WebAssembly acceleration for numeric operations when available:

```typescript
import { List, isWebAssemblySupported } from '@reduct/data-structures';

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a list of numbers
const list = List.from([1, 2, 3, 4, 5]);

// Operations will automatically use WebAssembly when available
const doubled = list.map(x => x * 2);
const sum = list.reduce((acc, x) => acc + x, 0);

// Specialized numeric operations
const numericOps = list.asNumeric();
if (numericOps) {
  const sum = numericOps.sum();
  const average = numericOps.average();
  const median = numericOps.median?.();
  const stdDev = numericOps.standardDeviation?.();
}
```

## Documentation

For detailed documentation, see the [API documentation](https://reduct.dev/docs/api/data-structures).
