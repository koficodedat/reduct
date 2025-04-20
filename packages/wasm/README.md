# @reduct/wasm

WebAssembly acceleration for the Reduct library.

## Overview

This package provides WebAssembly-accelerated implementations of performance-critical operations in the Reduct library. It offers a consistent API for other Reduct packages to consume, with automatic fallback to JavaScript implementations when WebAssembly is not supported.

## Features

- WebAssembly acceleration for data structures operations
- Seamless integration with JavaScript implementations
- Automatic feature detection and fallbacks
- Comprehensive benchmarking tools
- Memory-efficient implementation of immutable data structures

## Installation

```bash
npm install @reduct/wasm
# or
yarn add @reduct/wasm
```

## Usage

```typescript
import { getAccelerator, isWebAssemblySupported } from '@reduct/wasm';
import { List } from '@reduct/data-structures';

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a list
const list = List.of(1000000, i => i);

// Get an accelerator for the map operation
const mapAccelerator = getAccelerator<number[], number[]>(
  'data-structures',
  'list',
  'map'
);

// Check if the accelerator is available
if (mapAccelerator.isAvailable()) {
  // Use the accelerator
  const result = mapAccelerator.execute({
    data: list.toArray(),
    fn: x => x * 2
  });
  
  // Create a new list from the result
  const newList = List.from(result);
  console.log(`Result size: ${newList.size}`);
}
```

## API

### Core API

```typescript
// Check if WebAssembly is supported
function isWebAssemblySupported(): boolean;

// Get an accelerator for a specific operation
function getAccelerator<T, R>(
  domain: string,
  type: string,
  operation: string,
  options?: AcceleratorOptions
): Accelerator<T, R>;

// Accelerator interface
interface Accelerator<T, R> {
  // Execute the accelerated operation
  execute(input: T): R;
  
  // Check if the accelerator is available
  isAvailable(): boolean;
  
  // Get performance characteristics
  getPerformanceProfile(): PerformanceProfile;
}
```

## Benchmarking

```typescript
import { benchmark } from '@reduct/wasm';

// Define JavaScript and WebAssembly implementations
const jsImplementation = (input: number[]) => input.map(x => x * 2);
const wasmAccelerator = getAccelerator<number[], number[]>(
  'data-structures',
  'list',
  'map'
);

// Benchmark the implementations
const result = benchmark(
  jsImplementation,
  wasmAccelerator,
  [1, 2, 3, 4, 5]
);

console.log(`JavaScript time: ${result.jsTime}ms`);
console.log(`WebAssembly time: ${result.wasmTime}ms`);
console.log(`Speedup: ${result.speedup}x`);
```

## License

MIT
