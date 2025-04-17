# @reduct/benchmark

Comprehensive benchmarking infrastructure for the Reduct library.

[![npm version](https://img.shields.io/npm/v/@reduct/benchmark.svg)](https://www.npmjs.com/package/@reduct/benchmark)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Powerful CLI**: Run benchmarks, compare implementations, and export results from the command line
- **Operation Adapters**: Standardized interfaces for benchmarking operations across different implementations
- **Flexible Comparison System**: Compare different data structures and algorithms with the same operations
- **Rich Visualization**: Export results in multiple formats (CSV, Markdown, HTML with interactive charts)
- **Customizable Templates**: Create and use custom templates for result visualization
- **Scalability Analysis**: Measure how performance scales with input size
- **Comprehensive API**: Use the benchmarking infrastructure programmatically

## Table of Contents

- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [API Usage](#api-usage)
- [Exporters](#exporters)
- [Templates](#templates)
- [Operation Adapters](#operation-adapters)
- [Documentation](#documentation)

## Installation

```bash
# Using npm
npm install @reduct/benchmark

# Using yarn
yarn add @reduct/benchmark

# Using pnpm
pnpm add @reduct/benchmark
```

## CLI Usage

The benchmark package provides a powerful CLI for running benchmarks, comparing implementations, and exporting results.

### Basic Commands

```bash
# Run a benchmark for a specific data structure
npx reduct-benchmark run list -s 10000

# Compare different implementations
npx reduct-benchmark compare list array -s 10000

# Compare using operation adapters
npx reduct-benchmark adapter-compare list array -o get,map,filter -s 10000

# Compare implementations based on capabilities
npx reduct-benchmark complex-compare sequence -o get,map,filter -s 10000

# Measure scalability
npx reduct-benchmark scalability list get -s 5 -m 100000

# Export results to different formats
npx reduct-benchmark export html -i benchmark-results.json -o results.html
```

### Command Options

```bash
# Get help for a specific command
npx reduct-benchmark --help
npx reduct-benchmark compare --help

# Customize output format
npx reduct-benchmark compare list array -s 10000 --output html -f results.html

# Customize chart type
npx reduct-benchmark export html -i results.json -o results.html -c pie

# Use logarithmic scale for charts
npx reduct-benchmark export html -i results.json -o results.html --log-scale

# Use templates
npx reduct-benchmark template-export html -i results.json -o results.html -t html-comparison
```

For detailed CLI documentation, see [CLI.md](./docs/CLI.md).

## API Usage

The benchmark package can also be used programmatically:

```typescript
import {
  compareListWithNativeArray,
  measureListScalability,
  exportToHTML,
  exportToCSV
} from '@reduct/benchmark';

// Run a comparison benchmark
const comparisonResults = compareListWithNativeArray(10000);
console.log(comparisonResults);

// Measure scalability
const scalabilityResults = measureListScalability('get', {
  maxSize: 100000,
  steps: 5
});

// Export results to HTML
const html = exportToHTML(scalabilityResults);
fs.writeFileSync('results.html', html);

// Export results to CSV
const csv = exportToCSV(scalabilityResults);
fs.writeFileSync('results.csv', csv);
```

For more advanced usage:

```typescript
import {
  compareImplementationsWithAdapters,
  getRegisteredImplementation,
  registerImplementation,
  formatBenchmarkComparison
} from '@reduct/benchmark';

// Register a custom implementation
registerImplementation('my-list', {
  name: 'My Custom List',
  factory: (size) => createMyList(size),
  operations: {
    get: (list, index) => list.getAt(index),
    map: (list, fn) => list.mapValues(fn),
    // ...
  }
});

// Compare with registered implementations
const results = compareImplementationsWithAdapters(
  ['my-list', 'reduct-list', 'native-array'],
  {
    size: 10000,
    operations: ['get', 'map', 'filter']
  }
);

// Format and display results
console.log(formatBenchmarkComparison(results[0]));
```

For detailed API documentation, see [API.md](./docs/API.md).

## Exporters

The benchmark package provides several exporters for different output formats:

- **CSV**: Export results as comma-separated values
- **Markdown**: Export results as Markdown tables
- **HTML**: Export results as HTML with interactive charts
- **Console**: Format results for console output

```typescript
import {
  exportToCSV,
  exportToMarkdown,
  exportToHTML,
  formatBenchmarkComparison
} from '@reduct/benchmark';

// Export to CSV
const csv = exportToCSV(results, {
  delimiter: ',',
  includeHeader: true,
  formatNumbers: true
});

// Export to Markdown
const markdown = exportToMarkdown(results, {
  includeCharts: true,
  formatNumbers: true,
  title: 'Benchmark Results'
});

// Export to HTML
const html = exportToHTML(results, {
  chartType: 'bar',
  includeCharts: true,
  formatNumbers: true,
  title: 'Benchmark Results'
});

// Format for console
const formatted = formatBenchmarkComparison(results);
console.log(formatted);
```

For detailed exporter documentation, see [EXPORTERS.md](./docs/EXPORTERS.md).

## Templates

The benchmark package provides a template system for customizing the output format:

```typescript
import {
  renderTemplate,
  registerTemplate,
  getTemplate
} from '@reduct/benchmark';

// Register a custom template
registerTemplate({
  name: 'my-html-template',
  format: 'html',
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

// Render a template
const html = renderTemplate('my-html-template', {
  data: results,
  helpers: {
    formatNumber: (n) => n.toLocaleString(),
    formatDate: (d) => d.toISOString()
  }
});
```

For detailed template documentation, see [TEMPLATES.md](./docs/TEMPLATES.md).

## Operation Adapters

The benchmark package provides a system of operation adapters for standardizing benchmarks across different implementations:

```typescript
import {
  registerImplementation,
  registerOperation,
  getRegisteredImplementation,
  getRegisteredOperation
} from '@reduct/benchmark';

// Register an implementation
registerImplementation('my-list', {
  name: 'My Custom List',
  factory: (size) => createMyList(size),
  operations: {
    get: (list, index) => list.getAt(index),
    map: (list, fn) => list.mapValues(fn),
    filter: (list, fn) => list.filterValues(fn),
    append: (list, value) => list.addLast(value),
    prepend: (list, value) => list.addFirst(value)
  }
});

// Register an operation
registerOperation('reverse', {
  name: 'Reverse',
  description: 'Reverses the elements in the collection',
  argsGenerator: (size) => [],
  baseline: (array) => array.reverse()
});

// Get a registered implementation
const listImpl = getRegisteredImplementation('reduct-list');
console.log(listImpl.name); // "Reduct List"

// Get a registered operation
const getOp = getRegisteredOperation('get');
console.log(getOp.name); // "Get"
```

For detailed adapter documentation, see [ADAPTERS.md](./docs/ADAPTERS.md).

## Documentation

- [CLI Documentation](./docs/CLI.md)
- [API Documentation](./docs/API.md)
- [Exporters Documentation](./docs/EXPORTERS.md)
- [Templates Documentation](./docs/TEMPLATES.md)
- [Adapters Documentation](./docs/ADAPTERS.md)
- [Examples](./docs/EXAMPLES.md)
