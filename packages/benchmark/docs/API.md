# API Documentation

The `@reduct/benchmark` package provides a comprehensive API for benchmarking data structures and algorithms in the Reduct library.

## Table of Contents

- [Core Benchmarking](#core-benchmarking)
  - [benchmark](#benchmark)
  - [compareBenchmarks](#comparebenchmarks)
  - [formatBenchmarkResults](#formatbenchmarkresults)
- [Data Structure Benchmarks](#data-structure-benchmarks)
  - [List](#list)
  - [Map](#map)
  - [Stack](#stack)
- [Algorithm Benchmarks](#algorithm-benchmarks)
  - [Sorting](#sorting)
  - [Searching](#searching)
- [Operation Adapters](#operation-adapters)
  - [Registry](#registry)
  - [Comparison](#comparison)
- [Visualization](#visualization)
  - [Exporters](#exporters)
  - [Templates](#templates)
- [Types](#types)

## Core Benchmarking

### `benchmark`

Run a benchmark for a specific operation.

```typescript
function benchmark(
  fn: () => any,
  name: string,
  operation: string,
  inputSize: number,
  options?: BenchmarkOptions
): BenchmarkResult;
```

#### Parameters

- `fn`: Function to benchmark
- `name`: Name of the implementation
- `operation`: Name of the operation
- `inputSize`: Size of the input data
- `options`: Benchmark options
  - `iterations`: Number of iterations (default: 100)
  - `warmupIterations`: Number of warmup iterations (default: 10)
  - `measureMemory`: Whether to measure memory usage (default: false)

#### Returns

- `BenchmarkResult`: Result of the benchmark
  - `name`: Name of the implementation
  - `operation`: Name of the operation
  - `inputSize`: Size of the input data
  - `timeMs`: Time in milliseconds
  - `opsPerSecond`: Operations per second
  - `memoryBytes`: Memory usage in bytes (if measured)

#### Example

```typescript
import { benchmark } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

const list = List.from(Array.from({ length: 10000 }, (_, i) => i));
const result = benchmark(() => list.map(x => x * 2), 'List', 'map', 10000);

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

### `compareBenchmarks`

Compare multiple benchmark results.

```typescript
function compareBenchmarks(
  results: Record<string, BenchmarkResult>
): BenchmarkComparison;
```

#### Parameters

- `results`: Record of benchmark results

#### Returns

- `BenchmarkComparison`: Comparison of benchmark results
  - `name`: Name of the comparison
  - `description`: Description of the comparison
  - `operation`: Name of the operation
  - `inputSize`: Size of the input data
  - `results`: Array of comparison results
    - `implementation`: Name of the implementation
    - `timeMs`: Time in milliseconds
    - `opsPerSecond`: Operations per second
    - `relativeFactor`: Relative performance factor (1.0 for fastest)
    - `memoryBytes`: Memory usage in bytes (if measured)

#### Example

```typescript
import { benchmark, compareBenchmarks } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

const list = List.from(Array.from({ length: 10000 }, (_, i) => i));
const array = Array.from({ length: 10000 }, (_, i) => i);

const results = {
  'List.map': benchmark(() => list.map(x => x * 2), 'List', 'map', 10000),
  'Array.map': benchmark(() => array.map(x => x * 2), 'Array', 'map', 10000)
};

const comparison = compareBenchmarks(results);
console.log(comparison);
// {
//   name: 'map Comparison',
//   description: 'Comparing map across different implementations',
//   operation: 'map',
//   inputSize: 10000,
//   results: [
//     {
//       implementation: 'Array',
//       timeMs: 5.678,
//       opsPerSecond: 176.1184,
//       relativeFactor: 1.0,
//       memoryBytes: undefined
//     },
//     {
//       implementation: 'List',
//       timeMs: 12.345,
//       opsPerSecond: 81.0045,
//       relativeFactor: 2.1739,
//       memoryBytes: undefined
//     }
//   ]
// }
```

### `formatBenchmarkResults`

Format benchmark results as a string.

```typescript
function formatBenchmarkResults(
  results: Record<string, BenchmarkResult>
): string;
```

#### Parameters

- `results`: Record of benchmark results

#### Returns

- `string`: Formatted benchmark results

#### Example

```typescript
import { benchmark, formatBenchmarkResults } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

const list = List.from(Array.from({ length: 10000 }, (_, i) => i));
const array = Array.from({ length: 10000 }, (_, i) => i);

const results = {
  'List.map': benchmark(() => list.map(x => x * 2), 'List', 'map', 10000),
  'Array.map': benchmark(() => array.map(x => x * 2), 'Array', 'map', 10000)
};

const formatted = formatBenchmarkResults(results);
console.log(formatted);
// ## Benchmark Results
//
// Operation | Implementation | Time (ms) | Ops/Sec
// --------- | ------------- | --------- | -------
// map       | Array         | 5.678     | 176,118
// map       | List          | 12.345    | 81,004
```

## Data Structure Benchmarks

### List

#### `runListBenchmarks`

Run benchmarks for the List data structure.

```typescript
function runListBenchmarks(
  size?: number,
  options?: BenchmarkOptions
): BenchmarkSuite;
```

#### Parameters

- `size`: Size of the list (default: 10000)
- `options`: Benchmark options

#### Returns

- `BenchmarkSuite`: Benchmark suite with results

#### Example

```typescript
import { runListBenchmarks, formatBenchmarkSuite } from '@reduct/benchmark';

const suite = runListBenchmarks(10000);
console.log(formatBenchmarkSuite(suite));
```



#### `measureListScalability`

Measure how List operations scale with input size.

```typescript
function measureListScalability(
  operation: 'map' | 'filter' | 'reduce' | 'get' | 'append' | 'prepend',
  maxSize?: number,
  steps?: number,
  options?: BenchmarkOptions
): ScalabilityResult;
```

#### Parameters

- `operation`: The operation to test
- `maxSize`: Maximum list size to test (default: 100000)
- `steps`: Number of size increments to test (default: 5)
- `options`: Benchmark options

#### Returns

- `ScalabilityResult`: Scalability results

#### Example

```typescript
import { measureListScalability, formatScalabilityResult } from '@reduct/benchmark';

const scalability = measureListScalability('get', 100000, 5);
console.log(formatScalabilityResult(scalability));
```

### Map

#### `runMapBenchmarks`

Run benchmarks for the Map data structure.

```typescript
function runMapBenchmarks(
  size?: number,
  options?: BenchmarkOptions
): BenchmarkSuite;
```

#### Parameters

- `size`: Size of the map (default: 10000)
- `options`: Benchmark options

#### Returns

- `BenchmarkSuite`: Benchmark suite with results

#### Example

```typescript
import { runMapBenchmarks, formatBenchmarkSuite } from '@reduct/benchmark';

const suite = runMapBenchmarks(10000);
console.log(formatBenchmarkSuite(suite));
```



#### `measureMapScalability`

Measure how Map operations scale with input size.

```typescript
function measureMapScalability(
  operation: 'get' | 'has' | 'set' | 'delete' | 'map' | 'filter',
  maxSize?: number,
  steps?: number,
  options?: BenchmarkOptions
): ScalabilityResult;
```

#### Parameters

- `operation`: The operation to test
- `maxSize`: Maximum map size to test (default: 100000)
- `steps`: Number of size increments to test (default: 5)
- `options`: Benchmark options

#### Returns

- `ScalabilityResult`: Scalability results

#### Example

```typescript
import { measureMapScalability, formatScalabilityResult } from '@reduct/benchmark';

const scalability = measureMapScalability('get', 100000, 5);
console.log(formatScalabilityResult(scalability));
```

### Stack

#### `runStackBenchmarks`

Run benchmarks for the Stack data structure.

```typescript
function runStackBenchmarks(
  size?: number,
  options?: BenchmarkOptions
): BenchmarkSuite;
```

#### Parameters

- `size`: Size of the stack (default: 10000)
- `options`: Benchmark options

#### Returns

- `BenchmarkSuite`: Benchmark suite with results

#### Example

```typescript
import { runStackBenchmarks, formatBenchmarkSuite } from '@reduct/benchmark';

const suite = runStackBenchmarks(10000);
console.log(formatBenchmarkSuite(suite));
```



#### `measureStackScalability`

Measure how Stack operations scale with input size.

```typescript
function measureStackScalability(
  operation: 'peek' | 'push' | 'pop' | 'map' | 'filter',
  maxSize?: number,
  steps?: number,
  options?: BenchmarkOptions
): ScalabilityResult;
```

#### Parameters

- `operation`: The operation to test
- `maxSize`: Maximum stack size to test (default: 100000)
- `steps`: Number of size increments to test (default: 5)
- `options`: Benchmark options

#### Returns

- `ScalabilityResult`: Scalability results

#### Example

```typescript
import { measureStackScalability, formatScalabilityResult } from '@reduct/benchmark';

const scalability = measureStackScalability('peek', 100000, 5);
console.log(formatScalabilityResult(scalability));
```

## Algorithm Benchmarks

### Sorting

#### `runSortingBenchmarks`

Run benchmarks for sorting algorithms.

```typescript
function runSortingBenchmarks(
  algorithm: string,
  size?: number,
  options?: BenchmarkOptions
): BenchmarkSuite;
```

#### Parameters

- `algorithm`: Sorting algorithm to benchmark
- `size`: Size of the array to sort (default: 10000)
- `options`: Benchmark options

#### Returns

- `BenchmarkSuite`: Benchmark suite with results

#### Example

```typescript
import { runSortingBenchmarks, formatBenchmarkSuite } from '@reduct/benchmark';

const suite = runSortingBenchmarks('quicksort', 10000);
console.log(formatBenchmarkSuite(suite));
```

#### `runSortingBenchmarkSuite`

Run benchmarks for multiple sorting algorithms.

```typescript
function runSortingBenchmarkSuite(
  size?: number,
  options?: BenchmarkOptions
): BenchmarkSuite;
```

#### Parameters

- `size`: Size of the array to sort (default: 10000)
- `options`: Benchmark options

#### Returns

- `BenchmarkSuite`: Benchmark suite with results

#### Example

```typescript
import { runSortingBenchmarkSuite, formatBenchmarkSuite } from '@reduct/benchmark';

const suite = runSortingBenchmarkSuite(10000);
console.log(formatBenchmarkSuite(suite));
```

#### `measureSortingScalability`

Measure how sorting algorithms scale with input size.

```typescript
function measureSortingScalability(
  algorithm: string,
  maxSize?: number,
  steps?: number,
  options?: BenchmarkOptions
): ScalabilityResult;
```

#### Parameters

- `algorithm`: Sorting algorithm to benchmark
- `maxSize`: Maximum array size to test (default: 100000)
- `steps`: Number of size increments to test (default: 5)
- `options`: Benchmark options

#### Returns

- `ScalabilityResult`: Scalability results

#### Example

```typescript
import { measureSortingScalability, formatScalabilityResult } from '@reduct/benchmark';

const scalability = measureSortingScalability('quicksort', 100000, 5);
console.log(formatScalabilityResult(scalability));
```

### Searching

#### `runSearchingBenchmarks`

Run benchmarks for searching algorithms.

```typescript
function runSearchingBenchmarks(
  algorithm: string,
  size?: number,
  options?: BenchmarkOptions
): BenchmarkSuite;
```

#### Parameters

- `algorithm`: Searching algorithm to benchmark
- `size`: Size of the array to search (default: 10000)
- `options`: Benchmark options

#### Returns

- `BenchmarkSuite`: Benchmark suite with results

#### Example

```typescript
import { runSearchingBenchmarks, formatBenchmarkSuite } from '@reduct/benchmark';

const suite = runSearchingBenchmarks('binary', 10000);
console.log(formatBenchmarkSuite(suite));
```

#### `measureSearchingScalability`

Measure how searching algorithms scale with input size.

```typescript
function measureSearchingScalability(
  algorithm: string,
  maxSize?: number,
  steps?: number,
  options?: BenchmarkOptions
): ScalabilityResult;
```

#### Parameters

- `algorithm`: Searching algorithm to benchmark
- `maxSize`: Maximum array size to test (default: 100000)
- `steps`: Number of size increments to test (default: 5)
- `options`: Benchmark options

#### Returns

- `ScalabilityResult`: Scalability results

#### Example

```typescript
import { measureSearchingScalability, formatScalabilityResult } from '@reduct/benchmark';

const scalability = measureSearchingScalability('binary', 100000, 5);
console.log(formatScalabilityResult(scalability));
```

## Operation Adapters

### Comparison

#### `compareImplementationsWithAdapters`

Compare multiple implementations using adapters. This function replaces the specific comparison functions like `compareListWithNativeArray`, `compareMapWithNativeMap`, and `compareStackWithNativeArray`.

```typescript
function compareImplementationsWithAdapters(
  ids: string[],
  options: AdapterComparisonOptions
): BenchmarkComparison[];
```

#### Parameters

- `ids`: Array of implementation IDs to compare
- `options`: Comparison options
  - `size`: Size of the data structures to test
  - `operations`: Operations to benchmark (if not specified, all common operations will be tested)
  - `minCompatibilityScore`: Minimum compatibility score (0-1) for operations to be included
  - `showProgress`: Whether to show progress indicators
  - `progressIndicatorType`: Type of progress indicator to use

#### Returns

- `BenchmarkComparison[]`: Array of benchmark comparisons, one for each operation

#### Example

```typescript
import { compareImplementationsWithAdapters, formatBenchmarkComparison } from '@reduct/benchmark';

const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  { size: 10000, operations: ['get', 'map', 'filter'] }
);

comparisons.forEach(comparison => {
  console.log(formatBenchmarkComparison(comparison));
});
```

### Registry

#### `registerImplementation`

Register an implementation for benchmarking.

```typescript
function registerImplementation(
  id: string,
  implementation: ImplementationAdapter
): void;
```

#### Parameters

- `id`: Unique identifier for the implementation
- `implementation`: Implementation adapter
  - `name`: Display name for the implementation
  - `factory`: Function to create an instance of the implementation
  - `operations`: Map of operation functions

#### Example

```typescript
import { registerImplementation } from '@reduct/benchmark';
import { List } from '@reduct/data-structures';

registerImplementation('my-list', {
  name: 'My Custom List',
  factory: (size) => {
    const array = Array.from({ length: size }, (_, i) => i);
    return List.from(array);
  },
  operations: {
    get: (list, index) => list.get(index),
    map: (list, fn) => list.map(fn),
    filter: (list, fn) => list.filter(fn),
    append: (list, value) => list.append(value),
    prepend: (list, value) => list.prepend(value)
  }
});
```

#### `getRegisteredImplementation`

Get a registered implementation.

```typescript
function getRegisteredImplementation(
  id: string
): ImplementationAdapter | undefined;
```

#### Parameters

- `id`: Unique identifier for the implementation

#### Returns

- `ImplementationAdapter | undefined`: The registered implementation or undefined if not found

#### Example

```typescript
import { getRegisteredImplementation } from '@reduct/benchmark';

const listImpl = getRegisteredImplementation('reduct-list');
console.log(listImpl?.name); // "Reduct List"
```

#### `registerOperation`

Register an operation for benchmarking.

```typescript
function registerOperation(
  id: string,
  operation: OperationAdapter
): void;
```

#### Parameters

- `id`: Unique identifier for the operation
- `operation`: Operation adapter
  - `name`: Display name for the operation
  - `description`: Description of the operation
  - `argsGenerator`: Function to generate arguments for the operation
  - `baseline`: Function to perform the operation on a baseline implementation

#### Example

```typescript
import { registerOperation } from '@reduct/benchmark';

registerOperation('reverse', {
  name: 'Reverse',
  description: 'Reverses the elements in the collection',
  argsGenerator: (size) => [],
  baseline: (array) => array.reverse()
});
```

#### `getRegisteredOperation`

Get a registered operation.

```typescript
function getRegisteredOperation(
  id: string
): OperationAdapter | undefined;
```

#### Parameters

- `id`: Unique identifier for the operation

#### Returns

- `OperationAdapter | undefined`: The registered operation or undefined if not found

#### Example

```typescript
import { getRegisteredOperation } from '@reduct/benchmark';

const getOp = getRegisteredOperation('get');
console.log(getOp?.name); // "Get"
```

### Comparison

#### `compareImplementationsWithAdapters`

Compare multiple implementations using the adapter system.

```typescript
function compareImplementationsWithAdapters(
  implementationIds: string[],
  options: AdapterComparisonOptions
): BenchmarkComparison[];
```

#### Parameters

- `implementationIds`: Array of implementation IDs to compare
- `options`: Comparison options
  - `size`: Size of the data structures (default: 10000)
  - `operations`: Array of operation IDs to compare (default: all)
  - `iterations`: Number of iterations (default: 100)
  - `warmupIterations`: Number of warmup iterations (default: 10)
  - `measureMemory`: Whether to measure memory usage (default: false)

#### Returns

- `BenchmarkComparison[]`: Array of benchmark comparisons, one for each operation

#### Example

```typescript
import { compareImplementationsWithAdapters, formatBenchmarkComparison } from '@reduct/benchmark';

const comparisons = compareImplementationsWithAdapters(
  ['reduct-list', 'native-array'],
  {
    size: 10000,
    operations: ['get', 'map', 'filter']
  }
);

for (const comparison of comparisons) {
  console.log(formatBenchmarkComparison(comparison));
}
```

## Visualization

### Exporters

#### `exportToCSV`

Export benchmark results to CSV.

```typescript
function exportToCSV(
  data: BenchmarkComparison | BenchmarkComparison[] | ScalabilityResult,
  options?: CSVExportOptions
): string;
```

#### Parameters

- `data`: Benchmark data to export
- `options`: Export options
  - `delimiter`: CSV delimiter (default: ',')
  - `includeHeader`: Whether to include a header row (default: true)
  - `formatNumbers`: Whether to format numbers (default: true)

#### Returns

- `string`: CSV string

#### Example

```typescript
import { compareListWithNativeArray, exportToCSV } from '@reduct/benchmark';
import * as fs from 'fs';

const comparison = compareListWithNativeArray(10000);
const csv = exportToCSV(comparison);
fs.writeFileSync('list-comparison.csv', csv);
```

#### `exportToMarkdown`

Export benchmark results to Markdown.

```typescript
function exportToMarkdown(
  data: BenchmarkComparison | BenchmarkComparison[] | ScalabilityResult,
  options?: MarkdownExportOptions
): string;
```

#### Parameters

- `data`: Benchmark data to export
- `options`: Export options
  - `includeCharts`: Whether to include chart placeholders (default: false)
  - `formatNumbers`: Whether to format numbers (default: true)
  - `title`: Title for the Markdown document

#### Returns

- `string`: Markdown string

#### Example

```typescript
import { compareListWithNativeArray, exportToMarkdown } from '@reduct/benchmark';
import * as fs from 'fs';

const comparison = compareListWithNativeArray(10000);
const markdown = exportToMarkdown(comparison, {
  title: 'List Comparison',
  includeCharts: true
});
fs.writeFileSync('list-comparison.md', markdown);
```

#### `exportToHTML`

Export benchmark results to HTML with interactive charts.

```typescript
function exportToHTML(
  data: BenchmarkComparison | BenchmarkComparison[] | ScalabilityResult,
  options?: HTMLExportOptions
): string;
```

#### Parameters

- `data`: Benchmark data to export
- `options`: Export options
  - `chartType`: Type of chart to use (bar, line, pie) (default: bar)
  - `includeCharts`: Whether to include charts (default: true)
  - `formatNumbers`: Whether to format numbers (default: true)
  - `title`: Title for the HTML document
  - `logScale`: Whether to use logarithmic scale for charts (default: false)

#### Returns

- `string`: HTML string

#### Example

```typescript
import { compareListWithNativeArray, exportToHTML } from '@reduct/benchmark';
import * as fs from 'fs';

const comparison = compareListWithNativeArray(10000);
const html = exportToHTML(comparison, {
  chartType: 'bar',
  title: 'List Comparison',
  logScale: true
});
fs.writeFileSync('list-comparison.html', html);
```

### Templates

#### `registerTemplate`

Register a template for result visualization.

```typescript
function registerTemplate(template: Template): void;
```

#### Parameters

- `template`: Template definition
  - `name`: Unique name for the template
  - `format`: Output format (html, md, csv)
  - `content`: Template content
  - `parent`: Parent template name (optional)
  - `blocks`: Template blocks to override (optional)
  - `description`: Template description (optional)

#### Example

```typescript
import { registerTemplate } from '@reduct/benchmark';

registerTemplate({
  name: 'my-html-template',
  format: 'html',
  description: 'Custom HTML template for benchmark results',
  content: `<!DOCTYPE html>
<html>
<head>
  <title>{{ data.title }}</title>
</head>
<body>
  <h1>{{ data.title }}</h1>
  <p>Generated: {{ helpers.formatDate(new Date()) }}</p>

  <h2>Results</h2>
  <table>
    <thead>
      <tr>
        <th>Implementation</th>
        <th>Time (ms)</th>
        <th>Ops/Sec</th>
      </tr>
    </thead>
    <tbody>
      {{ for result in data.results }}
        <tr>
          <td>{{ result.implementation }}</td>
          <td>{{ helpers.formatNumber(result.timeMs) }}</td>
          <td>{{ helpers.formatNumber(result.opsPerSecond) }}</td>
        </tr>
      {{ endfor }}
    </tbody>
  </table>
</body>
</html>`
});
```

#### `getTemplate`

Get a registered template.

```typescript
function getTemplate(name: string): Template | undefined;
```

#### Parameters

- `name`: Template name

#### Returns

- `Template | undefined`: The registered template or undefined if not found

#### Example

```typescript
import { getTemplate } from '@reduct/benchmark';

const template = getTemplate('html-comparison');
console.log(template?.description);
```

#### `renderTemplate`

Render a template with data.

```typescript
function renderTemplate(
  name: string,
  context: TemplateContext
): string;
```

#### Parameters

- `name`: Template name
- `context`: Template context
  - `data`: Data to render
  - `helpers`: Helper functions
  - `options`: Rendering options

#### Returns

- `string`: Rendered template

#### Example

```typescript
import { renderTemplate, compareListWithNativeArray } from '@reduct/benchmark';
import * as fs from 'fs';

const comparison = compareListWithNativeArray(10000);
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
fs.writeFileSync('list-comparison.html', html);
```

## Types

### `BenchmarkOptions`

Options for benchmarking.

```typescript
interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  measureMemory?: boolean;
}
```

### `BenchmarkResult`

Result of a benchmark.

```typescript
interface BenchmarkResult {
  name: string;
  operation: string;
  inputSize: number;
  timeMs: number;
  opsPerSecond: number;
  memoryBytes?: number;
}
```

### `BenchmarkSuite`

Suite of benchmark results.

```typescript
interface BenchmarkSuite {
  name: string;
  description?: string;
  benchmarks: BenchmarkResult[];
}
```

### `BenchmarkComparison`

Comparison of benchmark results.

```typescript
interface BenchmarkComparison {
  name: string;
  description?: string;
  operation: string;
  inputSize: number;
  results: {
    implementation: string;
    timeMs: number;
    opsPerSecond: number;
    relativeFactor: number;
    memoryBytes?: number;
  }[];
}
```

### `ScalabilityResult`

Result of a scalability benchmark.

```typescript
interface ScalabilityResult {
  implementation: string;
  operation: string;
  results: {
    inputSize: number;
    timeMs: number;
    opsPerSecond: number;
    memoryBytes?: number;
  }[];
}
```

### `ImplementationAdapter`

Adapter for a data structure or algorithm implementation.

```typescript
interface ImplementationAdapter {
  name: string;
  factory: (size: number) => any;
  operations: Record<string, (instance: any, ...args: any[]) => any>;
}
```

### `OperationAdapter`

Adapter for an operation.

```typescript
interface OperationAdapter {
  name: string;
  description: string;
  argsGenerator: (size: number) => any[];
  baseline: (array: any[], ...args: any[]) => any;
}
```

### `AdapterComparisonOptions`

Options for comparing implementations using adapters.

```typescript
interface AdapterComparisonOptions {
  size?: number;
  operations?: string[];
  iterations?: number;
  warmupIterations?: number;
  measureMemory?: boolean;
}
```

### `Template`

Template for result visualization.

```typescript
interface Template {
  name: string;
  format: 'html' | 'md' | 'csv';
  content: string;
  parent?: string;
  blocks?: Record<string, string>;
  description?: string;
}
```

### `TemplateContext`

Context for template rendering.

```typescript
interface TemplateContext {
  data: any;
  helpers?: Record<string, (...args: any[]) => any>;
  options?: Record<string, any>;
}
```
