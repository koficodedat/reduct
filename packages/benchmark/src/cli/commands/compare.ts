/**
 * Compare command handler
 *
 * Compares multiple data structures or algorithms.
 *
 * @packageDocumentation
 */

import { BenchmarkOptions } from '../../types';
import { compareListWithNativeArray } from '../../data-structures/list';
import { compareMapWithNativeMap } from '../../data-structures/map';
import { compareStackWithNativeArray } from '../../data-structures/stack';
import * as fs from 'fs';

/**
 * Command handler for the 'compare' command
 *
 * @param types - Types to compare
 * @param options - Command options
 */
export function compareCommand(types: string[], options: any): void {
  const benchmarkOptions: BenchmarkOptions = {
    iterations: parseInt(options.iterations, 10),
    measureMemory: options.measureMemory,
    warmup: true,
  };

  const size = parseInt(options.size, 10);

  // For now, we'll use the existing comparison functions
  // Later, we'll implement a more flexible comparison system

  if (types.length === 2) {
    if ((types.includes('list') && types.includes('array')) ||
        (types.includes('list') && types.includes('native-array'))) {
      const result = compareListWithNativeArray(size, benchmarkOptions);
      outputResult(result, options);
      return;
    }

    if ((types.includes('map') && types.includes('native-map')) ||
        (types.includes('map') && types.includes('object'))) {
      const result = compareMapWithNativeMap(size, benchmarkOptions);
      outputResult(result, options);
      return;
    }

    if ((types.includes('stack') && types.includes('array')) ||
        (types.includes('stack') && types.includes('native-array'))) {
      const result = compareStackWithNativeArray(size, benchmarkOptions);
      outputResult(result, options);
      return;
    }
  }

  console.error('Unsupported comparison. Currently supported comparisons:');
  console.error('- list vs array/native-array');
  console.error('- map vs native-map/object');
  console.error('- stack vs array/native-array');
  console.error('');
  console.error('A more flexible comparison system will be implemented soon.');
}

/**
 * Outputs the result in the specified format
 *
 * @param result - Benchmark result
 * @param options - Command options
 */
function outputResult(result: string, options: any): void {
  if (options.outputFile) {
    fs.writeFileSync(options.outputFile, result);
    console.log(`Results saved to ${options.outputFile}`);
  } else {
    console.log(result);
  }
}
