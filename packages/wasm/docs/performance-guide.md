# WebAssembly Performance Guide

This guide provides best practices and insights for optimizing performance with the `@reduct/wasm` package.

## Table of Contents

- [Understanding WebAssembly Performance](#understanding-webassembly-performance)
- [When to Use WebAssembly](#when-to-use-webassembly)
- [Performance Crossover Points](#performance-crossover-points)
- [Tiering Strategies](#tiering-strategies)
- [Memory Management](#memory-management)
- [Hybrid Acceleration](#hybrid-acceleration)
- [Frequency-Based Optimization](#frequency-based-optimization)
- [Benchmarking and Profiling](#benchmarking-and-profiling)
- [Browser-Specific Considerations](#browser-specific-considerations)

## Understanding WebAssembly Performance

WebAssembly is not always faster than JavaScript. Its performance characteristics depend on several factors:

1. **Input Size**: WebAssembly typically performs better with larger inputs due to the overhead of crossing the JS/WASM boundary.
2. **Operation Complexity**: Computationally intensive operations benefit more from WebAssembly.
3. **Data Types**: Numeric operations generally see more benefit than string or object operations.
4. **Browser Implementation**: Different browsers have different WebAssembly implementations and optimizations.
5. **Hardware**: CPU architecture and capabilities affect WebAssembly performance.

## When to Use WebAssembly

WebAssembly is most beneficial in these scenarios:

- **Large Data Sets**: Processing arrays with thousands of elements
- **Numeric Computation**: Math-heavy operations like matrix multiplication
- **Tight Loops**: Operations that involve many iterations
- **Performance-Critical Paths**: Code that runs frequently and is a bottleneck

JavaScript may be better for:

- **Small Data Sets**: Arrays with fewer than 100 elements
- **Simple Operations**: Basic operations that don't involve heavy computation
- **Object Manipulation**: Operations that work with complex objects
- **DOM Interaction**: Operations that interact with the DOM

## Performance Crossover Points

Our benchmarking has identified these approximate crossover points where WebAssembly becomes faster than JavaScript:

| Operation | Data Type | Crossover Point (elements) |
|-----------|-----------|----------------------------|
| Sort      | Numbers   | ~500                       |
| Sort      | Strings   | ~1000                      |
| Map       | Numbers   | ~1000                      |
| Map       | Strings   | ~2000                      |
| Filter    | Numbers   | ~1500                      |
| Filter    | Strings   | ~3000                      |
| Reduce    | Numbers   | ~800                       |
| Reduce    | Strings   | ~1500                      |

These values are approximate and can vary based on browser, hardware, and specific operation characteristics.

## Tiering Strategies

The `@reduct/wasm` package offers several tiering strategies to automatically select the most efficient implementation:

### SIZE_BASED

Uses input size to determine the appropriate tier. This is the default strategy and works well for most cases.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.SIZE_BASED,
  thresholds: {
    wasmThreshold: 1000 // Use WebAssembly for arrays larger than 1000 elements
  }
});
```

### COMPLEXITY_BASED

Analyzes the complexity of the operation and input to determine the appropriate tier. This works well for operations with varying complexity.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.COMPLEXITY_BASED
});
```

### ADAPTIVE

Dynamically adjusts thresholds based on runtime performance measurements. This is useful for environments with varying performance characteristics.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.ADAPTIVE,
  adaptiveOptions: {
    samplingInterval: 100, // Sample every 100 calls
    adaptationRate: 0.1    // Adjust thresholds by 10% each time
  }
});
```

### FREQUENCY_BASED

Optimizes based on call frequency, caching results for frequent calls. This is useful for operations that are called repeatedly with the same inputs.

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.FREQUENCY_BASED,
  frequencyOptions: {
    cacheSize: 100,        // Cache up to 100 results
    frequencyThreshold: 10 // Consider calls frequent after 10 occurrences
  }
});
```

## Memory Management

Efficient memory management is crucial for WebAssembly performance. The `@reduct/wasm` package provides several features to optimize memory usage:

### Memory Pooling

The `WasmMemoryPool` class reuses WebAssembly memory instances to reduce allocation overhead:

```typescript
import { WasmMemoryPool } from '@reduct/wasm';

const memoryPool = new WasmMemoryPool({
  initialPages: 10,  // Initial memory size (64KB per page)
  maxPages: 1000,    // Maximum memory size
  poolSize: 5        // Number of memory instances to keep in the pool
});

// Get a memory instance
const memory = memoryPool.getMemory(1024 * 1024); // 1MB

// Use the memory...

// Release the memory back to the pool
memoryPool.releaseMemory(memory);
```

### Typed Array Views

Use typed array views to efficiently access WebAssembly memory:

```typescript
import { getTypedArrayView } from '@reduct/wasm';

// Get a typed array view of a memory instance
const uint8Array = getTypedArrayView(memory, Uint8Array);
const float32Array = getTypedArrayView(memory, Float32Array, 1024, 256);
```

### Batch Processing

Reduce the overhead of crossing the JS/WASM boundary by processing data in batches:

```typescript
import { TieredMapAccelerator } from '@reduct/wasm';

const mapAccelerator = new TieredMapAccelerator({
  batchSize: 1000 // Process 1000 elements at a time
});
```

## Hybrid Acceleration

For complex operations, a hybrid approach that combines JavaScript and WebAssembly can provide the best performance:

```typescript
import { HybridAcceleratorFactory } from '@reduct/wasm';

const hybridAccelerator = HybridAcceleratorFactory.create(
  'data-structures',
  'string',
  'search',
  {
    // Preprocess in JavaScript
    preprocess: (input) => {
      // Convert input to a format suitable for WebAssembly
      return { text: input.text, pattern: input.pattern };
    },
    
    // Core processing in WebAssembly
    process: (data) => {
      // This would be implemented in WebAssembly
      return { indices: [/* ... */] };
    },
    
    // Postprocess in JavaScript
    postprocess: (result) => {
      // Convert result back to the desired format
      return {
        indices: result.indices,
        matches: result.indices.map(i => /* extract matches */)
      };
    },
    
    // JavaScript fallback implementation
    jsImplementation: (input) => {
      // Pure JavaScript implementation
      return { /* ... */ };
    }
  }
);
```

## Frequency-Based Optimization

For operations that are called frequently with the same inputs, frequency-based optimization can provide significant performance improvements:

```typescript
import { FrequencyAwareAcceleratorFactory } from '@reduct/wasm';

const accelerator = FrequencyAwareAcceleratorFactory.create(
  'data-structures',
  'list',
  'map',
  {
    frequencyOptions: {
      cacheSize: 100,        // Cache up to 100 results
      frequencyThreshold: 10 // Consider calls frequent after 10 occurrences
    }
  }
);
```

## Benchmarking and Profiling

Regular benchmarking and profiling are essential for optimizing performance:

### Basic Benchmarking

```typescript
import { benchmark } from '@reduct/wasm';

const result = benchmark(
  jsImplementation,
  wasmAccelerator,
  input
);

console.log(`JavaScript time: ${result.jsTime}ms`);
console.log(`WebAssembly time: ${result.wasmTime}ms`);
console.log(`Speedup: ${result.speedup}x`);
```

### Comprehensive Benchmarking

```typescript
import { runInputSizeBenchmarks } from '@reduct/benchmark';

await runInputSizeBenchmarks({
  operations: ['map', 'filter', 'reduce', 'sort'],
  sizeCategories: ['tiny', 'small', 'medium', 'large'],
  dataTypeCategories: ['number', 'string'],
  iterations: 100,
  warmupIterations: 10
});
```

### Performance Statistics

Monitor performance statistics to identify optimization opportunities:

```typescript
import { TieredSortAccelerator } from '@reduct/wasm';

const sortAccelerator = new TieredSortAccelerator();

// After running some operations...
const stats = sortAccelerator.getPerformanceStats();

console.log(`JS_PREFERRED usage: ${stats.tierUsage.JS_PREFERRED}`);
console.log(`CONDITIONAL usage: ${stats.tierUsage.CONDITIONAL}`);
console.log(`HIGH_VALUE usage: ${stats.tierUsage.HIGH_VALUE}`);

console.log(`JS_PREFERRED avg time: ${stats.averageExecutionTime.JS_PREFERRED}ms`);
console.log(`CONDITIONAL avg time: ${stats.averageExecutionTime.CONDITIONAL}ms`);
console.log(`HIGH_VALUE avg time: ${stats.averageExecutionTime.HIGH_VALUE}ms`);
```

## Browser-Specific Considerations

WebAssembly performance can vary significantly across browsers:

- **Chrome**: Generally has the best WebAssembly performance
- **Firefox**: Good WebAssembly performance, especially for numeric operations
- **Safari**: WebAssembly performance has improved in recent versions
- **Edge**: Performance is similar to Chrome (both use V8)

To account for these differences, use the browser-based benchmark runner to test performance across different browsers:

```bash
# Start the benchmark server
npm run benchmark:server

# Open http://localhost:3000 in different browsers to run benchmarks
# View results at http://localhost:3000/dashboard
```

Based on the results, you can adjust your tiering strategies and thresholds for different browsers:

```typescript
import { TieredSortAccelerator, TieringStrategy } from '@reduct/wasm';

// Detect browser
const isChrome = navigator.userAgent.includes('Chrome');
const isFirefox = navigator.userAgent.includes('Firefox');
const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');

// Set browser-specific thresholds
const wasmThreshold = isChrome ? 500 : (isFirefox ? 800 : 1000);

const sortAccelerator = new TieredSortAccelerator({
  tieringStrategy: TieringStrategy.SIZE_BASED,
  thresholds: {
    wasmThreshold
  }
});
```
