/**
 * Template-based exporters for benchmark results
 * 
 * @packageDocumentation
 */

import { BenchmarkResult, BenchmarkSuite, BenchmarkComparison, ScalabilityResult } from '../types';
import { renderTemplate, defaultHelpers, TemplateOptions } from './templates';

/**
 * HTML export options
 */
export interface HTMLTemplateExportOptions {
  /** Include timestamp in the output */
  includeTimestamp?: boolean;
  /** Include metadata section */
  includeMetadata?: boolean;
  /** Format numbers with thousands separator */
  formatNumbers?: boolean;
  /** Include a table of contents */
  includeTableOfContents?: boolean;
  /** Include charts */
  includeCharts?: boolean;
  /** Chart type (bar, line, pie, radar) */
  chartType?: 'bar' | 'line' | 'pie' | 'radar';
  /** Chart options */
  chartOptions?: {
    /** Color scheme for the chart */
    colorScheme?: string[];
    /** Type of y-axis scale (linear, logarithmic) */
    yAxisScale?: 'linear' | 'logarithmic';
    /** Custom labels for the axes */
    axisLabels?: {
      x?: string;
      y?: string;
      y2?: string;
    };
    /** Whether to show the legend */
    showLegend?: boolean;
    /** Legend position */
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    /** Whether to show tooltips */
    showTooltips?: boolean;
    /** Whether to animate the chart */
    animate?: boolean;
  };
  /** Page title */
  title?: string;
  /** Theme name */
  theme?: string;
  /** Custom CSS */
  customCSS?: string;
  /** Custom header content */
  header?: string;
  /** Custom footer content */
  footer?: string;
}

/**
 * Markdown export options
 */
export interface MarkdownTemplateExportOptions {
  /** Include timestamp in the output */
  includeTimestamp?: boolean;
  /** Include metadata section */
  includeMetadata?: boolean;
  /** Format numbers with thousands separator */
  formatNumbers?: boolean;
  /** Include a table of contents */
  includeTableOfContents?: boolean;
  /** Include charts */
  includeCharts?: boolean;
  /** Document title */
  title?: string;
  /** Custom header content */
  header?: string;
  /** Custom footer content */
  footer?: string;
}

/**
 * CSV export options
 */
export interface CSVTemplateExportOptions {
  /** Include header comments */
  includeHeader?: boolean;
  /** Include column headers */
  includeColumns?: boolean;
  /** Format numbers with thousands separator */
  formatNumbers?: boolean;
  /** Delimiter character */
  delimiter?: string;
  /** Custom header content */
  header?: string;
}

/**
 * Default HTML export options
 */
const defaultHTMLOptions: HTMLTemplateExportOptions = {
  includeTimestamp: true,
  includeMetadata: true,
  formatNumbers: true,
  includeTableOfContents: true,
  includeCharts: true,
  chartType: 'bar',
  chartOptions: {
    colorScheme: [
      'rgba(54, 162, 235, 0.5)',   // Blue
      'rgba(75, 192, 192, 0.5)',    // Teal
      'rgba(255, 99, 132, 0.5)',    // Red
      'rgba(255, 159, 64, 0.5)',    // Orange
      'rgba(153, 102, 255, 0.5)',   // Purple
      'rgba(255, 205, 86, 0.5)',    // Yellow
    ],
    yAxisScale: 'linear',
    showLegend: true,
    legendPosition: 'top',
    showTooltips: true,
    animate: true
  },
  title: 'Benchmark Results',
  theme: 'default',
};

/**
 * Default Markdown export options
 */
const defaultMarkdownOptions: MarkdownTemplateExportOptions = {
  includeTimestamp: true,
  includeMetadata: true,
  formatNumbers: true,
  includeTableOfContents: true,
  includeCharts: false,
  title: 'Benchmark Results',
};

/**
 * Default CSV export options
 */
const defaultCSVOptions: CSVTemplateExportOptions = {
  includeHeader: true,
  includeColumns: true,
  formatNumbers: false,
  delimiter: ',',
};

