# @reduct/core

Core functional utilities for the Reduct library.

## Features

- Functional programming utilities
- Currying and partial application
- Composition functions
- Option and Result types
- Memoization utilities
- Lazy evaluation

## Installation

```bash
npm install @reduct/core
# or
yarn add @reduct/core
```

## Usage

```typescript
import { pipe, curry2 } from '@reduct/core';

const add = (a: number, b: number) => a + b;
const multiply = (a: number, b: number) => a * b;

const curriedAdd = curry2(add);
const add5 = curriedAdd(5);

const result = add5(10); // 15

const pipeline = pipe(
  add5,
  (x) => multiply(x, 2)
);

const pipelineResult = pipeline(10); // (10 + 5) * 2 = 30
```

## Documentation

For detailed documentation, see the [API documentation](https://reduct.dev/docs/api/core).
