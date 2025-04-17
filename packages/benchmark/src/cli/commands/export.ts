/**
 * Export command handler
 *
 * Exports benchmark results to various formats.
 *
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult, BenchmarkSuite, BenchmarkComparison, ScalabilityResult } from '../../types';
import {
  exportResultsToCSV,
  exportSuiteToCSV,
  exportComparisonToCSV,
  exportScalabilityToCSV,
  exportResultsToMarkdown,
  exportSuiteToMarkdown,
  exportComparisonToMarkdown,
  exportScalabilityToMarkdown,
  exportResultsToHTML,
  exportSuiteToHTML,
  exportComparisonToHTML,
  exportScalabilityToHTML,
  CSVExportOptions,
  MarkdownExportOptions,
  HTMLExportOptions
} from '../../visualization/exporters';

/**
 * Command handler for the 'export' command
 *
 * @param format - Output format
 * @param options - Command options
 */
export function exportCommand(format: string, options: any): void {
  if (!options.input) {
    console.error('Input file is required');
    process.exit(1);
  }

  if (!fs.existsSync(options.input)) {
    console.error(`Input file not found: ${options.input}`);
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(options.input, 'utf8'));
    let result: string;

    switch (format.toLowerCase()) {
      case 'csv':
        result = exportToCSV(data, {
          includeHeaders: options.headers !== false,
          delimiter: options.delimiter || ',',
          formatNumbers: options.formatNumbers || false,
          includeMetadata: options.metadata !== false,
        });
        break;
      case 'md':
        result = exportToMarkdown(data, {
          includeCharts: options.charts || false,
          formatNumbers: true,
        });
        break;
      case 'html':
        result = exportToHTML(data, {
          includeCharts: options.charts !== false,
          chartType: options.chartType || 'bar',
          formatNumbers: options.formatNumbers || true,
          title: options.title,
          chartOptions: {
            yAxisScale: options.logScale ? 'logarithmic' : 'linear',
            showLegend: options.legend !== false,
            legendPosition: options.legendPosition || 'top',
            animate: options.animation !== false,
          }
        });
        break;
      default:
        console.error(`Unknown format: ${format}`);
        process.exit(1);
    }

    if (options.output) {
      fs.writeFileSync(options.output, result);
      console.log(`Results exported to ${options.output}`);
    } else {
      console.log(result);
    }
  } catch (error) {
    console.error('Error parsing input file:', error);
    process.exit(1);
  }
}

/**
 * Exports data to CSV format
 *
 * @param data - Benchmark data
 * @param options - CSV export options
 * @returns CSV string
 */
function exportToCSV(data: any, options?: CSVExportOptions): string {
  // Determine the type of data
  if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
    // It's an array of BenchmarkResult
    return exportResultsToCSV(data as BenchmarkResult[], options);
  } else if ('benchmarks' in data && Array.isArray(data.benchmarks)) {
    // It's a BenchmarkSuite
    return exportSuiteToCSV(data as BenchmarkSuite, options);
  } else if ('results' in data && Array.isArray(data.results) && 'implementation' in data.results[0]) {
    // It's a BenchmarkComparison
    return exportComparisonToCSV(data as BenchmarkComparison, options);
  } else if ('results' in data && Array.isArray(data.results) && 'inputSize' in data.results[0]) {
    // It's a ScalabilityResult
    return exportScalabilityToCSV(data as ScalabilityResult, options);
  } else {
    throw new Error('Unknown data format');
  }
}

/**
 * Exports data to Markdown format
 *
 * @param data - Benchmark data
 * @param options - Markdown export options
 * @returns Markdown string
 */
function exportToMarkdown(data: any, options?: MarkdownExportOptions): string {
  // Determine the type of data
  if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
    // It's an array of BenchmarkResult
    return exportResultsToMarkdown(data as BenchmarkResult[], options);
  } else if ('benchmarks' in data && Array.isArray(data.benchmarks)) {
    // It's a BenchmarkSuite
    return exportSuiteToMarkdown(data as BenchmarkSuite, options);
  } else if ('results' in data && Array.isArray(data.results) && 'implementation' in data.results[0]) {
    // It's a BenchmarkComparison
    return exportComparisonToMarkdown(data as BenchmarkComparison, options);
  } else if ('results' in data && Array.isArray(data.results) && 'inputSize' in data.results[0]) {
    // It's a ScalabilityResult
    return exportScalabilityToMarkdown(data as ScalabilityResult, options);
  } else {
    throw new Error('Unknown data format');
  }
}

/**
 * Exports data to HTML format
 *
 * @param data - Benchmark data
 * @param options - HTML export options
 * @returns HTML string
 */
function exportToHTML(data: any, options?: HTMLExportOptions): string {
  // Determine the type of data
  if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
    // It's an array of BenchmarkResult
    return exportResultsToHTML(data as BenchmarkResult[], options);
  } else if ('benchmarks' in data && Array.isArray(data.benchmarks)) {
    // It's a BenchmarkSuite
    return exportSuiteToHTML(data as BenchmarkSuite, options);
  } else if ('results' in data && Array.isArray(data.results) && 'implementation' in data.results[0]) {
    // It's a BenchmarkComparison
    return exportComparisonToHTML(data as BenchmarkComparison, options);
  } else if ('results' in data && Array.isArray(data.results) && 'inputSize' in data.results[0]) {
    // It's a ScalabilityResult
    return exportScalabilityToHTML(data as ScalabilityResult, options);
  } else {
    throw new Error('Unknown data format');
  }
}
