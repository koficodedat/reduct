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
- Tiered optimization for automatic selection of the most efficient implementation
- Adaptive thresholds based on runtime performance measurements
- Memory pooling to reduce allocation overhead
- Hybrid acceleration combining JavaScript and WebAssembly for complex operations
- Frequency detection for optimizing frequently called operations

## Installation

```bash
npm install @reduct/wasm
# or
yarn add @reduct/wasm
```

## Usage

### Basic Usage

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

### Tiered Optimization

```typescript
import {
  TieredMapAccelerator,
  AcceleratorTier,
  TieringStrategy
} from '@reduct/wasm';

// Create a map accelerator with tiered optimization
const mapAccelerator = new TieredMapAccelerator({
  // Optional: Force a specific tier
  // forceTier: AcceleratorTier.HIGH_VALUE,

  // Optional: Set custom thresholds
  thresholds: {
    // Use WebAssembly for arrays larger than 1000 elements
    wasmThreshold: 1000
  },

  // Optional: Set a custom tiering strategy
  tieringStrategy: TieringStrategy.SIZE_BASED
});

// Map an array - automatically uses the most efficient implementation
const result = mapAccelerator.execute([1, 2, 3, 4, 5], x => x * 2);

// Get performance statistics
const stats = mapAccelerator.getPerformanceStats();
console.log(stats);
```

### Hybrid Acceleration

```typescript
import { HybridStringAccelerator } from '@reduct/wasm';

// Create a string accelerator with hybrid JS/WASM approach
const stringAccelerator = new HybridStringAccelerator();

// Search for a pattern in a string
const result = stringAccelerator.execute({
  text: 'hello world',
  pattern: 'world',
  findAll: true
});

console.log(result.matches);  // ['world']
console.log(result.indices);  // [6]
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

### Tiered Optimization API

```typescript
// Accelerator tiers
enum AcceleratorTier {
  JS_PREFERRED = 'JS_PREFERRED',   // JavaScript is preferred
  CONDITIONAL = 'CONDITIONAL',     // Conditional based on input
  HIGH_VALUE = 'HIGH_VALUE'        // WebAssembly is preferred
}

// Tiering strategies
enum TieringStrategy {
  SIZE_BASED = 'SIZE_BASED',           // Based on input size
  COMPLEXITY_BASED = 'COMPLEXITY_BASED', // Based on operation complexity
  ADAPTIVE = 'ADAPTIVE',               // Adapts based on runtime performance
  FREQUENCY_BASED = 'FREQUENCY_BASED'  // Based on call frequency
}

// Base class for tiered accelerators
abstract class BaseAccelerator<T, R> implements Accelerator<T, R> {
  // Execute the operation with automatic tier selection
  execute(input: T): R;

  // Determine the appropriate tier for the input
  determineTier(input: T): AcceleratorTier;

  // Get performance statistics
  getPerformanceStats(): AcceleratorPerformanceStats;
}

// Performance statistics
interface AcceleratorPerformanceStats {
  // Number of times each tier was used
  tierUsage: Record<AcceleratorTier, number>;

  // Average execution time for each tier
  averageExecutionTime: Record<AcceleratorTier, number>;

  // Distribution of input sizes for each tier
  inputSizeDistribution: Record<AcceleratorTier, number[]>;
}
```

### Hybrid Acceleration API

```typescript
// Base class for hybrid accelerators
abstract class HybridAccelerator<T, R> extends BaseAccelerator<T, R> {
  // Execute with hybrid JS/WASM approach
  execute(input: T): R;

  // Preprocess the input (JavaScript)
  preprocess(input: T): any;

  // Process the data (WebAssembly or JavaScript)
  process(data: any): any;

  // Postprocess the result (JavaScript)
  postprocess(result: any): R;
}

// String search accelerator
class HybridStringAccelerator extends HybridAccelerator<StringSearchInput, StringSearchResult> {
  // Execute string search operation
  execute(input: StringSearchInput): StringSearchResult;
}

// String search input
interface StringSearchInput {
  text: string;        // Text to search in
  pattern: string;     // Pattern to search for
  findAll?: boolean;   // Whether to find all occurrences
}

// String search result
interface StringSearchResult {
  matches: string[];   // Matched strings
  indices: number[];   // Indices of matches
}
```

## Benchmarking

### Basic Benchmarking

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

### Comprehensive Benchmarking

```typescript
import { runInputSizeBenchmarks } from '@reduct/benchmark';

// Run benchmarks for different operations across various input sizes
await runInputSizeBenchmarks({
  operations: ['map', 'filter', 'reduce', 'sort', 'find'],
  sizeCategories: ['tiny', 'small', 'medium'],
  dataTypeCategories: ['number', 'string'],
  iterations: 50,
  warmupIterations: 5
});

// Results are saved to the benchmark/reports directory
```

### Browser-Based Benchmarking

You can run benchmarks across different browsers and devices using the browser-based benchmark runner:

```bash
# Start the benchmark server
npm run benchmark:server

# Open http://localhost:3000 in your browser to run benchmarks
# View results at http://localhost:3000/dashboard
```

## License

MIT
