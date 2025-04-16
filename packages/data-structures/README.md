# @reduct/data-structures

Immutable data structures for the Reduct library.

## Features

- Immutable List
- Immutable Map
- Persistent Stack
- Lazy evaluation
- Structural sharing for performance

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

## Documentation

For detailed documentation, see the [API documentation](https://reduct.dev/docs/api/data-structures).
