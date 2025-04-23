/**
 * Scalability command handler
 *
 * Measures how performance scales with input size.
 *
 * @packageDocumentation
 */

import * as fs from 'fs';

import { quickSort, binarySearch } from '@reduct/algorithms';

import { measureSearchingScalability } from '../../algorithms/searching';
import { measureSortingScalability } from '../../algorithms/sorting';
import { measureListScalability } from '../../data-structures/list';
import { measureMapScalability } from '../../data-structures/map';
import { measureStackScalability } from '../../data-structures/stack';
import { BenchmarkOptions } from '../../types';
import { resolveReportPath } from '../../utils/paths';
import {
  exportScalabilityToCSV,
  exportScalabilityToMarkdown,
  exportScalabilityToHTML,
  exportToJSON
} from '../../visualization/exporters';
import { formatScalabilityResult } from '../../visualization/formatters';




/**
 * Command handler for the 'scalability' command
 *
 * @param type - Type of data structure or algorithm
 * @param operation - Operation to test
 * @param options - Command options
 */
export function scalabilityCommand(type: string, operation: string, options: any): void {
  const benchmarkOptions: BenchmarkOptions = {
    iterations: parseInt(options.iterations, 10),
    warmup: true,
  };

  const maxSize = parseInt(options.maxSize, 10);
  const steps = parseInt(options.steps, 10);

  let result;

  switch (type.toLowerCase()) {
    case 'list':
      if (!isValidListOperation(operation)) {
        console.error(`Invalid operation for List: ${operation}`);
        console.error('Valid operations: map, filter, reduce, get, append, prepend');
        process.exit(1);
      }
      result = measureListScalability(
        operation as any,
        maxSize,
        steps,
        benchmarkOptions
      );
      break;
    case 'map':
      if (!isValidMapOperation(operation)) {
        console.error(`Invalid operation for Map: ${operation}`);
        console.error('Valid operations: get, has, set, delete, map, filter');
        process.exit(1);
      }
      result = measureMapScalability(
        operation as any,
        maxSize,
        steps,
        benchmarkOptions
      );
      break;
    case 'stack':
      if (!isValidStackOperation(operation)) {
        console.error(`Invalid operation for Stack: ${operation}`);
        console.error('Valid operations: peek, push, pop, map, filter');
        process.exit(1);
      }
      result = measureStackScalability(
        operation as any,
        maxSize,
        steps,
        benchmarkOptions
      );
      break;
    case 'sorting':
      // For now, we only support quickSort
      result = measureSortingScalability(
        quickSort,
        'quickSort',
        maxSize,
        steps,
        benchmarkOptions
      );
      break;
    case 'searching':
      // For now, we only support binarySearch
      result = measureSearchingScalability(
        binarySearch,
        'binarySearch',
        maxSize,
        steps,
        benchmarkOptions
      );
      break;
    default:
      console.error(`Unknown type: ${type}`);
      process.exit(1);
  }

  // Handle output
  switch (options.output) {
    case 'console':
      console.log(formatScalabilityResult(result));
      break;
    case 'csv':
      const csv = exportScalabilityToCSV(result);
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
      const md = exportScalabilityToMarkdown(result);
      if (options.outputFile) {
        const outputPath = resolveReportPath(options.outputFile);
        fs.writeFileSync(outputPath, md);
        console.log(`Results saved to ${outputPath}`);
      } else {
        console.log(md);
      }
      break;
    case 'html':
      const html = exportScalabilityToHTML(result, { includeCharts: true });
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
      console.log(formatScalabilityResult(result));
  }
}

/**
 * Checks if the operation is valid for List
 *
 * @param operation - Operation to check
 * @returns Whether the operation is valid
 */
function isValidListOperation(operation: string): boolean {
  return ['map', 'filter', 'reduce', 'get', 'append', 'prepend'].includes(operation);
}

/**
 * Checks if the operation is valid for Map
 *
 * @param operation - Operation to check
 * @returns Whether the operation is valid
 */
function isValidMapOperation(operation: string): boolean {
  return ['get', 'has', 'set', 'delete', 'map', 'filter'].includes(operation);
}

/**
 * Checks if the operation is valid for Stack
 *
 * @param operation - Operation to check
 * @returns Whether the operation is valid
 */
function isValidStackOperation(operation: string): boolean {
  return ['peek', 'push', 'pop', 'map', 'filter'].includes(operation);
}
