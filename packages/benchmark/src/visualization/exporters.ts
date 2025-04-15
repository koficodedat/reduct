/**
 * Benchmark result exporters
 *
 * @packageDocumentation
 */

import { BenchmarkResult, BenchmarkSuite, BenchmarkComparison, ScalabilityResult } from '../types';

/**
 * Exports benchmark results to CSV format
 *
 * @param results - Benchmark results to export
 * @returns CSV string
 */
export function exportResultsToCSV(results: BenchmarkResult[]): string {
  let csv = 'Name,Operation,InputSize,TimeMs,OpsPerSecond';
  
  if (results.some(r => r.memoryBytes !== undefined)) {
    csv += ',MemoryBytes';
  }
  
  csv += '\n';

  for (const result of results) {
    csv += `${result.name},${result.operation},${result.inputSize},${result.timeMs},${result.opsPerSecond}`;
    
    if (results.some(r => r.memoryBytes !== undefined)) {
      csv += `,${result.memoryBytes || 0}`;
    }
    
    csv += '\n';
  }

  return csv;
}

/**
 * Exports a benchmark suite to CSV format
 *
 * @param suite - Benchmark suite to export
 * @returns CSV string
 */
export function exportSuiteToCSV(suite: BenchmarkSuite): string {
  return exportResultsToCSV(suite.benchmarks);
}

/**
 * Exports a benchmark comparison to CSV format
 *
 * @param comparison - Benchmark comparison to export
 * @returns CSV string
 */
export function exportComparisonToCSV(comparison: BenchmarkComparison): string {
  let csv = 'Implementation,Operation,InputSize,TimeMs,OpsPerSecond,RelativeFactor';
  
  if (comparison.results.some(r => r.memoryBytes !== undefined)) {
    csv += ',MemoryBytes';
  }
  
  csv += '\n';

  for (const result of comparison.results) {
    csv += `${result.implementation},${comparison.operation},${comparison.inputSize},${result.timeMs},${result.opsPerSecond},${result.relativeFactor}`;
    
    if (comparison.results.some(r => r.memoryBytes !== undefined)) {
      csv += `,${result.memoryBytes || 0}`;
    }
    
    csv += '\n';
  }

  return csv;
}

/**
 * Exports a scalability result to CSV format
 *
 * @param result - Scalability result to export
 * @returns CSV string
 */
export function exportScalabilityToCSV(result: ScalabilityResult): string {
  let csv = 'Implementation,Operation,InputSize,TimeMs,OpsPerSecond';
  
  if (result.results.some(r => r.memoryBytes !== undefined)) {
    csv += ',MemoryBytes';
  }
  
  csv += '\n';

  for (const entry of result.results) {
    csv += `${result.implementation},${result.operation},${entry.inputSize},${entry.timeMs},${entry.opsPerSecond}`;
    
    if (result.results.some(r => r.memoryBytes !== undefined)) {
      csv += `,${entry.memoryBytes || 0}`;
    }
    
    csv += '\n';
  }

  return csv;
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
