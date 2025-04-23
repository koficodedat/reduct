/**
 * Adapter Compare command handler
 *
 * Compares multiple data structures or algorithms using the adapter system.
 *
 * @packageDocumentation
 */

import * as fs from 'fs';

import { recordBenchmarkRun } from '../../analysis/trends';
import { compareImplementationsWithAdapters, AdapterComparisonOptions } from '../../comparison/adapter-based';
// import { getAdapter } from '../../adapters';
import { resolveReportPath } from '../../utils/paths';
import {
  exportComparisonToCSV,
  exportComparisonToMarkdown,
  exportComparisonToHTML,
  exportToJSON
} from '../../visualization/exporters';
import { formatBenchmarkComparison } from '../../visualization/formatters';

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

    // Record benchmark results for trend analysis if enabled
    if (options.record) {
      for (const comparison of comparisons) {
        const name = recordBenchmarkRun(comparison as any, {
          historyDir: options.historyDir || '.benchmark-history',
          maxRuns: parseInt(options.maxRuns || '100', 10)
        });
        console.log(`Recorded benchmark results as ${name}`);
      }
    }

    // Handle output
    switch (options.output) {
      case 'console':
        for (const comparison of comparisons) {
          console.log(formatBenchmarkComparison(comparison));
          console.log(); // Add a blank line between comparisons
        }
        break;
      case 'csv':
        // For CSV output
        if (comparisons.length > 0) {
          const csv = exportComparisonToCSV(comparisons[0]);
          if (options.outputFile) {
            const outputPath = resolveReportPath(options.outputFile);
            fs.writeFileSync(outputPath, csv);
            console.log(`Results saved to ${outputPath}`);
          } else {
            console.log(csv);
          }
        }
        break;
      case 'md':
      case 'markdown':
        // For Markdown output
        if (comparisons.length > 0) {
          const md = exportComparisonToMarkdown(comparisons[0]);
          if (options.outputFile) {
            const outputPath = resolveReportPath(options.outputFile);
            fs.writeFileSync(outputPath, md);
            console.log(`Results saved to ${outputPath}`);
          } else {
            console.log(md);
          }
        }
        break;
      case 'html':
        // For HTML output
        if (comparisons.length > 0) {
          const html = exportComparisonToHTML(comparisons[0], { includeCharts: true });
          if (options.outputFile) {
            const outputPath = resolveReportPath(options.outputFile);
            fs.writeFileSync(outputPath, html);
            console.log(`Results saved to ${outputPath}`);
          } else {
            console.log(html);
          }
        }
        break;
      case 'json':
        // For JSON output
        if (comparisons.length > 0) {
          const json = exportToJSON(comparisons[0]);
          if (options.outputFile) {
            const outputPath = resolveReportPath(options.outputFile);
            fs.writeFileSync(outputPath, json);
            console.log(`Results saved to ${outputPath}`);
          } else {
            console.log(json);
          }
        }
        break;
      default:
        // Default to console output
        for (const comparison of comparisons) {
          console.log(formatBenchmarkComparison(comparison));
          console.log(); // Add a blank line between comparisons
        }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    console.error('Available types:');
    console.error('- Data structures: list, array, map, native-map, object, stack, native-stack');
    console.error('- Sorting algorithms: quick-sort, merge-sort, heap-sort, array-sort');
    console.error('- Searching algorithms: linear-search, binary-search');
  }
}
