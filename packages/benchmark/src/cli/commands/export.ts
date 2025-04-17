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
import { exportResultsToCSV, exportSuiteToCSV, exportComparisonToCSV, exportScalabilityToCSV } from '../../visualization/exporters';

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
        result = exportToCSV(data);
        break;
      case 'md':
        // Markdown export will be implemented later
        console.error('Markdown export not yet implemented');
        process.exit(1);
        break;
      case 'html':
        // HTML export will be implemented later
        console.error('HTML export not yet implemented');
        process.exit(1);
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
 * @returns CSV string
 */
function exportToCSV(data: any): string {
  // Determine the type of data
  if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
    // It's an array of BenchmarkResult
    return exportResultsToCSV(data as BenchmarkResult[]);
  } else if ('benchmarks' in data && Array.isArray(data.benchmarks)) {
    // It's a BenchmarkSuite
    return exportSuiteToCSV(data as BenchmarkSuite);
  } else if ('results' in data && Array.isArray(data.results) && 'implementation' in data.results[0]) {
    // It's a BenchmarkComparison
    return exportComparisonToCSV(data as BenchmarkComparison);
  } else if ('results' in data && Array.isArray(data.results) && 'inputSize' in data.results[0]) {
    // It's a ScalabilityResult
    return exportScalabilityToCSV(data as ScalabilityResult);
  } else {
    throw new Error('Unknown data format');
  }
}
