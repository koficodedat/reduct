/**
 * Adapter Compare command handler
 *
 * Compares multiple data structures or algorithms using the adapter system.
 *
 * @packageDocumentation
 */

import { compareImplementationsWithAdapters, AdapterComparisonOptions } from '../../comparison/adapter-based';
import { getAdapter } from '../../adapters';
import { formatBenchmarkComparison } from '../../visualization/formatters';
import { exportComparisonToCSV } from '../../visualization/exporters';
import * as fs from 'fs';

/**
 * Command handler for the 'adapter-compare' command
 *
 * @param types - Types to compare
 * @param options - Command options
 */
export function adapterCompareCommand(types: string[], options: any): void {
  try {
    // Map CLI types to registry IDs
    const typeMap: Record<string, string> = {
      'list': 'reduct-list',
      'array': 'native-array',
      'native-array': 'native-array',
      'map': 'reduct-map',
      'native-map': 'native-map',
      'object': 'plain-object',
      'stack': 'reduct-stack',
      'native-stack': 'native-array-stack',
      'quick-sort': 'quick-sort',
      'merge-sort': 'merge-sort',
      'heap-sort': 'heap-sort',
      'array-sort': 'native-array-sort',
      'linear-search': 'linear-search',
      'binary-search': 'binary-search',
    };

    // Convert types to registry IDs
    const implementationIds = types.map(type => {
      const id = typeMap[type] || type;
      if (!id) {
        throw new Error(`Unknown type: ${type}`);
      }
      return id;
    });

    const adapterOptions: AdapterComparisonOptions = {
      size: parseInt(options.size, 10),
      iterations: parseInt(options.iterations, 10),
      measureMemory: options.measureMemory,
      warmup: true,
      operations: options.operations ? options.operations.split(',') : undefined,
      minCompatibilityScore: options.minScore ? parseFloat(options.minScore) : 0.5,
    };

    // Run the comparison
    const comparisons = compareImplementationsWithAdapters(implementationIds, adapterOptions);

    // Handle output
    switch (options.output) {
      case 'console':
        for (const comparison of comparisons) {
          console.log(formatBenchmarkComparison(comparison));
          console.log(); // Add a blank line between comparisons
        }
        break;
      case 'csv':
        // For CSV, we'll just output the first comparison for now
        if (comparisons.length > 0) {
          const csv = exportComparisonToCSV(comparisons[0]);
          if (options.outputFile) {
            fs.writeFileSync(options.outputFile, csv);
            console.log(`Results saved to ${options.outputFile}`);
          } else {
            console.log(csv);
          }
        }
        break;
      // Additional output formats will be implemented later
      default:
        for (const comparison of comparisons) {
          console.log(formatBenchmarkComparison(comparison));
          console.log(); // Add a blank line between comparisons
        }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error('Available types:');
    console.error('- Data structures: list, array, map, native-map, object, stack, native-stack');
    console.error('- Sorting algorithms: quick-sort, merge-sort, heap-sort, array-sort');
    console.error('- Searching algorithms: linear-search, binary-search');
  }
}
