/**
 * Benchmark result exporters
 *
 * @packageDocumentation
 */

import { BenchmarkResult, BenchmarkSuite, BenchmarkComparison, ScalabilityResult } from '../types';
import { ComplexComparisonResult } from '../comparison/complex';

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Include headers in the CSV output */
  includeHeaders?: boolean;
  /** Delimiter to use (default: ',') */
  delimiter?: string;
  /** Format numbers with thousands separator */
  formatNumbers?: boolean;
  /** Include timestamp in the output */
  includeTimestamp?: boolean;
  /** Include metadata as comments */
  includeMetadata?: boolean;
}

/**
 * Default CSV export options
 */
const defaultCSVOptions: CSVExportOptions = {
  includeHeaders: true,
  delimiter: ',',
  formatNumbers: false,
  includeTimestamp: true,
  includeMetadata: true,
};

/**
 * Escapes a value for CSV
 *
 * @param value - Value to escape
 * @param delimiter - Delimiter being used
 * @returns Escaped value
 */
function escapeCSV(value: any, delimiter: string = ','): string {
  const stringValue = String(value);
  // If the value contains the delimiter, a newline, or a quote, wrap it in quotes
  if (stringValue.includes(delimiter) || stringValue.includes('\n') || stringValue.includes('"')) {
    // Double up any quotes in the value
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Formats a number for CSV output
 *
 * @param value - Number to format
 * @param formatNumbers - Whether to format with thousands separator
 * @returns Formatted number as string
 */
function formatNumberForCSV(value: number, formatNumbers: boolean = false): string {
  if (formatNumbers) {
    return value.toLocaleString();
  }
  return value.toString();
}

/**
 * Exports benchmark results to CSV format
 *
 * @param results - Benchmark results to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportResultsToCSV(results: BenchmarkResult[], options?: CSVExportOptions): string {
  const opts = { ...defaultCSVOptions, ...options };
  const { delimiter, includeHeaders, formatNumbers, includeTimestamp, includeMetadata } = opts;

  let csv = '';

  // Add metadata as comments if requested
  if (includeMetadata) {
    csv += `# Benchmark Results\n`;
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Number of results: ${results.length}\n`;
    csv += `# Operations: ${[...new Set(results.map(r => r.operation))].join(', ')}\n`;
    csv += `# Implementations: ${[...new Set(results.map(r => r.name))].join(', ')}\n`;
    csv += `#\n`;
  } else if (includeTimestamp) {
    // Just add timestamp if metadata not requested but timestamp is
    csv += `# Generated: ${new Date().toISOString()}\n`;
  }

  // Add headers if requested
  if (includeHeaders) {
    const headers = ['Name', 'Operation', 'InputSize', 'TimeMs', 'OpsPerSecond'];

    if (results.some(r => r.memoryBytes !== undefined)) {
      headers.push('MemoryBytes');
    }

    csv += headers.join(delimiter) + '\n';
  }

  // Add data rows
  for (const result of results) {
    const row = [
      escapeCSV(result.name, delimiter),
      escapeCSV(result.operation, delimiter),
      formatNumberForCSV(result.inputSize, formatNumbers),
      formatNumberForCSV(result.timeMs, formatNumbers),
      formatNumberForCSV(result.opsPerSecond, formatNumbers)
    ];

    if (results.some(r => r.memoryBytes !== undefined)) {
      row.push(formatNumberForCSV(result.memoryBytes || 0, formatNumbers));
    }

    csv += row.join(delimiter) + '\n';
  }

  return csv;
}

/**
 * Exports a benchmark suite to CSV format
 *
 * @param suite - Benchmark suite to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportSuiteToCSV(suite: BenchmarkSuite, options?: CSVExportOptions): string {
  const opts = { ...defaultCSVOptions, ...options };

  // Add suite-specific metadata
  if (opts.includeMetadata) {
    const customOptions: CSVExportOptions = { ...opts };
    let csv = '';

    csv += `# Suite: ${suite.name}\n`;
    if (suite.description) {
      csv += `# Description: ${suite.description}\n`;
    }
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `#\n`;

    // Don't include timestamp again in the results export
    customOptions.includeTimestamp = false;

    return csv + exportResultsToCSV(suite.benchmarks, customOptions);
  }

  return exportResultsToCSV(suite.benchmarks, opts);
}

/**
 * Exports a benchmark comparison to CSV format
 *
 * @param comparison - Benchmark comparison to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportComparisonToCSV(comparison: BenchmarkComparison, options?: CSVExportOptions): string {
  const opts = { ...defaultCSVOptions, ...options };
  const { delimiter, includeHeaders, formatNumbers, includeTimestamp, includeMetadata } = opts;

  let csv = '';

  // Add metadata as comments if requested
  if (includeMetadata) {
    csv += `# Comparison: ${comparison.name}\n`;
    if (comparison.description) {
      csv += `# Description: ${comparison.description}\n`;
    }
    csv += `# Operation: ${comparison.operation}\n`;
    csv += `# Input Size: ${comparison.inputSize}\n`;
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Number of implementations: ${comparison.results.length}\n`;
    csv += `# Implementations: ${comparison.results.map(r => r.implementation).join(', ')}\n`;
    csv += `#\n`;
  } else if (includeTimestamp) {
    // Just add timestamp if metadata not requested but timestamp is
    csv += `# Generated: ${new Date().toISOString()}\n`;
  }

  // Add headers if requested
  if (includeHeaders) {
    const headers = ['Implementation', 'Operation', 'InputSize', 'TimeMs', 'OpsPerSecond', 'RelativeFactor'];

    if (comparison.results.some(r => r.memoryBytes !== undefined)) {
      headers.push('MemoryBytes');
    }

    csv += headers.join(delimiter) + '\n';
  }

  // Add data rows
  for (const result of comparison.results) {
    const row = [
      escapeCSV(result.implementation, delimiter),
      escapeCSV(comparison.operation, delimiter),
      formatNumberForCSV(comparison.inputSize, formatNumbers),
      formatNumberForCSV(result.timeMs, formatNumbers),
      formatNumberForCSV(result.opsPerSecond, formatNumbers),
      formatNumberForCSV(result.relativeFactor, formatNumbers)
    ];

    if (comparison.results.some(r => r.memoryBytes !== undefined)) {
      row.push(formatNumberForCSV(result.memoryBytes || 0, formatNumbers));
    }

    csv += row.join(delimiter) + '\n';
  }

  return csv;
}

/**
 * Exports a scalability result to CSV format
 *
 * @param result - Scalability result to export
 * @param options - CSV export options
 * @returns CSV string
 */
export function exportScalabilityToCSV(result: ScalabilityResult, options?: CSVExportOptions): string {
  const opts = { ...defaultCSVOptions, ...options };
  const { delimiter, includeHeaders, formatNumbers, includeTimestamp, includeMetadata } = opts;

  let csv = '';

  // Add metadata as comments if requested
  if (includeMetadata) {
    csv += `# Scalability: ${result.implementation} (${result.operation})\n`;
    csv += `# Operation: ${result.operation}\n`;
    csv += `# Implementation: ${result.implementation}\n`;
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Number of data points: ${result.results.length}\n`;
    csv += `# Input size range: ${Math.min(...result.results.map(r => r.inputSize))} - ${Math.max(...result.results.map(r => r.inputSize))}\n`;
    csv += `#\n`;
  } else if (includeTimestamp) {
    // Just add timestamp if metadata not requested but timestamp is
    csv += `# Generated: ${new Date().toISOString()}\n`;
  }

  // Add headers if requested
  if (includeHeaders) {
    const headers = ['Implementation', 'Operation', 'InputSize', 'TimeMs', 'OpsPerSecond'];

    if (result.results.some(r => r.memoryBytes !== undefined)) {
      headers.push('MemoryBytes');
    }

    csv += headers.join(delimiter) + '\n';
  }

  // Add data rows
  for (const entry of result.results) {
    const row = [
      escapeCSV(result.implementation, delimiter),
      escapeCSV(result.operation, delimiter),
      formatNumberForCSV(entry.inputSize, formatNumbers),
      formatNumberForCSV(entry.timeMs, formatNumbers),
      formatNumberForCSV(entry.opsPerSecond, formatNumbers)
    ];

    if (result.results.some(r => r.memoryBytes !== undefined)) {
      row.push(formatNumberForCSV(entry.memoryBytes || 0, formatNumbers));
    }

    csv += row.join(delimiter) + '\n';
  }

  return csv;
}

/**
 * Markdown export options
 */
export interface MarkdownExportOptions {
  /** Include timestamp in the output */
  includeTimestamp?: boolean;
  /** Include metadata section */
  includeMetadata?: boolean;
  /** Format numbers with thousands separator */
  formatNumbers?: boolean;
  /** Include a table of contents */
  includeTableOfContents?: boolean;
  /** Include charts (as links to external services) */
  includeCharts?: boolean;
}

/**
 * Default Markdown export options
 */
const defaultMarkdownOptions: MarkdownExportOptions = {
  includeTimestamp: true,
  includeMetadata: true,
  formatNumbers: true,
  includeTableOfContents: true,
  includeCharts: false,
};

/**
 * Formats a number for Markdown output
 *
 * @param value - Number to format
 * @param formatNumbers - Whether to format with thousands separator
 * @returns Formatted number as string
 */
function formatNumberForMarkdown(value: number, formatNumbers: boolean = true): string {
  if (formatNumbers) {
    return value.toLocaleString();
  }
  return value.toString();
}

/**
 * Exports benchmark results to Markdown format
 *
 * @param results - Benchmark results to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportResultsToMarkdown(results: BenchmarkResult[], options?: MarkdownExportOptions): string {
  const opts = { ...defaultMarkdownOptions, ...options };
  const { includeTimestamp, includeMetadata, formatNumbers, includeTableOfContents } = opts;

  let md = '# Benchmark Results\n\n';

  if (includeTimestamp) {
    md += `*Generated: ${new Date().toISOString()}*\n\n`;
  }

  if (includeTableOfContents) {
    md += '## Table of Contents\n\n';
    md += '- [Summary](#summary)\n';
    md += '- [Results](#results)\n';
    if (includeMetadata) {
      md += '- [Metadata](#metadata)\n';
    }
    md += '\n';
  }

  // Summary section
  md += '## Summary\n\n';
  md += `- **Total benchmarks:** ${results.length}\n`;
  md += `- **Operations:** ${[...new Set(results.map(r => r.operation))].join(', ')}\n`;
  md += `- **Implementations:** ${[...new Set(results.map(r => r.name))].join(', ')}\n`;
  md += '\n';

  // Results section
  md += '## Results\n\n';

  // Group by operation
  const operationGroups = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    if (!operationGroups.has(result.operation)) {
      operationGroups.set(result.operation, []);
    }
    operationGroups.get(result.operation)!.push(result);
  }

  // Create a table for each operation
  for (const [operation, opResults] of operationGroups.entries()) {
    md += `### ${operation} Operation\n\n`;

    // Table header
    md += '| Implementation | Input Size | Time (ms) | Ops/Sec |';
    if (opResults.some(r => r.memoryBytes !== undefined)) {
      md += ' Memory (KB) |';
    }
    md += '\n';

    // Table separator
    md += '| ------------- | ---------- | -------- | ------- |';
    if (opResults.some(r => r.memoryBytes !== undefined)) {
      md += ' ----------- |';
    }
    md += '\n';

    // Sort by time
    const sortedResults = [...opResults].sort((a, b) => a.timeMs - b.timeMs);

    // Table rows
    for (const result of sortedResults) {
      md += `| ${result.name} | ${formatNumberForMarkdown(result.inputSize, formatNumbers)} | ${formatNumberForMarkdown(result.timeMs, formatNumbers)} | ${formatNumberForMarkdown(Math.floor(result.opsPerSecond), formatNumbers)} |`;

      if (opResults.some(r => r.memoryBytes !== undefined)) {
        const memoryKB = result.memoryBytes !== undefined ? (result.memoryBytes / 1024).toFixed(2) : 'N/A';
        md += ` ${memoryKB} |`;
      }

      md += '\n';
    }

    md += '\n';
  }

  // Metadata section
  if (includeMetadata) {
    md += '## Metadata\n\n';
    md += '```json\n';
    md += JSON.stringify({
      timestamp: new Date().toISOString(),
      benchmarks: results.length,
      operations: [...new Set(results.map(r => r.operation))],
      implementations: [...new Set(results.map(r => r.name))],
    }, null, 2);
    md += '\n```\n\n';
  }

  return md;
}

/**
 * Exports a benchmark suite to Markdown format
 *
 * @param suite - Benchmark suite to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportSuiteToMarkdown(suite: BenchmarkSuite, options?: MarkdownExportOptions): string {
  const opts = { ...defaultMarkdownOptions, ...options };

  let md = `# ${suite.name}\n\n`;

  if (suite.description) {
    md += `${suite.description}\n\n`;
  }

  if (opts.includeTimestamp) {
    md += `*Generated: ${new Date().toISOString()}*\n\n`;
  }

  if (opts.includeTableOfContents) {
    md += '## Table of Contents\n\n';
    md += '- [Summary](#summary)\n';
    md += '- [Results](#results)\n';
    if (opts.includeMetadata) {
      md += '- [Metadata](#metadata)\n';
    }
    md += '\n';
  }

  // Use the results exporter but customize it
  const customOptions: MarkdownExportOptions = { ...opts };
  customOptions.includeTimestamp = false; // Already included above

  // Get the results markdown but skip the first line (the title)
  const resultsMarkdown = exportResultsToMarkdown(suite.benchmarks, customOptions);
  const resultsWithoutTitle = resultsMarkdown.split('\n').slice(1).join('\n');

  return md + resultsWithoutTitle;
}

/**
 * Exports a benchmark comparison to Markdown format
 *
 * @param comparison - Benchmark comparison to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportComparisonToMarkdown(comparison: BenchmarkComparison, options?: MarkdownExportOptions): string {
  const opts = { ...defaultMarkdownOptions, ...options };
  const { includeTimestamp, includeMetadata, formatNumbers, includeTableOfContents, includeCharts } = opts;

  let md = `# ${comparison.name}\n\n`;

  if (comparison.description) {
    md += `${comparison.description}\n\n`;
  }

  if (includeTimestamp) {
    md += `*Generated: ${new Date().toISOString()}*\n\n`;
  }

  if (includeTableOfContents) {
    md += '## Table of Contents\n\n';
    md += '- [Summary](#summary)\n';
    md += '- [Results](#results)\n';
    if (includeCharts) {
      md += '- [Charts](#charts)\n';
    }
    if (includeMetadata) {
      md += '- [Metadata](#metadata)\n';
    }
    md += '\n';
  }

  // Summary section
  md += '## Summary\n\n';
  md += `- **Operation:** ${comparison.operation}\n`;
  md += `- **Input Size:** ${formatNumberForMarkdown(comparison.inputSize, formatNumbers)}\n`;
  md += `- **Implementations:** ${comparison.results.length}\n`;

  // Find the fastest implementation
  const sortedResults = [...comparison.results].sort((a, b) => a.timeMs - b.timeMs);
  const fastest = sortedResults[0];
  md += `- **Fastest Implementation:** ${fastest.implementation} (${formatNumberForMarkdown(Math.floor(fastest.opsPerSecond), formatNumbers)} ops/sec)\n`;
  md += '\n';

  // Results section
  md += '## Results\n\n';

  // Table header
  md += '| Implementation | Time (ms) | Ops/Sec | vs. Fastest |';
  if (comparison.results.some(r => r.memoryBytes !== undefined)) {
    md += ' Memory (KB) |';
  }
  md += '\n';

  // Table separator
  md += '| ------------- | -------- | ------- | ---------- |';
  if (comparison.results.some(r => r.memoryBytes !== undefined)) {
    md += ' ----------- |';
  }
  md += '\n';

  // Table rows
  for (const result of sortedResults) {
    const relativeText = result.relativeFactor === 1 ? 'fastest' : `${result.relativeFactor.toFixed(2)}x slower`;

    md += `| ${result.implementation} | ${formatNumberForMarkdown(result.timeMs, formatNumbers)} | ${formatNumberForMarkdown(Math.floor(result.opsPerSecond), formatNumbers)} | ${relativeText} |`;

    if (comparison.results.some(r => r.memoryBytes !== undefined)) {
      const memoryKB = result.memoryBytes !== undefined ? (result.memoryBytes / 1024).toFixed(2) : 'N/A';
      md += ` ${memoryKB} |`;
    }

    md += '\n';
  }

  md += '\n';

  // Charts section (placeholder for now)
  if (includeCharts) {
    md += '## Charts\n\n';
    md += '*Charts will be implemented in a future version.*\n\n';
  }

  // Metadata section
  if (includeMetadata) {
    md += '## Metadata\n\n';
    md += '```json\n';
    md += JSON.stringify({
      name: comparison.name,
      description: comparison.description,
      operation: comparison.operation,
      inputSize: comparison.inputSize,
      timestamp: new Date().toISOString(),
      implementations: comparison.results.map(r => r.implementation),
    }, null, 2);
    md += '\n```\n\n';
  }

  return md;
}

/**
 * Exports a scalability result to Markdown format
 *
 * @param result - Scalability result to export
 * @param options - Markdown export options
 * @returns Markdown string
 */
export function exportScalabilityToMarkdown(result: ScalabilityResult, options?: MarkdownExportOptions): string {
  const opts = { ...defaultMarkdownOptions, ...options };
  const { includeTimestamp, includeMetadata, formatNumbers, includeTableOfContents, includeCharts } = opts;

  let md = `# ${result.implementation} Scalability (${result.operation})\n\n`;

  if (includeTimestamp) {
    md += `*Generated: ${new Date().toISOString()}*\n\n`;
  }

  if (includeTableOfContents) {
    md += '## Table of Contents\n\n';
    md += '- [Summary](#summary)\n';
    md += '- [Results](#results)\n';
    if (includeCharts) {
      md += '- [Charts](#charts)\n';
    }
    if (includeMetadata) {
      md += '- [Metadata](#metadata)\n';
    }
    md += '\n';
  }

  // Summary section
  md += '## Summary\n\n';
  md += `- **Implementation:** ${result.implementation}\n`;
  md += `- **Operation:** ${result.operation}\n`;
  md += `- **Data Points:** ${result.results.length}\n`;
  md += `- **Input Size Range:** ${formatNumberForMarkdown(Math.min(...result.results.map(r => r.inputSize)), formatNumbers)} - ${formatNumberForMarkdown(Math.max(...result.results.map(r => r.inputSize)), formatNumbers)}\n`;
  md += '\n';

  // Results section
  md += '## Results\n\n';

  // Table header
  md += '| Input Size | Time (ms) | Ops/Sec |';
  if (result.results.some(r => r.memoryBytes !== undefined)) {
    md += ' Memory (KB) |';
  }
  md += '\n';

  // Table separator
  md += '| ---------- | -------- | ------- |';
  if (result.results.some(r => r.memoryBytes !== undefined)) {
    md += ' ----------- |';
  }
  md += '\n';

  // Sort by input size
  const sortedResults = [...result.results].sort((a, b) => a.inputSize - b.inputSize);

  // Table rows
  for (const entry of sortedResults) {
    md += `| ${formatNumberForMarkdown(entry.inputSize, formatNumbers)} | ${formatNumberForMarkdown(entry.timeMs, formatNumbers)} | ${formatNumberForMarkdown(Math.floor(entry.opsPerSecond), formatNumbers)} |`;

    if (result.results.some(r => r.memoryBytes !== undefined)) {
      const memoryKB = entry.memoryBytes !== undefined ? (entry.memoryBytes / 1024).toFixed(2) : 'N/A';
      md += ` ${memoryKB} |`;
    }

    md += '\n';
  }

  md += '\n';

  // Charts section (placeholder for now)
  if (includeCharts) {
    md += '## Charts\n\n';
    md += '*Charts will be implemented in a future version.*\n\n';
  }

  // Metadata section
  if (includeMetadata) {
    md += '## Metadata\n\n';
    md += '```json\n';
    md += JSON.stringify({
      implementation: result.implementation,
      operation: result.operation,
      timestamp: new Date().toISOString(),
      dataPoints: result.results.length,
      inputSizeRange: {
        min: Math.min(...result.results.map(r => r.inputSize)),
        max: Math.max(...result.results.map(r => r.inputSize)),
      },
    }, null, 2);
    md += '\n```\n\n';
  }

  return md;
}

/**
 * HTML export options
 */
export interface HTMLExportOptions {
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
}

/**
 * Default HTML export options
 */
const defaultHTMLOptions: HTMLExportOptions = {
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
};

/**
 * Formats a number for HTML output
 *
 * @param value - Number to format
 * @param formatNumbers - Whether to format with thousands separator
 * @returns Formatted number as string
 */
function formatNumberForHTML(value: number, formatNumbers: boolean = true): string {
  if (formatNumbers) {
    return value.toLocaleString();
  }
  return value.toString();
}

/**
 * Exports benchmark results to HTML format
 *
 * @param results - Benchmark results to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportResultsToHTML(results: BenchmarkResult[], options?: HTMLExportOptions): string {
  const opts = { ...defaultHTMLOptions, ...options };
  const { includeMetadata, formatNumbers, includeTableOfContents, includeCharts, title } = opts;

  // Import the HTML template functions
  const {
    baseTemplate,
    createBarChartScript,
    createLineChartScript,
    createPieChartScript,
    createRadarChartScript,
    createTableOfContents
  } = require('./html-template');

  let content = '';
  let scripts = '';

  // Table of contents
  if (includeTableOfContents) {
    const sections = [
      { name: 'Summary', id: 'summary' },
      { name: 'Results', id: 'results' },
    ];

    if (includeCharts) {
      sections.push({ name: 'Charts', id: 'charts' });
    }

    if (includeMetadata) {
      sections.push({ name: 'Metadata', id: 'metadata' });
    }

    content += createTableOfContents(sections);
  }

  // Summary section
  content += '<div class="summary" id="summary">\n';
  content += '  <h2>Summary</h2>\n';
  content += `  <p><strong>Total benchmarks:</strong> ${results.length}</p>\n`;
  content += `  <p><strong>Operations:</strong> ${[...new Set(results.map(r => r.operation))].join(', ')}</p>\n`;
  content += `  <p><strong>Implementations:</strong> ${[...new Set(results.map(r => r.name))].join(', ')}</p>\n`;
  content += '</div>\n';

  // Results section
  content += '<div id="results">\n';
  content += '  <h2>Results</h2>\n';

  // Group by operation
  const operationGroups = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    if (!operationGroups.has(result.operation)) {
      operationGroups.set(result.operation, []);
    }
    operationGroups.get(result.operation)!.push(result);
  }

  // Create a table for each operation
  for (const [operation, opResults] of operationGroups.entries()) {
    content += `  <h3>${operation} Operation</h3>\n`;
    content += '  <table>\n';
    content += '    <thead>\n';
    content += '      <tr>\n';
    content += '        <th>Implementation</th>\n';
    content += '        <th>Input Size</th>\n';
    content += '        <th>Time (ms)</th>\n';
    content += '        <th>Ops/Sec</th>\n';

    if (opResults.some(r => r.memoryBytes !== undefined)) {
      content += '        <th>Memory (KB)</th>\n';
    }

    content += '      </tr>\n';
    content += '    </thead>\n';
    content += '    <tbody>\n';

    // Sort by time
    const sortedResults = [...opResults].sort((a, b) => a.timeMs - b.timeMs);

    // Table rows
    for (const result of sortedResults) {
      const isFastest = result === sortedResults[0];
      content += `      <tr${isFastest ? ' class="fastest"' : ''}>\n`;
      content += `        <td>${result.name}</td>\n`;
      content += `        <td>${formatNumberForHTML(result.inputSize, formatNumbers)}</td>\n`;
      content += `        <td>${formatNumberForHTML(result.timeMs, formatNumbers)}</td>\n`;
      content += `        <td>${formatNumberForHTML(Math.floor(result.opsPerSecond), formatNumbers)}</td>\n`;

      if (opResults.some(r => r.memoryBytes !== undefined)) {
        const memoryKB = result.memoryBytes !== undefined ? (result.memoryBytes / 1024).toFixed(2) : 'N/A';
        content += `        <td>${memoryKB}</td>\n`;
      }

      content += '      </tr>\n';
    }

    content += '    </tbody>\n';
    content += '  </table>\n';
  }

  content += '</div>\n';

  // Charts section
  if (includeCharts) {
    content += '<div id="charts">\n';
    content += '  <h2>Charts</h2>\n';

    for (const [operation, opResults] of operationGroups.entries()) {
      const chartId = `chart_${operation.replace(/\s+/g, '_').toLowerCase()}`;
      content += `  <div class="chart-container">\n`;
      content += `    <canvas id="${chartId}"></canvas>\n`;
      content += '  </div>\n';

      // Sort by name for consistent ordering
      const sortedResults = [...opResults].sort((a, b) => a.name.localeCompare(b.name));

      // Prepare chart data
      const labels = sortedResults.map(r => r.name);
      const timeData = sortedResults.map(r => r.timeMs);
      const opsData = sortedResults.map(r => Math.floor(r.opsPerSecond));

      // Add chart script based on chart type
      if (opts.chartType === 'line') {
        scripts += createLineChartScript(
          chartId,
          `${operation} Operation Performance`,
          labels,
          timeData,
          opsData,
          opts.chartOptions
        );
      } else if (opts.chartType === 'pie') {
        // For pie charts, we'll show the operations per second as a pie chart
        scripts += createPieChartScript(
          chartId,
          `${operation} Operation Performance`,
          labels,
          opsData,
          opts.chartOptions
        );
      } else if (opts.chartType === 'radar') {
        // For radar charts, we need to restructure the data
        const datasets = [
          {
            label: 'Time (ms)',
            data: timeData
          },
          {
            label: 'Operations/sec',
            data: opsData
          }
        ];

        scripts += createRadarChartScript(
          chartId,
          `${operation} Operation Performance`,
          labels,
          datasets,
          opts.chartOptions
        );
      } else {
        // Default to bar chart
        scripts += createBarChartScript(
          chartId,
          `${operation} Operation Performance`,
          labels,
          timeData,
          opsData,
          opts.chartOptions
        );
      }
    }

    content += '</div>\n';
  }

  // Metadata section
  if (includeMetadata) {
    content += '<div id="metadata" class="metadata">\n';
    content += '  <h2>Metadata</h2>\n';
    content += '  <pre>\n';
    content += JSON.stringify({
      timestamp: new Date().toISOString(),
      benchmarks: results.length,
      operations: [...new Set(results.map(r => r.operation))],
      implementations: [...new Set(results.map(r => r.name))],
    }, null, 2);
    content += '\n  </pre>\n';
    content += '</div>\n';
  }

  return baseTemplate(title || 'Benchmark Results', content, scripts);
}

/**
 * Exports a benchmark suite to HTML format
 *
 * @param suite - Benchmark suite to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportSuiteToHTML(suite: BenchmarkSuite, options?: HTMLExportOptions): string {
  const opts = { ...defaultHTMLOptions, ...options, title: suite.name };
  return exportResultsToHTML(suite.benchmarks, opts);
}

/**
 * Exports a benchmark comparison to HTML format
 *
 * @param comparison - Benchmark comparison to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportComparisonToHTML(comparison: BenchmarkComparison, options?: HTMLExportOptions): string {
  const opts = { ...defaultHTMLOptions, ...options };
  const { includeMetadata, formatNumbers, includeTableOfContents, title } = opts;

  // Import the HTML template functions
  const {
    baseTemplate,
    createBarChartScript,
    createLineChartScript,
    createPieChartScript,
    createRadarChartScript,
    createTableOfContents,
    createToggleableViews
  } = require('./html-template');

  let content = '';
  let scripts = '';

  // Table of contents
  if (includeTableOfContents) {
    const sections = [
      { name: 'Summary', id: 'summary' },
      { name: 'Results', id: 'results' },
    ];

    if (includeMetadata) {
      sections.push({ name: 'Metadata', id: 'metadata' });
    }

    content += createTableOfContents(sections);
  }

  // Summary section
  content += '<div class="summary" id="summary">\n';
  content += '  <h2>Summary</h2>\n';
  content += `  <p><strong>Operation:</strong> ${comparison.operation}</p>\n`;
  content += `  <p><strong>Input Size:</strong> ${formatNumberForHTML(comparison.inputSize, formatNumbers)}</p>\n`;
  content += `  <p><strong>Implementations:</strong> ${comparison.results.length}</p>\n`;

  // Find the fastest implementation
  const sortedResults = [...comparison.results].sort((a, b) => a.timeMs - b.timeMs);
  const fastest = sortedResults[0];
  content += `  <p><strong>Fastest Implementation:</strong> ${fastest.implementation} (${formatNumberForHTML(Math.floor(fastest.opsPerSecond), formatNumbers)} ops/sec)</p>\n`;
  content += '</div>\n';

  // Create table content
  let tableContent = '  <table>\n';
  tableContent += '    <thead>\n';
  tableContent += '      <tr>\n';
  tableContent += '        <th>Implementation</th>\n';
  tableContent += '        <th>Time (ms)</th>\n';
  tableContent += '        <th>Ops/Sec</th>\n';
  tableContent += '        <th>vs. Fastest</th>\n';

  if (comparison.results.some(r => r.memoryBytes !== undefined)) {
    tableContent += '        <th>Memory (KB)</th>\n';
  }

  tableContent += '      </tr>\n';
  tableContent += '    </thead>\n';
  tableContent += '    <tbody>\n';

  // Table rows
  for (const result of sortedResults) {
    const isFastest = result === sortedResults[0];
    const relativeText = result.relativeFactor === 1 ? 'fastest' : `${result.relativeFactor.toFixed(2)}x slower`;

    tableContent += `      <tr${isFastest ? ' class="fastest"' : ''}>\n`;
    tableContent += `        <td>${result.implementation}</td>\n`;
    tableContent += `        <td>${formatNumberForHTML(result.timeMs, formatNumbers)}</td>\n`;
    tableContent += `        <td>${formatNumberForHTML(Math.floor(result.opsPerSecond), formatNumbers)}</td>\n`;
    tableContent += `        <td>${relativeText}</td>\n`;

    if (comparison.results.some(r => r.memoryBytes !== undefined)) {
      const memoryKB = result.memoryBytes !== undefined ? (result.memoryBytes / 1024).toFixed(2) : 'N/A';
      tableContent += `        <td>${memoryKB}</td>\n`;
    }

    tableContent += '      </tr>\n';
  }

  tableContent += '    </tbody>\n';
  tableContent += '  </table>\n';

  // Create chart content
  let chartContent = '';
  const chartId = 'comparison_chart';
  chartContent += '<div class="chart-container">\n';
  chartContent += `  <canvas id="${chartId}"></canvas>\n`;
  chartContent += '</div>\n';

  // Sort by name for consistent ordering
  const chartResults = [...comparison.results].sort((a, b) => a.implementation.localeCompare(b.implementation));

  // Prepare chart data
  const labels = chartResults.map(r => r.implementation);
  const timeData = chartResults.map(r => r.timeMs);
  const opsData = chartResults.map(r => Math.floor(r.opsPerSecond));

  // Add chart script based on chart type
  if (opts.chartType === 'line') {
    scripts += createLineChartScript(
      chartId,
      `${comparison.operation} Operation (Size: ${comparison.inputSize})`,
      labels,
      timeData,
      opsData,
      opts.chartOptions
    );
  } else if (opts.chartType === 'pie') {
    // For pie charts, we'll show the operations per second as a pie chart
    scripts += createPieChartScript(
      chartId,
      `${comparison.operation} Operation (Size: ${comparison.inputSize})`,
      labels,
      opsData,
      opts.chartOptions
    );
  } else if (opts.chartType === 'radar') {
    // For radar charts, we need to restructure the data
    const metrics = ['Time (ms)', 'Ops/Sec', 'Relative Factor'];
    const datasets = comparison.results.map(result => ({
      label: result.implementation,
      data: [result.timeMs, result.opsPerSecond, result.relativeFactor]
    }));

    scripts += createRadarChartScript(
      chartId,
      `${comparison.operation} Operation (Size: ${comparison.inputSize})`,
      metrics,
      datasets,
      opts.chartOptions
    );
  } else {
    // Default to bar chart
    scripts += createBarChartScript(
      chartId,
      `${comparison.operation} Operation (Size: ${comparison.inputSize})`,
      labels,
      timeData,
      opsData,
      opts.chartOptions
    );
  }

  // Create raw data content
  const rawData = JSON.stringify(comparison, null, 2);

  // Add toggleable views section
  content += createToggleableViews(
    'results',
    'Results',
    tableContent,
    chartContent,
    rawData
  );

  // Metadata section
  if (includeMetadata) {
    content += '<div id="metadata" class="metadata">\n';
    content += '  <h2>Metadata</h2>\n';
    content += '  <pre>\n';
    content += JSON.stringify({
      name: comparison.name,
      description: comparison.description,
      operation: comparison.operation,
      inputSize: comparison.inputSize,
      timestamp: new Date().toISOString(),
      implementations: comparison.results.map(r => r.implementation),
    }, null, 2);
    content += '\n  </pre>\n';
    content += '</div>\n';
  }

  return baseTemplate(title || comparison.name, content, scripts);
}

/**
 * Exports a scalability result to HTML format
 *
 * @param result - Scalability result to export
 * @param options - HTML export options
 * @returns HTML string
 */
export function exportScalabilityToHTML(result: ScalabilityResult, options?: HTMLExportOptions): string {
  const opts = { ...defaultHTMLOptions, ...options };
  const { includeMetadata, formatNumbers, includeTableOfContents, includeCharts, title } = opts;

  // Import the HTML template functions
  const {
    baseTemplate,
    createBarChartScript,
    createLineChartScript,
    createPieChartScript,
    createRadarChartScript,
    createTableOfContents
  } = require('./html-template');

  let content = '';
  let scripts = '';

  // Table of contents
  if (includeTableOfContents) {
    const sections = [
      { name: 'Summary', id: 'summary' },
      { name: 'Results', id: 'results' },
    ];

    if (includeCharts) {
      sections.push({ name: 'Charts', id: 'charts' });
    }

    if (includeMetadata) {
      sections.push({ name: 'Metadata', id: 'metadata' });
    }

    content += createTableOfContents(sections);
  }

  // Summary section
  content += '<div class="summary" id="summary">\n';
  content += '  <h2>Summary</h2>\n';
  content += `  <p><strong>Implementation:</strong> ${result.implementation}</p>\n`;
  content += `  <p><strong>Operation:</strong> ${result.operation}</p>\n`;
  content += `  <p><strong>Data Points:</strong> ${result.results.length}</p>\n`;
  content += `  <p><strong>Input Size Range:</strong> ${formatNumberForHTML(Math.min(...result.results.map(r => r.inputSize)), formatNumbers)} - ${formatNumberForHTML(Math.max(...result.results.map(r => r.inputSize)), formatNumbers)}</p>\n`;
  content += '</div>\n';

  // Results section
  content += '<div id="results">\n';
  content += '  <h2>Results</h2>\n';
  content += '  <table>\n';
  content += '    <thead>\n';
  content += '      <tr>\n';
  content += '        <th>Input Size</th>\n';
  content += '        <th>Time (ms)</th>\n';
  content += '        <th>Ops/Sec</th>\n';

  if (result.results.some(r => r.memoryBytes !== undefined)) {
    content += '        <th>Memory (KB)</th>\n';
  }

  content += '      </tr>\n';
  content += '    </thead>\n';
  content += '    <tbody>\n';

  // Sort by input size
  const sortedResults = [...result.results].sort((a, b) => a.inputSize - b.inputSize);

  // Table rows
  for (const entry of sortedResults) {
    content += '      <tr>\n';
    content += `        <td>${formatNumberForHTML(entry.inputSize, formatNumbers)}</td>\n`;
    content += `        <td>${formatNumberForHTML(entry.timeMs, formatNumbers)}</td>\n`;
    content += `        <td>${formatNumberForHTML(Math.floor(entry.opsPerSecond), formatNumbers)}</td>\n`;

    if (result.results.some(r => r.memoryBytes !== undefined)) {
      const memoryKB = entry.memoryBytes !== undefined ? (entry.memoryBytes / 1024).toFixed(2) : 'N/A';
      content += `        <td>${memoryKB}</td>\n`;
    }

    content += '      </tr>\n';
  }

  content += '    </tbody>\n';
  content += '  </table>\n';
  content += '</div>\n';

  // Charts section
  if (includeCharts) {
    content += '<div id="charts">\n';
    content += '  <h2>Charts</h2>\n';

    const chartId = 'scalability_chart';
    content += '  <div class="chart-container">\n';
    content += `    <canvas id="${chartId}"></canvas>\n`;
    content += '  </div>\n';

    // Prepare chart data
    const labels = sortedResults.map(r => r.inputSize);
    const timeData = sortedResults.map(r => r.timeMs);
    const opsData = sortedResults.map(r => Math.floor(r.opsPerSecond));

    // Add chart script based on chart type
    if (opts.chartType === 'bar') {
      scripts += createBarChartScript(
        chartId,
        `${result.operation} Scalability for ${result.implementation}`,
        labels.map(String),
        timeData,
        opsData,
        opts.chartOptions
      );
    } else if (opts.chartType === 'pie') {
      // For pie charts, we'll show the operations per second as a pie chart
      scripts += createPieChartScript(
        chartId,
        `${result.operation} Scalability for ${result.implementation}`,
        labels.map(size => `Size ${size}`),
        opsData,
        opts.chartOptions
      );
    } else if (opts.chartType === 'radar') {
      // For radar charts, we need to restructure the data
      const datasets = [
        {
          label: 'Time (ms)',
          data: timeData
        },
        {
          label: 'Operations/sec',
          data: opsData
        }
      ];

      scripts += createRadarChartScript(
        chartId,
        `${result.operation} Scalability for ${result.implementation}`,
        labels.map(size => `Size ${size}`),
        datasets,
        opts.chartOptions
      );
    } else {
      // Default to line chart for scalability
      scripts += createLineChartScript(
        chartId,
        `${result.operation} Scalability for ${result.implementation}`,
        labels,
        timeData,
        opsData,
        opts.chartOptions
      );
    }

    content += '</div>\n';
  }

  // Metadata section
  if (includeMetadata) {
    content += '<div id="metadata" class="metadata">\n';
    content += '  <h2>Metadata</h2>\n';
    content += '  <pre>\n';
    content += JSON.stringify({
      implementation: result.implementation,
      operation: result.operation,
      timestamp: new Date().toISOString(),
      dataPoints: result.results.length,
      inputSizeRange: {
        min: Math.min(...result.results.map(r => r.inputSize)),
        max: Math.max(...result.results.map(r => r.inputSize)),
      },
    }, null, 2);
    content += '\n  </pre>\n';
    content += '</div>\n';
  }

  const pageTitle = title || `${result.implementation} Scalability (${result.operation})`;
  return baseTemplate(pageTitle, content, scripts);
}

/**
 * Exports benchmark results to JSON format
 *
 * @param data - Data to export
 * @returns JSON string
 */
export function exportToJSON(data: BenchmarkResult[] | BenchmarkSuite | BenchmarkComparison | ScalabilityResult): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Exports data to a specific format
 *
 * @param format - Output format (csv, md, html)
 * @param data - Data to export
 * @param options - Export options
 * @returns Formatted string
 */
export function exportToFormat(
  format: string,
  data: BenchmarkResult[] | BenchmarkSuite | BenchmarkComparison | BenchmarkComparison[] | ScalabilityResult | ComplexComparisonResult,
  options?: any
): string {
  switch (format.toLowerCase()) {
    case 'csv':
      if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
        return exportResultsToCSV(data as BenchmarkResult[], options);
      } else if ('benchmarks' in data) {
        return exportSuiteToCSV(data as BenchmarkSuite, options);
      } else if ('results' in data && 'operation' in data && !('testCases' in data)) {
        return exportComparisonToCSV(data as BenchmarkComparison, options);
      } else if (Array.isArray(data) && data.length > 0 && 'results' in data[0] && 'operation' in data[0]) {
        return data.map(comp => exportComparisonToCSV(comp as BenchmarkComparison, options)).join('\n\n');
      } else if ('results' in data && 'implementation' in data && 'operation' in data) {
        return exportScalabilityToCSV(data as ScalabilityResult, options);
      } else if ('results' in data && 'testCases' in data) {
        // For complex comparison, use markdown format as fallback
        return exportComparisonToCSV((data as any).results[Object.keys((data as any).results)[0]][0], options);
      }
      break;

    case 'md':
    case 'markdown':
      if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
        return exportResultsToMarkdown(data as BenchmarkResult[], options);
      } else if ('benchmarks' in data) {
        return exportSuiteToMarkdown(data as BenchmarkSuite, options);
      } else if ('results' in data && 'operation' in data && !('testCases' in data)) {
        return exportComparisonToMarkdown(data as BenchmarkComparison, options);
      } else if (Array.isArray(data) && data.length > 0 && 'results' in data[0] && 'operation' in data[0]) {
        return data.map(comp => exportComparisonToMarkdown(comp as BenchmarkComparison, options)).join('\n\n');
      } else if ('results' in data && 'implementation' in data && 'operation' in data) {
        return exportScalabilityToMarkdown(data as ScalabilityResult, options);
      } else if ('results' in data && 'testCases' in data) {
        // For complex comparison, use markdown format
        const result = data as any;
        let md = `# ${result.name}\n\n`;

        if (result.description) {
          md += `${result.description}\n\n`;
        }

        md += `## Test Cases\n\n`;
        for (const testCase of result.testCases) {
          md += `- ${testCase}\n`;
        }

        md += `\n## Input Sizes\n\n`;
        for (const size of result.inputSizes) {
          md += `- ${size.toLocaleString()}\n`;
        }

        md += `\n## Results\n\n`;

        for (const [opName, comparisons] of Object.entries(result.results)) {
          md += `### ${opName} Operation\n\n`;

          for (const comparison of comparisons as any[]) {
            md += exportComparisonToMarkdown(comparison as BenchmarkComparison, options) + '\n\n';
          }
        }

        return md;
      }
      break;

    case 'html':
      if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
        return exportResultsToHTML(data as BenchmarkResult[], options);
      } else if ('benchmarks' in data) {
        return exportSuiteToHTML(data as BenchmarkSuite, options);
      } else if ('results' in data && 'operation' in data && !('testCases' in data)) {
        return exportComparisonToHTML(data as BenchmarkComparison, options);
      } else if (Array.isArray(data) && data.length > 0 && 'results' in data[0] && 'operation' in data[0]) {
        // For multiple comparisons, concatenate the results
        return data.map(comp => exportComparisonToHTML(comp as BenchmarkComparison, options)).join('\n');
      } else if ('results' in data && 'implementation' in data && 'operation' in data) {
        return exportScalabilityToHTML(data as ScalabilityResult, options);
      } else if ('results' in data && 'testCases' in data) {
        // For complex comparison, use HTML format
        const result = data as any;
        // Use options directly

        // Import the HTML template functions
        const { baseTemplate } = require('./html-template');

        let content = `<h1>${result.name}</h1>\n`;

        if (result.description) {
          content += `<p>${result.description}</p>\n`;
        }

        content += `<h2>Test Cases</h2>\n<ul>\n`;
        for (const testCase of result.testCases) {
          content += `<li>${testCase}</li>\n`;
        }
        content += `</ul>\n`;

        content += `<h2>Input Sizes</h2>\n<ul>\n`;
        for (const size of result.inputSizes) {
          content += `<li>${size.toLocaleString()}</li>\n`;
        }
        content += `</ul>\n`;

        content += `<h2>Results</h2>\n`;

        for (const [opName, comparisons] of Object.entries(result.results)) {
          content += `<h3>${opName} Operation</h3>\n`;

          for (const comparison of comparisons as any[]) {
            // Extract just the content part from the HTML
            const html = exportComparisonToHTML(comparison as BenchmarkComparison, options);
            const contentMatch = html.match(/<body>(.*?)<\/body>/s);
            if (contentMatch && contentMatch[1]) {
              content += contentMatch[1].replace(/<h1>.*?<\/h1>/s, '');
            } else {
              content += `<div><pre>${JSON.stringify(comparison, null, 2)}</pre></div>`;
            }
          }
        }

        return baseTemplate(result.name, content, '');
      }
      break;

    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  throw new Error(`Could not determine how to export the provided data to ${format} format`);
}
