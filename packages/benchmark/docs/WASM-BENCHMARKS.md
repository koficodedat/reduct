# WebAssembly Benchmarks

This document describes how to use the WebAssembly benchmarking capabilities in the `@reduct/benchmark` package.

## Overview

The WebAssembly benchmarks allow you to compare the performance of WebAssembly-accelerated implementations with their JavaScript counterparts. This is particularly useful for numeric operations where WebAssembly can provide significant performance improvements.

## CLI Usage

### Basic Commands

```bash
# Compare WebAssembly implementations with JavaScript implementations
npx reduct-benchmark wasm-compare numeric-list -o map,filter,reduce -s 10000

# Run WebAssembly benchmarks with different input sizes
npx reduct-benchmark wasm-scalability numeric-list -o map -s 5 -m 100000

# Run WebAssembly benchmarks with different data types
npx reduct-benchmark wasm-data-types -o map,filter,reduce -s 10000
```

### Command Options

```bash
# Get help for WebAssembly commands
npx reduct-benchmark wasm-compare --help
npx reduct-benchmark wasm-scalability --help

# Customize output format
npx reduct-benchmark wasm-compare numeric-list -s 10000 --output html -f results.html

# Use logarithmic scale for charts
npx reduct-benchmark wasm-compare numeric-list -s 10000 --output html -f results.html --log-scale
```

## API Usage

The WebAssembly benchmarks can also be used programmatically:

```typescript
import {
  compareWasmImplementations,
  measureWasmScalability,
  exportToHTML,
  exportToCSV
} from '@reduct/benchmark';

// Compare WebAssembly implementations
const wasmResults = compareWasmImplementations(
  ['numeric-list', 'wasm-numeric-list'],
  { size: 10000, operations: ['map', 'filter', 'reduce'] }
);
console.log(wasmResults[0]);

// Measure WebAssembly scalability
const scalabilityResults = measureWasmScalability('map', {
  maxSize: 100000,
  steps: 5,
  implementations: ['numeric-list', 'wasm-numeric-list']
});

// Export results to HTML
const html = exportToHTML(scalabilityResults);
fs.writeFileSync('results.html', html);

// Export results to CSV
const csv = exportToCSV(scalabilityResults);
fs.writeFileSync('results.csv', csv);
```

## Supported Operations

The following operations are supported for WebAssembly benchmarks:

- **map**: Apply a function to each element in the list
- **filter**: Filter elements based on a predicate
- **reduce**: Reduce the list to a single value
- **sort**: Sort the list
- **sum**: Calculate the sum of all elements
- **average**: Calculate the average of all elements
- **min**: Find the minimum value
- **max**: Find the maximum value
- **median**: Calculate the median value
- **percentile**: Calculate a percentile value
- **standardDeviation**: Calculate the standard deviation
- **variance**: Calculate the variance
- **fft**: Perform a Fast Fourier Transform
- **ifft**: Perform an Inverse Fast Fourier Transform
- **convolve**: Perform a convolution
- **correlate**: Perform a correlation

## Supported Data Types

The WebAssembly benchmarks support the following data types:

- **number**: JavaScript numbers (double-precision floating-point)
- **integer**: JavaScript integers
- **float**: JavaScript floating-point numbers
- **bigint**: JavaScript BigInts (where supported)

## Benchmark Reports

Benchmark reports are stored in the `reports` directory and include:

- Performance comparison between WebAssembly and JavaScript implementations
- Scalability analysis across different input sizes
- Data type performance analysis
- Operation pattern analysis

## Examples

### Basic WebAssembly Benchmark

```typescript
import { compareWasmImplementations } from '@reduct/benchmark';

// Compare WebAssembly implementations
const results = compareWasmImplementations(
  ['numeric-list', 'wasm-numeric-list'],
  {
    size: 10000,
    operations: ['map', 'filter', 'reduce'],
    iterations: 10,
    warmupIterations: 5
  }
);

console.log(results);
```

### WebAssembly Scalability Benchmark

```typescript
import { measureWasmScalability } from '@reduct/benchmark';

// Measure WebAssembly scalability
const results = measureWasmScalability('map', {
  maxSize: 100000,
  steps: 5,
  implementations: ['numeric-list', 'wasm-numeric-list'],
  iterations: 10,
  warmupIterations: 5
});

console.log(results);
```

### WebAssembly Data Type Benchmark

```typescript
import { benchmarkWasmDataTypes } from '@reduct/benchmark';

// Benchmark WebAssembly with different data types
const results = benchmarkWasmDataTypes({
  operations: ['map', 'filter', 'reduce'],
  size: 10000,
  iterations: 10,
  warmupIterations: 5
});

console.log(results);
```

## Conclusion

WebAssembly benchmarks provide valuable insights into the performance characteristics of WebAssembly-accelerated implementations compared to their JavaScript counterparts. Use these benchmarks to identify opportunities for optimization and to measure the impact of WebAssembly acceleration on your application.
