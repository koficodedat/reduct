# Enhanced List Benchmarks

This document provides information about the enhanced List benchmarks in the Reduct library.

## Table of Contents

- [Overview](#overview)
- [Benchmark Types](#benchmark-types)
- [CLI Usage](#cli-usage)
- [API Usage](#api-usage)
- [Interpreting Results](#interpreting-results)
- [Examples](#examples)

## Overview

The enhanced List benchmarks measure the performance of various optimizations implemented in the Reduct List data structure:

- **Operation Fusion**: Combining multiple operations into a single pass to reduce intermediate allocations
- **Specialized Data Types**: Type-specific optimizations for numeric, string, and object data
- **Memory Pooling**: Reusing memory allocations to reduce garbage collection pressure
- **Result Caching**: Storing results of expensive operations to avoid redundant computations
- **Adaptive Implementation Selection**: Automatically selecting the optimal implementation based on collection size

These benchmarks help evaluate the effectiveness of these optimizations and guide further improvements.

## Benchmark Types

The enhanced List benchmarks include several types of benchmarks:

- **Operations**: Basic benchmarks for enhanced List operations
- **Scalability**: Measuring how enhanced operations scale with input size
- **Fusion**: Comparing standard operations with fused operations
- **Specialized**: Comparing standard lists with specialized type-specific lists

## CLI Usage

You can run the enhanced List benchmarks using the CLI:

```bash
# Run all enhanced List benchmarks
npx reduct-benchmark enhanced-list

# Run specific benchmark types
npx reduct-benchmark enhanced-list --type operations
npx reduct-benchmark enhanced-list --type scalability
npx reduct-benchmark enhanced-list --type fusion
npx reduct-benchmark enhanced-list --type specialized

# Customize benchmark parameters
npx reduct-benchmark enhanced-list --size 10000
npx reduct-benchmark enhanced-list --type scalability --operation mapFilter --max-size 100000 --steps 5

# Export results to different formats
npx reduct-benchmark enhanced-list --output html --output-file results.html
npx reduct-benchmark enhanced-list --output csv --output-file results.csv
npx reduct-benchmark enhanced-list --output md --output-file results.md
```

### Command Options

```
Options:
  -t, --type <type>         Type of benchmark (all, operations, scalability, fusion, specialized) (default: "all")
  -s, --size <number>       Size of the list to test (default: "10000")
  -m, --max-size <number>   Maximum size for scalability tests (default: "100000")
  -p, --steps <number>      Number of steps for scalability tests (default: "5")
  -o, --operation <operation>  Operation to test for scalability (default: "mapFilter")
  -i, --iterations <number>  Number of iterations (default: "100")
  --output <format>         Output format (console, csv, md, html) (default: "console")
  -f, --output-file <file>  Output file path
  --chart-type <type>       Chart type for HTML output (bar, line, pie) (default: "bar")
  --log-scale               Use logarithmic scale for charts
  -h, --help                display help for command
```

## API Usage

You can also use the enhanced List benchmarks programmatically:

```typescript
import {
  runEnhancedListBenchmarks,
  measureEnhancedListScalability,
  compareStandardVsFusedOperations,
  compareStandardVsSpecializedLists
} from '@reduct/benchmark';

// Run basic operations benchmark
const operationsResults = runEnhancedListBenchmarks(10000);
console.log(operationsResults);

// Measure scalability
const scalabilityResults = measureEnhancedListScalability('mapFilter', 100000, 5);
console.log(scalabilityResults);

// Compare standard vs. fused operations
const fusionResults = compareStandardVsFusedOperations(10000);
console.log(fusionResults);

// Compare standard vs. specialized lists
const specializedResults = compareStandardVsSpecializedLists(10000);
console.log(specializedResults);
```

## Interpreting Results

The benchmark results include several metrics:

- **Time (ms)**: The average time taken to execute the operation in milliseconds
- **Operations per Second**: The number of operations that can be performed in one second
- **Memory (bytes)**: The memory usage of the operation (if memory measurement is enabled)

For comparison benchmarks, the results also include:

- **Improvement**: The percentage improvement of the optimized implementation over the standard implementation

## Examples

### Example 1: Comparing Standard vs. Fused Operations

```bash
npx reduct-benchmark enhanced-list --type fusion --size 10000
```

This command compares the performance of standard operations (e.g., `map().filter()`) with fused operations (e.g., `mapFilter()`).

### Example 2: Measuring Scalability of MapFilter

```bash
npx reduct-benchmark enhanced-list --type scalability --operation mapFilter --max-size 100000 --steps 5
```

This command measures how the `mapFilter` operation scales with input size, testing 5 different sizes up to 100,000 elements.

### Example 3: Comparing Standard vs. Specialized Lists

```bash
npx reduct-benchmark enhanced-list --type specialized --size 10000
```

This command compares the performance of standard lists with specialized type-specific lists (numeric, string, object).