/**
 * Exports a benchmark comparison to HTML using templates
 * 
 * @param comparison - Benchmark comparison to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportComparisonToHTMLTemplate(comparison: BenchmarkComparison, options?: HTMLTemplateExportOptions): string {
  const opts = { ...defaultHTMLOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    theme: opts.theme,
    customCSS: opts.customCSS,
    header: opts.header,
    footer: opts.footer,
    variables: {
      chartType: opts.chartType,
      yAxisScale: opts.chartOptions?.yAxisScale,
      showLegend: opts.chartOptions?.showLegend,
      legendPosition: opts.chartOptions?.legendPosition,
      showTooltips: opts.chartOptions?.showTooltips,
      animate: opts.chartOptions?.animate,
      formatNumbers: opts.formatNumbers,
      includeCharts: opts.includeCharts,
      includeTableOfContents: opts.includeTableOfContents,
      includeMetadata: opts.includeMetadata,
      includeTimestamp: opts.includeTimestamp,
    },
  };
  
  // Render the template
  return renderTemplate('html-comparison', {
    data: {
      ...comparison,
      title: opts.title || comparison.name,
    },
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
}

/**
 * Exports a scalability result to HTML using templates
 * 
 * @param result - Scalability result to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportScalabilityToHTMLTemplate(result: ScalabilityResult, options?: HTMLTemplateExportOptions): string {
  const opts = { ...defaultHTMLOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    theme: opts.theme,
    customCSS: opts.customCSS,
    header: opts.header,
    footer: opts.footer,
    variables: {
      chartType: opts.chartType,
      yAxisScale: opts.chartOptions?.yAxisScale,
      showLegend: opts.chartOptions?.showLegend,
      legendPosition: opts.chartOptions?.legendPosition,
      showTooltips: opts.chartOptions?.showTooltips,
      animate: opts.chartOptions?.animate,
      formatNumbers: opts.formatNumbers,
      includeCharts: opts.includeCharts,
      includeTableOfContents: opts.includeTableOfContents,
      includeMetadata: opts.includeMetadata,
      includeTimestamp: opts.includeTimestamp,
    },
  };
  
  // Render the template
  return renderTemplate('html-scalability', {
    data: {
      ...result,
      title: opts.title || `${result.implementation} Scalability (${result.operation})`,
    },
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
}

/**
 * Exports benchmark results to HTML using templates
 * 
 * @param results - Benchmark results to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportResultsToHTMLTemplate(results: BenchmarkResult[], options?: HTMLTemplateExportOptions): string {
  const opts = { ...defaultHTMLOptions, ...options };
  
  // Group results by operation
  const resultsByOperation: Record<string, BenchmarkResult[]> = {};
  for (const result of results) {
    const operation = result.operation;
    if (!resultsByOperation[operation]) {
      resultsByOperation[operation] = [];
    }
    resultsByOperation[operation].push(result);
  }
  
  // If there's only one operation, create a comparison
  if (Object.keys(resultsByOperation).length === 1) {
    const operation = Object.keys(resultsByOperation)[0];
    const operationResults = resultsByOperation[operation];
    
    // Find the fastest result
    const sortedResults = [...operationResults].sort((a, b) => a.timeMs - b.timeMs);
    const fastest = sortedResults[0];
    
    // Create a comparison object
    const comparison: BenchmarkComparison = {
      name: opts.title || `${operation} Operation Comparison`,
      description: `Comparing ${operation} across different implementations`,
      operation,
      inputSize: operationResults[0].inputSize,
      results: operationResults.map(r => ({
        implementation: r.name,
        timeMs: r.timeMs,
        opsPerSecond: r.opsPerSecond,
        relativeFactor: r.timeMs / fastest.timeMs,
        memoryBytes: r.memoryBytes,
      })),
    };
    
    return exportComparisonToHTMLTemplate(comparison, opts);
  }
  
  // Otherwise, use the multi-operation template
  // This would need to be implemented separately
  // For now, we'll just return a simple HTML page
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title || 'Benchmark Results'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
  </style>
</head>
<body>
  <h1>${opts.title || 'Benchmark Results'}</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  <h2>Summary</h2>
  <p>Total benchmarks: ${results.length}</p>
  <p>Operations: ${[...new Set(results.map(r => r.operation))].join(', ')}</p>
  <p>Implementations: ${[...new Set(results.map(r => r.name))].join(', ')}</p>
  
  ${Object.entries(resultsByOperation).map(([operation, operationResults]) => `
    <h2>${operation} Operation</h2>
    <table>
      <thead>
        <tr>
          <th>Implementation</th>
          <th>Input Size</th>
          <th>Time (ms)</th>
          <th>Ops/Sec</th>
          ${operationResults.some(r => r.memoryBytes !== undefined) ? '<th>Memory (KB)</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${operationResults.map(result => `
          <tr>
            <td>${result.name}</td>
            <td>${opts.formatNumbers ? result.inputSize.toLocaleString() : result.inputSize}</td>
            <td>${opts.formatNumbers ? result.timeMs.toLocaleString() : result.timeMs}</td>
            <td>${opts.formatNumbers ? Math.floor(result.opsPerSecond).toLocaleString() : Math.floor(result.opsPerSecond)}</td>
            ${result.memoryBytes !== undefined ? `<td>${(result.memoryBytes / 1024).toFixed(2)}</td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `).join('')}
</body>
</html>`;
}

/**
 * Exports a benchmark comparison to Markdown using templates
 * 
 * @param comparison - Benchmark comparison to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportComparisonToMarkdownTemplate(comparison: BenchmarkComparison, options?: MarkdownTemplateExportOptions): string {
  const opts = { ...defaultMarkdownOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    header: opts.header,
    footer: opts.footer,
    variables: {
      formatNumbers: opts.formatNumbers,
      includeCharts: opts.includeCharts,
      includeTableOfContents: opts.includeTableOfContents,
      includeMetadata: opts.includeMetadata,
      includeTimestamp: opts.includeTimestamp,
    },
  };
  
  // Render the template
  return renderTemplate('markdown-comparison', {
    data: {
      ...comparison,
      title: opts.title || comparison.name,
    },
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
}

/**
 * Exports a scalability result to Markdown using templates
 * 
 * @param result - Scalability result to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportScalabilityToMarkdownTemplate(result: ScalabilityResult, options?: MarkdownTemplateExportOptions): string {
  const opts = { ...defaultMarkdownOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    header: opts.header,
    footer: opts.footer,
    variables: {
      formatNumbers: opts.formatNumbers,
      includeCharts: opts.includeCharts,
      includeTableOfContents: opts.includeTableOfContents,
      includeMetadata: opts.includeMetadata,
      includeTimestamp: opts.includeTimestamp,
    },
  };
  
  // Render the template
  return renderTemplate('markdown-scalability', {
    data: {
      ...result,
      title: opts.title || `${result.implementation} Scalability (${result.operation})`,
    },
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
}

/**
 * Exports benchmark results to Markdown using templates
 * 
 * @param results - Benchmark results to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportResultsToMarkdownTemplate(results: BenchmarkResult[], options?: MarkdownTemplateExportOptions): string {
  const opts = { ...defaultMarkdownOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    header: opts.header,
    footer: opts.footer,
    variables: {
      formatNumbers: opts.formatNumbers,
      includeCharts: opts.includeCharts,
      includeTableOfContents: opts.includeTableOfContents,
      includeMetadata: opts.includeMetadata,
      includeTimestamp: opts.includeTimestamp,
    },
  };
  
  // Render the template
  return renderTemplate('markdown-multi-operation', {
    data: results,
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
}

/**
 * Exports a benchmark comparison to CSV using templates
 * 
 * @param comparison - Benchmark comparison to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportComparisonToCSVTemplate(comparison: BenchmarkComparison, options?: CSVTemplateExportOptions): string {
  const opts = { ...defaultCSVOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    header: opts.header,
    variables: {
      includeHeader: opts.includeHeader,
      includeColumns: opts.includeColumns,
      formatNumbers: opts.formatNumbers,
      delimiter: opts.delimiter,
    },
  };
  
  // Render the template
  let csv = renderTemplate('csv-comparison', {
    data: comparison,
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
  
  // Replace commas with the specified delimiter if it's not a comma
  if (opts.delimiter && opts.delimiter !== ',') {
    csv = csv.replace(/,/g, opts.delimiter);
  }
  
  return csv;
}

/**
 * Exports a scalability result to CSV using templates
 * 
 * @param result - Scalability result to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportScalabilityToCSVTemplate(result: ScalabilityResult, options?: CSVTemplateExportOptions): string {
  const opts = { ...defaultCSVOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    header: opts.header,
    variables: {
      includeHeader: opts.includeHeader,
      includeColumns: opts.includeColumns,
      formatNumbers: opts.formatNumbers,
      delimiter: opts.delimiter,
    },
  };
  
  // Render the template
  let csv = renderTemplate('csv-scalability', {
    data: result,
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
  
  // Replace commas with the specified delimiter if it's not a comma
  if (opts.delimiter && opts.delimiter !== ',') {
    csv = csv.replace(/,/g, opts.delimiter);
  }
  
  return csv;
}

/**
 * Exports benchmark results to CSV using templates
 * 
 * @param results - Benchmark results to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportResultsToCSVTemplate(results: BenchmarkResult[], options?: CSVTemplateExportOptions): string {
  const opts = { ...defaultCSVOptions, ...options };
  
  // Convert options to template options
  const templateOptions: TemplateOptions = {
    header: opts.header,
    variables: {
      includeHeader: opts.includeHeader,
      includeColumns: opts.includeColumns,
      formatNumbers: opts.formatNumbers,
      delimiter: opts.delimiter,
    },
  };
  
  // Render the template
  let csv = renderTemplate('csv-multi-operation', {
    data: results,
    options: templateOptions,
    helpers: {
      ...defaultHelpers,
      // Add any additional helpers here
    },
  });
  
  // Replace commas with the specified delimiter if it's not a comma
  if (opts.delimiter && opts.delimiter !== ',') {
    csv = csv.replace(/,/g, opts.delimiter);
  }
  
  return csv;
}

/**
 * Exports data to HTML using templates
 * 
 * @param data - Data to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportToHTMLTemplate(data: BenchmarkResult[] | BenchmarkSuite | BenchmarkComparison | ScalabilityResult, options?: HTMLTemplateExportOptions): string {
  // Handle different data types
  if (Array.isArray(data)) {
    return exportResultsToHTMLTemplate(data, options);
  } else if ('benchmarks' in data) {
    return exportResultsToHTMLTemplate(data.benchmarks, {
      ...options,
      title: options?.title || data.name,
    });
  } else if ('results' in data && 'operation' in data && 'inputSize' in data) {
    return exportComparisonToHTMLTemplate(data as BenchmarkComparison, options);
  } else if ('results' in data && 'implementation' in data && 'operation' in data) {
    return exportScalabilityToHTMLTemplate(data as ScalabilityResult, options);
  } else {
    throw new Error('Unsupported data format');
  }
}

/**
 * Exports data to Markdown using templates
 * 
 * @param data - Data to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportToMarkdownTemplate(data: BenchmarkResult[] | BenchmarkSuite | BenchmarkComparison | ScalabilityResult, options?: MarkdownTemplateExportOptions): string {
  // Handle different data types
  if (Array.isArray(data)) {
    return exportResultsToMarkdownTemplate(data, options);
  } else if ('benchmarks' in data) {
    return exportResultsToMarkdownTemplate(data.benchmarks, {
      ...options,
      title: options?.title || data.name,
    });
  } else if ('results' in data && 'operation' in data && 'inputSize' in data) {
    return exportComparisonToMarkdownTemplate(data as BenchmarkComparison, options);
  } else if ('results' in data && 'implementation' in data && 'operation' in data) {
    return exportScalabilityToMarkdownTemplate(data as ScalabilityResult, options);
  } else {
    throw new Error('Unsupported data format');
  }
}

/**
 * Exports data to CSV using templates
 * 
 * @param data - Data to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportToCSVTemplate(data: BenchmarkResult[] | BenchmarkSuite | BenchmarkComparison | ScalabilityResult, options?: CSVTemplateExportOptions): string {
  // Handle different data types
  if (Array.isArray(data)) {
    return exportResultsToCSVTemplate(data, options);
  } else if ('benchmarks' in data) {
    return exportResultsToCSVTemplate(data.benchmarks, options);
  } else if ('results' in data && 'operation' in data && 'inputSize' in data) {
    return exportComparisonToCSVTemplate(data as BenchmarkComparison, options);
  } else if ('results' in data && 'implementation' in data && 'operation' in data) {
    return exportScalabilityToCSVTemplate(data as ScalabilityResult, options);
  } else {
    throw new Error('Unsupported data format');
  }
}
