/**
 * Run command handler
 *
 * Executes benchmarks for a specific data structure or algorithm.
 *
 * @packageDocumentation
 */

import { BenchmarkOptions } from '../../types';
import { runListBenchmarks } from '../../data-structures/list';
import { runMapBenchmarks } from '../../data-structures/map';
import { runStackBenchmarks } from '../../data-structures/stack';
import { runSortingBenchmarks } from '../../algorithms/sorting';
import { runSearchingBenchmarks } from '../../algorithms/searching';
import { formatBenchmarkSuite } from '../../visualization/formatters';
import { exportSuiteToCSV } from '../../visualization/exporters';
import * as fs from 'fs';

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
        fs.writeFileSync(options.outputFile, csv);
        console.log(`Results saved to ${options.outputFile}`);
      } else {
        console.log(csv);
      }
      break;
    // Additional output formats will be implemented later
    default:
      console.log(formatBenchmarkSuite(result));
  }
}
