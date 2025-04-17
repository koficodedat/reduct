/**
 * Scalability command handler
 *
 * Measures how performance scales with input size.
 *
 * @packageDocumentation
 */

import { BenchmarkOptions } from '../../types';
import { measureListScalability } from '../../data-structures/list';
import { measureMapScalability } from '../../data-structures/map';
import { measureStackScalability } from '../../data-structures/stack';
import { measureSortingScalability } from '../../algorithms/sorting';
import { measureSearchingScalability } from '../../algorithms/searching';
import { formatScalabilityResult } from '../../visualization/formatters';
import { exportScalabilityToCSV } from '../../visualization/exporters';
import { quickSort, binarySearch } from '@reduct/algorithms';
import * as fs from 'fs';

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
        fs.writeFileSync(options.outputFile, csv);
        console.log(`Results saved to ${options.outputFile}`);
      } else {
        console.log(csv);
      }
      break;
    // Additional output formats will be implemented later
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
