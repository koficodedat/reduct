/**
 * Run command handler
 *
 * Executes benchmarks for a specific data structure or algorithm.
 *
 * @packageDocumentation
 */

import * as fs from 'fs';

import { runSearchingBenchmarks } from '../../algorithms/searching';
import { runSortingBenchmarks } from '../../algorithms/sorting';
import { runListBenchmarks } from '../../data-structures/list';
import { runMapBenchmarks } from '../../data-structures/map';
import { runStackBenchmarks } from '../../data-structures/stack';
import { BenchmarkOptions } from '../../types';
import { resolveReportPath } from '../../utils/paths';
import {
  exportSuiteToCSV,
  exportSuiteToMarkdown,
  exportSuiteToHTML,
  exportToJSON
} from '../../visualization/exporters';
import { formatBenchmarkSuite } from '../../visualization/formatters';



/**
 * Command handler for the 'run' command
 *
 * @param type - Type of benchmark to run
 * @param options - Command options
 */
export function runCommand(type: string, options: any): void {
  console.log('Options received:', options);
  const benchmarkOptions: BenchmarkOptions = {
    iterations: parseInt(options.iterations, 10),
    measureMemory: options.measureMemory,
    warmup: true,
  };

  const size = parseInt(options.size, 10);

  let result;

  switch (type.toLowerCase()) {
    case 'list':
      result = runListBenchmarks(size, benchmarkOptions);
      break;
    case 'map':
      result = runMapBenchmarks(size, benchmarkOptions);
      break;
    case 'stack':
      result = runStackBenchmarks(size, benchmarkOptions);
      break;
    case 'sorting':
      result = runSortingBenchmarks(size, benchmarkOptions);
      break;
    case 'searching':
      result = runSearchingBenchmarks(size, benchmarkOptions);
      break;
    default:
      console.error(`Unknown type: ${type}`);
      process.exit(1);
  }

  // Handle output
  switch (options.output) {
    case 'console':
      console.log(formatBenchmarkSuite(result));
      break;
    case 'csv':
      const csv = exportSuiteToCSV(result);
      if (options.outputFile) {
        const outputPath = resolveReportPath(options.outputFile);
        fs.writeFileSync(outputPath, csv);
        console.log(`Results saved to ${outputPath}`);
      } else {
        console.log(csv);
      }
      break;
    case 'md':
    case 'markdown':
      const md = exportSuiteToMarkdown(result);
      if (options.outputFile) {
        const outputPath = resolveReportPath(options.outputFile);
        fs.writeFileSync(outputPath, md);
        console.log(`Results saved to ${outputPath}`);
      } else {
        console.log(md);
      }
      break;
    case 'html':
      const html = exportSuiteToHTML(result, { includeCharts: true });
      if (options.outputFile) {
        const outputPath = resolveReportPath(options.outputFile);
        fs.writeFileSync(outputPath, html);
        console.log(`Results saved to ${outputPath}`);
      } else {
        console.log(html);
      }
      break;
    case 'json':
      const json = exportToJSON(result);
      if (options.outputFile) {
        const outputPath = resolveReportPath(options.outputFile);
        fs.writeFileSync(outputPath, json);
        console.log(`Results saved to ${outputPath}`);
      } else {
        console.log(json);
      }
      break;
    default:
      console.log(formatBenchmarkSuite(result));
  }
}
