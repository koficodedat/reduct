# Exporters Documentation

The `@reduct/benchmark` package provides a variety of exporters for visualizing and sharing benchmark results in different formats.

## Table of Contents

- [Overview](#overview)
- [CSV Exporter](#csv-exporter)
  - [Basic Usage](#basic-usage)
  - [Options](#options)
  - [Example Output](#example-output)
- [Markdown Exporter](#markdown-exporter)
  - [Basic Usage](#basic-usage-1)
  - [Options](#options-1)
  - [Example Output](#example-output-1)
- [HTML Exporter](#html-exporter)
  - [Basic Usage](#basic-usage-2)
  - [Options](#options-2)
  - [Chart Types](#chart-types)
  - [Example Output](#example-output-2)
- [Console Formatter](#console-formatter)
  - [Basic Usage](#basic-usage-3)
  - [Example Output](#example-output-3)
- [Custom Exporters](#custom-exporters)
  - [Creating a Custom Exporter](#creating-a-custom-exporter)
  - [Registering a Custom Exporter](#registering-a-custom-exporter)

## Overview

Exporters convert benchmark results into different formats for visualization and sharing. The benchmark package includes exporters for:

- **CSV**: For data analysis in spreadsheet applications
- **Markdown**: For documentation and GitHub readmes
- **HTML**: For interactive visualizations with charts
- **Console**: For command-line output

Each exporter supports different options and can handle various types of benchmark data:

- `BenchmarkComparison`: Results from comparing different implementations
- `BenchmarkComparison[]`: Multiple comparison results
- `ScalabilityResult`: Results from measuring how performance scales with input size

## CSV Exporter

The CSV exporter converts benchmark results to comma-separated values format, suitable for importing into spreadsheet applications or data analysis tools.

### Basic Usage

```typescript
import { compareListWithNativeArray, exportToCSV } from '@reduct/benchmark';
import * as fs from 'fs';

// Run a comparison benchmark
const comparison = compareListWithNativeArray(10000);

// Export to CSV
const csv = exportToCSV(comparison);
fs.writeFileSync('list-comparison.csv', csv);
```

### Options

The CSV exporter supports the following options:

```typescript
interface CSVExportOptions {
  delimiter?: string;        // CSV delimiter (default: ',')
  includeHeader?: boolean;   // Whether to include a header row (default: true)
  formatNumbers?: boolean;   // Whether to format numbers (default: true)
  precision?: number;        // Number of decimal places for time values (default: 4)
}
```

Example with options:

```typescript
const csv = exportToCSV(comparison, {
  delimiter: ';',
  includeHeader: true,
  formatNumbers: true,
  precision: 6
});
```

### Example Output

For a comparison benchmark:

```
Implementation,Time (ms),Ops/Sec,Relative Factor
Array,0.1234,8103.7276,1.0000
List,0.2345,4264.8187,1.9001
```

For a scalability benchmark:

```
Input Size,Time (ms),Ops/Sec
1000,0.0123,81300.8130
5000,0.0456,21929.8246
10000,0.0789,12674.2712
50000,0.3456,2893.5185
100000,0.6789,1472.9708
```

## Markdown Exporter

The Markdown exporter converts benchmark results to Markdown format, suitable for documentation and GitHub readmes.

### Basic Usage

```typescript
import { compareListWithNativeArray, exportToMarkdown } from '@reduct/benchmark';
import * as fs from 'fs';

// Run a comparison benchmark
const comparison = compareListWithNativeArray(10000);

// Export to Markdown
const markdown = exportToMarkdown(comparison);
fs.writeFileSync('list-comparison.md', markdown);
```

### Options

The Markdown exporter supports the following options:

```typescript
interface MarkdownExportOptions {
  includeCharts?: boolean;    // Whether to include chart placeholders (default: false)
  formatNumbers?: boolean;    // Whether to format numbers (default: true)
  precision?: number;         // Number of decimal places for time values (default: 4)
  title?: string;             // Title for the Markdown document
  description?: string;       // Description for the Markdown document
}
```

Example with options:

```typescript
const markdown = exportToMarkdown(comparison, {
  includeCharts: true,
  formatNumbers: true,
  precision: 6,
  title: 'List Comparison',
  description: 'Comparing Reduct List with native JavaScript arrays'
});
```

### Example Output

For a comparison benchmark:

```markdown
# List Comparison

Comparing Reduct List with native JavaScript arrays

## get Operation Comparison

Comparing get across different implementations

Operation: get
Input size: 10,000

Implementation  | Time (ms) | Ops/Sec   | vs. Fastest
--------------- | --------- | --------- | -----------
Array           |    0.1234 |     8,103 |     fastest
List            |    0.2345 |     4,264 | 1.90x slower

## map Operation Comparison

Comparing map across different implementations

Operation: map
Input size: 10,000

Implementation  | Time (ms) | Ops/Sec   | vs. Fastest
--------------- | --------- | --------- | -----------
Array           |    0.3456 |     2,893 |     fastest
List            |    0.4567 |     2,189 | 1.32x slower
```

## HTML Exporter

The HTML exporter converts benchmark results to HTML format with interactive charts, suitable for web-based visualization.

### Basic Usage

```typescript
import { compareListWithNativeArray, exportToHTML } from '@reduct/benchmark';
import * as fs from 'fs';

// Run a comparison benchmark
const comparison = compareListWithNativeArray(10000);

// Export to HTML
const html = exportToHTML(comparison);
fs.writeFileSync('list-comparison.html', html);
```

### Options

The HTML exporter supports the following options:

```typescript
interface HTMLExportOptions {
  chartType?: 'bar' | 'line' | 'pie';  // Type of chart to use (default: 'bar')
  includeCharts?: boolean;             // Whether to include charts (default: true)
  formatNumbers?: boolean;             // Whether to format numbers (default: true)
  precision?: number;                  // Number of decimal places for time values (default: 4)
  title?: string;                      // Title for the HTML document
  description?: string;                // Description for the HTML document
  logScale?: boolean;                  // Whether to use logarithmic scale for charts (default: false)
  theme?: 'light' | 'dark';            // Theme for the HTML document (default: 'light')
}
```

Example with options:

```typescript
const html = exportToHTML(comparison, {
  chartType: 'bar',
  includeCharts: true,
  formatNumbers: true,
  precision: 6,
  title: 'List Comparison',
  description: 'Comparing Reduct List with native JavaScript arrays',
  logScale: true,
  theme: 'dark'
});
```

### Chart Types

The HTML exporter supports different chart types:

- **Bar**: Good for comparing values across categories
- **Line**: Good for showing trends over a series of values
- **Pie**: Good for showing proportions of a whole

Example with different chart types:

```typescript
// Bar chart
const barChart = exportToHTML(comparison, { chartType: 'bar' });

// Line chart
const lineChart = exportToHTML(scalability, { chartType: 'line' });

// Pie chart
const pieChart = exportToHTML(comparison, { chartType: 'pie' });
```

### Example Output

The HTML exporter generates a complete HTML document with:

- A title and description
- Interactive charts using Chart.js
- Tabular data with formatting
- Metadata about the benchmark

## Console Formatter

The console formatter converts benchmark results to a string format suitable for console output.

### Basic Usage

```typescript
import { compareListWithNativeArray, formatBenchmarkComparison } from '@reduct/benchmark';

// Run a comparison benchmark
const comparison = compareListWithNativeArray(10000);

// Format for console
const formatted = formatBenchmarkComparison(comparison);
console.log(formatted);
```

### Example Output

For a comparison benchmark:

```
## get Operation Comparison

Comparing get across different implementations

Operation: get
Input size: 10,000

Implementation  | Time (ms) | Ops/Sec   | vs. Fastest
--------------- | --------- | --------- | -----------
Array           |    0.1234 |     8,103 |     fastest
List            |    0.2345 |     4,264 | 1.90x slower
```

## Custom Exporters

You can create and register custom exporters for specialized output formats.

### Creating a Custom Exporter

A custom exporter is a function that takes benchmark data and options and returns a string:

```typescript
import { BenchmarkComparison, ScalabilityResult } from '@reduct/benchmark';

// Define the exporter function
function exportToXML(
  data: BenchmarkComparison | BenchmarkComparison[] | ScalabilityResult,
  options?: {
    formatNumbers?: boolean;
    precision?: number;
    rootElement?: string;
  }
): string {
  const opts = {
    formatNumbers: true,
    precision: 4,
    rootElement: 'benchmarks',
    ...options
  };

  // Convert data to XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<${opts.rootElement}>\n`;

  if (Array.isArray(data)) {
    // Handle array of comparisons
    for (const comparison of data) {
      xml += `  <comparison>\n`;
      xml += `    <name>${comparison.name}</name>\n`;
      xml += `    <operation>${comparison.operation}</operation>\n`;
      xml += `    <inputSize>${comparison.inputSize}</inputSize>\n`;
      xml += `    <results>\n`;
      for (const result of comparison.results) {
        xml += `      <result>\n`;
        xml += `        <implementation>${result.implementation}</implementation>\n`;
        xml += `        <timeMs>${opts.formatNumbers ? result.timeMs.toFixed(opts.precision) : result.timeMs}</timeMs>\n`;
        xml += `        <opsPerSecond>${opts.formatNumbers ? Math.floor(result.opsPerSecond).toLocaleString() : result.opsPerSecond}</opsPerSecond>\n`;
        xml += `        <relativeFactor>${opts.formatNumbers ? result.relativeFactor.toFixed(2) : result.relativeFactor}</relativeFactor>\n`;
        if (result.memoryBytes !== undefined) {
          xml += `        <memoryBytes>${opts.formatNumbers ? result.memoryBytes.toLocaleString() : result.memoryBytes}</memoryBytes>\n`;
        }
        xml += `      </result>\n`;
      }
      xml += `    </results>\n`;
      xml += `  </comparison>\n`;
    }
  } else if ('results' in data && Array.isArray(data.results) && 'inputSize' in data.results[0]) {
    // Handle scalability result
    xml += `  <scalability>\n`;
    xml += `    <implementation>${data.implementation}</implementation>\n`;
    xml += `    <operation>${data.operation}</operation>\n`;
    xml += `    <results>\n`;
    for (const result of data.results) {
      xml += `      <result>\n`;
      xml += `        <inputSize>${result.inputSize}</inputSize>\n`;
      xml += `        <timeMs>${opts.formatNumbers ? result.timeMs.toFixed(opts.precision) : result.timeMs}</timeMs>\n`;
      xml += `        <opsPerSecond>${opts.formatNumbers ? Math.floor(result.opsPerSecond).toLocaleString() : result.opsPerSecond}</opsPerSecond>\n`;
      if (result.memoryBytes !== undefined) {
        xml += `        <memoryBytes>${opts.formatNumbers ? result.memoryBytes.toLocaleString() : result.memoryBytes}</memoryBytes>\n`;
      }
      xml += `      </result>\n`;
    }
    xml += `    </results>\n`;
    xml += `  </scalability>\n`;
  } else {
    // Handle single comparison
    const comparison = data as BenchmarkComparison;
    xml += `  <comparison>\n`;
    xml += `    <name>${comparison.name}</name>\n`;
    xml += `    <operation>${comparison.operation}</operation>\n`;
    xml += `    <inputSize>${comparison.inputSize}</inputSize>\n`;
    xml += `    <results>\n`;
    for (const result of comparison.results) {
      xml += `      <result>\n`;
      xml += `        <implementation>${result.implementation}</implementation>\n`;
      xml += `        <timeMs>${opts.formatNumbers ? result.timeMs.toFixed(opts.precision) : result.timeMs}</timeMs>\n`;
      xml += `        <opsPerSecond>${opts.formatNumbers ? Math.floor(result.opsPerSecond).toLocaleString() : result.opsPerSecond}</opsPerSecond>\n`;
      xml += `        <relativeFactor>${opts.formatNumbers ? result.relativeFactor.toFixed(2) : result.relativeFactor}</relativeFactor>\n`;
      if (result.memoryBytes !== undefined) {
        xml += `        <memoryBytes>${opts.formatNumbers ? result.memoryBytes.toLocaleString() : result.memoryBytes}</memoryBytes>\n`;
      }
      xml += `      </result>\n`;
    }
    xml += `    </results>\n`;
    xml += `  </comparison>\n`;
  }

  xml += `</${opts.rootElement}>\n`;
  return xml;
}
```

### Registering a Custom Exporter

You can register your custom exporter with the benchmark package:

```typescript
import { registerExporter } from '@reduct/benchmark';

// Register the XML exporter
registerExporter('xml', exportToXML);

// Now you can use it like any other exporter
const xml = exportToFormat('xml', comparison, {
  formatNumbers: true,
  precision: 6,
  rootElement: 'benchmark-results'
});
fs.writeFileSync('list-comparison.xml', xml);
```

Example XML output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<benchmark-results>
  <comparison>
    <name>get Operation Comparison</name>
    <operation>get</operation>
    <inputSize>10000</inputSize>
    <results>
      <result>
        <implementation>Array</implementation>
        <timeMs>0.123400</timeMs>
        <opsPerSecond>8,103</opsPerSecond>
        <relativeFactor>1.00</relativeFactor>
      </result>
      <result>
        <implementation>List</implementation>
        <timeMs>0.234500</timeMs>
        <opsPerSecond>4,264</opsPerSecond>
        <relativeFactor>1.90</relativeFactor>
      </result>
    </results>
  </comparison>
</benchmark-results>
```
