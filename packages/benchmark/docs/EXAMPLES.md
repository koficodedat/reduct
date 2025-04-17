# Examples

This document provides practical examples of using the `@reduct/benchmark` package for various benchmarking scenarios.

## Table of Contents

- [Basic Benchmarking](#basic-benchmarking)
- [Comparing Implementations](#comparing-implementations)
- [Measuring Scalability](#measuring-scalability)
- [Using the CLI](#using-the-cli)
- [Custom Benchmarks](#custom-benchmarks)
- [Exporting Results](#exporting-results)
- [Using Templates](#using-templates)
- [Advanced Scenarios](#advanced-scenarios)

## Basic Benchmarking

### Benchmarking a Single Operation

```typescript
import { benchmark } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

// Create a list for testing
const list = List.from(Array.from({ length: 10000 }, (_, i) => i));

// Benchmark the map operation
const result = benchmark(
  () => list.map(x => x * 2),
  'List',
  'map',
  10000,
  { iterations: 100 }
);

console.log(result);
// {
//   name: 'List',
//   operation: 'map',
//   inputSize: 10000,
//   timeMs: 12.345,
//   opsPerSecond: 81.0045,
//   memoryBytes: undefined
// }
```

### Running a Suite of Benchmarks

```typescript
import { runListBenchmarks, formatBenchmarkSuite } from '@reduct/benchmark';

// Run a suite of benchmarks for the List data structure
const suite = runListBenchmarks(10000);

// Format and display the results
console.log(formatBenchmarkSuite(suite));
```

## Comparing Implementations

### Using the Adapter System

```typescript
import {
  compareImplementationsWithAdapters,
  formatBenchmarkComparison
} from '@reduct/benchmark';

// Compare multiple implementations using the adapter system
const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  {
    size: 10000,
    operations: ['get', 'map', 'filter', 'append', 'prepend']
  }
);

// Format and display the results
for (const comparison of comparisons) {
  console.log(formatBenchmarkComparison(comparison));
}
```

## Measuring Scalability

### Measuring List Scalability

```typescript
import {
  measureListScalability,
  formatScalabilityResult
} from '@reduct/benchmark';

// Measure how List.get scales with input size
const scalability = measureListScalability(
  'get',
  100000,  // maxSize
  5        // steps
);

// Format and display the results
console.log(formatScalabilityResult(scalability));
```

### Measuring Sorting Algorithm Scalability

```typescript
import {
  measureSortingScalability,
  formatScalabilityResult
} from '@reduct/benchmark';

// Measure how quicksort scales with input size
const scalability = measureSortingScalability(
  'quicksort',
  100000,  // maxSize
  5        // steps
);

// Format and display the results
console.log(formatScalabilityResult(scalability));
```

## Using the CLI

### Running Benchmarks

```bash
# Run benchmarks for the List data structure
npx reduct-benchmark run list -s 10000

# Run benchmarks for sorting algorithms
npx reduct-benchmark run sorting -s 1000 --output html -f sorting-results.html
```

### Comparing Implementations

```bash
# Compare List with native Array
npx reduct-benchmark compare list array -s 10000

# Compare Map with native Map and Object
npx reduct-benchmark compare map object -s 5000 --output md -f map-comparison.md
```

### Using Operation Adapters

```bash
# Compare List with native Array using adapters
npx reduct-benchmark adapter-compare reduct-list native-array -s 10000

# Compare specific operations
npx reduct-benchmark adapter-compare reduct-list native-array -o get,map,filter -s 5000
```

### Measuring Scalability

```bash
# Measure scalability of List.get operation
npx reduct-benchmark scalability list get -s 5 -m 100000

# Measure scalability of quicksort
npx reduct-benchmark scalability sorting quicksort -s 5 -m 10000 --output html -f quicksort-scalability.html
```

### Exporting Results

```bash
# Export results to HTML
npx reduct-benchmark export html -i benchmark-results.json -o results.html

# Export results using a template
npx reduct-benchmark template-export html -i benchmark-results.json -o results.html -t html-comparison
```

## Custom Benchmarks

### Creating a Custom Benchmark

```typescript
import { benchmark, formatBenchmarkResults } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

// Create test data
const size = 10000;
const array = Array.from({ length: size }, (_, i) => i);
const list = List.from(array);

// Define custom operations
const operations = {
  'sum': {
    'Array': () => array.reduce((sum, x) => sum + x, 0),
    'List': () => list.reduce((sum, x) => sum + x, 0)
  },
  'every': {
    'Array': () => array.every(x => x >= 0),
    'List': () => list.every(x => x >= 0)
  },
  'some': {
    'Array': () => array.some(x => x > size / 2),
    'List': () => list.some(x => x > size / 2)
  }
};

// Run benchmarks
const results = {};
for (const [operation, impls] of Object.entries(operations)) {
  for (const [name, fn] of Object.entries(impls)) {
    results[`${name}.${operation}`] = benchmark(fn, name, operation, size);
  }
}

// Format and display results
console.log(formatBenchmarkResults(results));
```

### Registering Custom Implementations and Operations

```typescript
import {
  registerImplementation,
  registerOperation,
  compareImplementationsWithAdapters,
  formatBenchmarkComparison
} from '@reduct/benchmark';

// Register a custom implementation
registerImplementation('my-list', {
  name: 'My Custom List',
  factory: (size) => {
    // Create a custom list implementation
    return createMyList(size);
  },
  operations: {
    get: (list, index) => list.getAt(index),
    map: (list, fn) => list.mapValues(fn),
    filter: (list, fn) => list.filterValues(fn),
    append: (list, value) => list.addLast(value),
    prepend: (list, value) => list.addFirst(value)
  }
});

// Register a custom operation
registerOperation('reverse', {
  name: 'Reverse',
  description: 'Reverses the elements in the collection',
  argsGenerator: (size) => [],
  baseline: (array) => array.reverse()
});

// Compare implementations including the custom one
const comparisons = compareImplementationsWithAdapters(
  ['my-list', 'reduct-list', 'native-array'],
  {
    size: 10000,
    operations: ['get', 'map', 'filter', 'reverse']
  }
);

// Format and display results
for (const comparison of comparisons) {
  console.log(formatBenchmarkComparison(comparison));
}
```

## Exporting Results

### Exporting to CSV

```typescript
import { compareImplementationsWithAdapters, exportToCSV } from '@reduct/benchmark';
import * as fs from 'fs';

// Run a comparison benchmark
const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  { size: 10000 }
);
const comparison = comparisons[0];

// Export to CSV
const csv = exportToCSV(comparison, {
  delimiter: ',',
  includeHeader: true,
  formatNumbers: true
});

// Save to file
fs.writeFileSync('list-comparison.csv', csv);
```

### Exporting to Markdown

```typescript
import { compareImplementationsWithAdapters, exportToMarkdown } from '@reduct/benchmark';
import * as fs from 'fs';

// Run a comparison benchmark
const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  { size: 10000 }
);
const comparison = comparisons[0];

// Export to Markdown
const markdown = exportToMarkdown(comparison, {
  includeCharts: true,
  formatNumbers: true,
  title: 'List Comparison',
  description: 'Comparing Reduct List with native JavaScript arrays'
});

// Save to file
fs.writeFileSync('list-comparison.md', markdown);
```

### Exporting to HTML

```typescript
import { compareImplementationsWithAdapters, exportToHTML } from '@reduct/benchmark';
import * as fs from 'fs';

// Run a comparison benchmark
const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  { size: 10000 }
);
const comparison = comparisons[0];

// Export to HTML
const html = exportToHTML(comparison, {
  chartType: 'bar',
  includeCharts: true,
  formatNumbers: true,
  title: 'List Comparison',
  description: 'Comparing Reduct List with native JavaScript arrays',
  logScale: true
});

// Save to file
fs.writeFileSync('list-comparison.html', html);
```

## Using Templates

### Rendering a Template

```typescript
import {
  compareImplementationsWithAdapters,
  renderTemplate
} from '@reduct/benchmark';
import * as fs from 'fs';

// Run a comparison benchmark
const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  { size: 10000 }
);
const comparison = comparisons[0];

// Render a template
const html = renderTemplate('html-comparison', {
  data: comparison,
  helpers: {
    formatNumber: (n) => n.toLocaleString(),
    formatDate: (d) => d.toISOString()
  },
  options: {
    chartType: 'bar',
    logScale: true
  }
});

// Save to file
fs.writeFileSync('list-comparison.html', html);
```

### Creating a Custom Template

```typescript
import {
  registerTemplate,
  renderTemplate,
  compareImplementationsWithAdapters
} from '@reduct/benchmark';
import * as fs from 'fs';

// Register a custom template
registerTemplate({
  name: 'my-html-template',
  format: 'html',
  description: 'Custom HTML template for benchmark results',
  content: `<!DOCTYPE html>
<html>
<head>
  <title>{{ data.title || 'Benchmark Results' }}</title>
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .fastest { color: green; font-weight: bold; }
    .slowest { color: red; }
  </style>
</head>
<body>
  <h1>{{ data.title || 'Benchmark Results' }}</h1>
  <p>Generated: {{ helpers.formatDate(new Date()) }}</p>

  <h2>{{ data.operation }} Operation (Input Size: {{ helpers.formatNumber(data.inputSize) }})</h2>
  <table>
    <thead>
      <tr>
        <th>Implementation</th>
        <th>Time (ms)</th>
        <th>Ops/Sec</th>
        <th>vs. Fastest</th>
      </tr>
    </thead>
    <tbody>
      {{ for result in data.results }}
        <tr class="{{ result.relativeFactor === 1 ? 'fastest' : (result.relativeFactor > 2 ? 'slowest' : '') }}">
          <td>{{ result.implementation }}</td>
          <td>{{ helpers.formatNumber(result.timeMs) }}</td>
          <td>{{ helpers.formatNumber(result.opsPerSecond) }}</td>
          <td>{{ result.relativeFactor === 1 ? 'fastest' : helpers.formatNumber(result.relativeFactor) + 'x slower' }}</td>
        </tr>
      {{ endfor }}
    </tbody>
  </table>
</body>
</html>`
});

// Run a comparison benchmark
const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  { size: 10000 }
);
const comparison = comparisons[0];

// Render the custom template
const html = renderTemplate('my-html-template', {
  data: {
    ...comparison,
    title: 'List vs Array Comparison'
  },
  helpers: {
    formatNumber: (n) => typeof n === 'number' ? n.toLocaleString() : n,
    formatDate: (d) => d.toISOString().split('T')[0]
  }
});

// Save to file
fs.writeFileSync('list-comparison.html', html);
```

## Advanced Scenarios

### Benchmarking with Custom Data

```typescript
import { benchmark, formatBenchmarkResults } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

// Create custom test data
const createSortedArray = (size) => Array.from({ length: size }, (_, i) => i);
const createReversedArray = (size) => Array.from({ length: size }, (_, i) => size - i - 1);
const createRandomArray = (size) => Array.from({ length: size }, () => Math.floor(Math.random() * size));

// Create test data
const size = 10000;
const sortedArray = createSortedArray(size);
const reversedArray = createReversedArray(size);
const randomArray = createRandomArray(size);

// Create lists
const sortedList = List.from(sortedArray);
const reversedList = List.from(reversedArray);
const randomList = List.from(randomArray);

// Define benchmarks
const results = {
  // Array benchmarks
  'Array.sorted.find': benchmark(
    () => sortedArray.find(x => x === size / 2),
    'Array',
    'find(sorted)',
    size
  ),
  'Array.reversed.find': benchmark(
    () => reversedArray.find(x => x === size / 2),
    'Array',
    'find(reversed)',
    size
  ),
  'Array.random.find': benchmark(
    () => randomArray.find(x => x === size / 2),
    'Array',
    'find(random)',
    size
  ),

  // List benchmarks
  'List.sorted.find': benchmark(
    () => sortedList.find(x => x === size / 2),
    'List',
    'find(sorted)',
    size
  ),
  'List.reversed.find': benchmark(
    () => reversedList.find(x => x === size / 2),
    'List',
    'find(reversed)',
    size
  ),
  'List.random.find': benchmark(
    () => randomList.find(x => x === size / 2),
    'List',
    'find(random)',
    size
  )
};

// Format and display results
console.log(formatBenchmarkResults(results));
```

### Benchmarking Asynchronous Operations

```typescript
import { benchmark, formatBenchmarkResults } from '@reduct/benchmark';

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Define async operations
const asyncOperations = {
  'setTimeout': async () => {
    await delay(1);
    return true;
  },
  'Promise.resolve': async () => {
    return Promise.resolve(true);
  },
  'Promise.all': async () => {
    return Promise.all([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3)
    ]);
  }
};

// Run benchmarks
const runAsyncBenchmarks = async () => {
  const results = {};

  for (const [name, fn] of Object.entries(asyncOperations)) {
    results[name] = benchmark(
      async () => {
        await fn();
      },
      'Async',
      name,
      1,
      { iterations: 1000 }
    );
  }

  // Format and display results
  console.log(formatBenchmarkResults(results));
};

runAsyncBenchmarks();
```

### Benchmarking Memory Usage

```typescript
import { benchmark, formatBenchmarkResults } from '@reduct/benchmark';
import { List, ImmutableMap, Stack } from '@reduct/data-structures';

// Create test data
const size = 10000;
const array = Array.from({ length: size }, (_, i) => i);

// Define benchmarks with memory measurement
const results = {
  'Array.create': benchmark(
    () => Array.from({ length: size }, (_, i) => i),
    'Array',
    'creation',
    size,
    { measureMemory: true }
  ),
  'List.create': benchmark(
    () => List.from(array),
    'List',
    'creation',
    size,
    { measureMemory: true }
  ),
  'Map.create': benchmark(
    () => new Map(array.map((x, i) => [`key${i}`, x])),
    'Map',
    'creation',
    size,
    { measureMemory: true }
  ),
  'ImmutableMap.create': benchmark(
    () => ImmutableMap.from(array.map((x, i) => [`key${i}`, x])),
    'ImmutableMap',
    'creation',
    size,
    { measureMemory: true }
  ),
  'Stack.create': benchmark(
    () => Stack.from(array),
    'Stack',
    'creation',
    size,
    { measureMemory: true }
  )
};

// Format and display results
console.log(formatBenchmarkResults(results));
```
