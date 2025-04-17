# Templates Documentation

The `@reduct/benchmark` package includes a flexible template system for customizing the visualization of benchmark results.

## Table of Contents

- [Overview](#overview)
- [Template Basics](#template-basics)
- [Template Syntax](#template-syntax)
- [Using Templates](#using-templates)
- [Built-in Templates](#built-in-templates)
- [Creating Custom Templates](#creating-custom-templates)
- [Template Inheritance](#template-inheritance)
- [Template Helpers](#template-helpers)

## Overview

Templates provide a way to customize how benchmark results are presented. They allow you to:

- Create consistent formatting for benchmark results
- Customize the appearance of charts and tables
- Add additional information or context to results
- Create specialized visualizations for different types of benchmarks

## Template Basics

A template is defined by:

- A unique name
- An output format (HTML, Markdown, CSV)
- Template content with placeholders for data
- Optional parent template for inheritance
- Optional description

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

## Template Syntax

Templates use a simple syntax for inserting data and control flow:

- `{{ variable }}` - Insert a variable
- `{{ if condition }} ... {{ endif }}` - Conditional blocks
- `{{ for item in collection }} ... {{ endfor }}` - Loops
- `{{ helpers.functionName(args) }}` - Helper functions

Example template:

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{ data.title || 'Benchmark Results' }}</title>
</head>
<body>
  <h1>{{ data.title || 'Benchmark Results' }}</h1>
  
  {{ if data.description }}
  <p>{{ data.description }}</p>
  {{ endif }}
  
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
</html>
```

## Using Templates

Templates can be used in several ways:

### 1. Rendering a Template Programmatically

```typescript
import { renderTemplate } from '@reduct/benchmark';

const html = renderTemplate('html-comparison', {
  data: comparisonResults,
  helpers: {
    formatNumber: (n) => n.toLocaleString(),
    formatDate: (d) => d.toISOString()
  },
  options: {
    chartType: 'bar',
    logScale: true
  }
});
```

### 2. Using Templates with the CLI

```bash
npx reduct-benchmark template-export html -i results.json -o results.html -t html-comparison
```

### 3. Using Templates with Exporters

```typescript
import { exportWithTemplate } from '@reduct/benchmark';

const html = exportWithTemplate('html-comparison', comparisonResults, {
  chartType: 'bar',
  logScale: true,
  title: 'List Comparison'
});
```

## Built-in Templates

The benchmark package includes several built-in templates:

### HTML Templates

- `html-base`: Base HTML template with common structure
- `html-comparison`: Template for comparison results
- `html-scalability`: Template for scalability results
- `html-multi-comparison`: Template for multiple comparison results

### Markdown Templates

- `markdown-base`: Base Markdown template with common structure
- `markdown-comparison`: Template for comparison results
- `markdown-scalability`: Template for scalability results
- `markdown-multi-comparison`: Template for multiple comparison results

### CSV Templates

- `csv-comparison`: Template for comparison results
- `csv-scalability`: Template for scalability results

## Creating Custom Templates

You can create and register your own templates:

```typescript
import { registerTemplate } from '@reduct/benchmark';

registerTemplate({
  name: 'my-html-template',
  format: 'html',
  description: 'Custom HTML template for benchmark results',
  content: `<!DOCTYPE html>
<html>
<head>
  <title>{{ data.title || 'Custom Benchmark Results' }}</title>
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>{{ data.title || 'Custom Benchmark Results' }}</h1>
  <p>Generated: {{ helpers.formatDate(new Date()) }}</p>
  
  <h2>Results</h2>
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
        <tr>
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
```

## Template Inheritance

Templates can inherit from other templates to reuse common structure:

```typescript
import { registerTemplate } from '@reduct/benchmark';

// Register a base template
registerTemplate({
  name: 'my-base-template',
  format: 'html',
  content: `<!DOCTYPE html>
<html>
<head>
  <title>{{ data.title }}</title>
  <style>{{ block 'styles' }}</style>
</head>
<body>
  <header>
    <h1>{{ data.title }}</h1>
  </header>
  <main>
    {{ block 'content' }}
  </main>
  <footer>
    Generated: {{ helpers.formatDate(new Date()) }}
  </footer>
</body>
</html>`
});

// Register a child template that inherits from the base
registerTemplate({
  name: 'my-child-template',
  format: 'html',
  parent: 'my-base-template',
  blocks: {
    styles: `
      body { font-family: Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f2f2f2; }
    `,
    content: `
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
    `
  }
});
```

## Template Helpers

Templates can use helper functions to format data:

```typescript
const helpers = {
  // Format a number with commas
  formatNumber: (n) => n.toLocaleString(),
  
  // Format a date
  formatDate: (d) => d.toISOString(),
  
  // Convert to JSON
  toJSON: (obj) => JSON.stringify(obj, null, 2),
  
  // Calculate percentage
  percentage: (value, total) => ((value / total) * 100).toFixed(2) + '%',
  
  // Format time in appropriate units
  formatTime: (ms) => {
    if (ms < 1) return (ms * 1000).toFixed(2) + ' μs';
    if (ms < 1000) return ms.toFixed(2) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }
};

const html = renderTemplate('my-template', {
  data: results,
  helpers
});
```

You can provide custom helpers when rendering a template:

```typescript
const html = renderTemplate('my-template', {
  data: results,
  helpers: {
    formatNumber: (n) => n.toFixed(6),
    highlight: (value, threshold) => value > threshold ? `<span class="highlight">${value}</span>` : value
  }
});
```
