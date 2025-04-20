/**
 * Enhanced List Benchmark Command
 *
 * Provides a CLI command for running enhanced list benchmarks.
 *
 * @packageDocumentation
 */

import { Command } from 'commander';
import {
  runEnhancedListBenchmarks,
  measureEnhancedListScalability,
  compareStandardVsFusedOperations,
  compareStandardVsSpecializedLists
} from '../../data-structures/list';
import { formatBenchmarkSuite } from '../../visualization/formatters';
import { formatScalabilityResult } from '../../visualization/formatters';
import { exportToFormat } from '../../visualization/exporters';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Register the enhanced list command
 *
 * @param program - Commander program
 */
export function registerEnhancedListCommand(program: Command): void {
  const enhancedListCommand = program
    .command('enhanced-list')
    .description('Run benchmarks for enhanced List implementations')
    .option('-t, --type <type>', 'Type of benchmark (all, operations, scalability, fusion, specialized)', 'all')
    .option('-s, --size <number>', 'Size of the list to test', '10000')
    .option('-m, --max-size <number>', 'Maximum size for scalability tests', '100000')
    .option('-p, --steps <number>', 'Number of steps for scalability tests', '5')
    .option('-o, --operation <operation>', 'Operation to test for scalability', 'mapFilter')
    .option('-i, --iterations <number>', 'Number of iterations', '100')
    .option('--output <format>', 'Output format (console, csv, md, html)', 'console')
    .option('-f, --output-file <file>', 'Output file path')
    .option('--chart-type <type>', 'Chart type for HTML output (bar, line, pie)', 'bar')
    .option('--log-scale', 'Use logarithmic scale for charts')
    .action((options) => {
      try {
        // Parse options
        const type = options.type;
        const size = parseInt(options.size, 10);
        const maxSize = parseInt(options.maxSize, 10);
        const steps = parseInt(options.steps, 10);
        const operation = options.operation;
        const iterations = parseInt(options.iterations, 10);
        const outputFormat = options.output;
        const outputFile = options.outputFile;
        const chartType = options.chartType;
        const logScale = options.logScale;

        // Set benchmark options
        const benchmarkOptions = {
          iterations,
          warmupIterations: 10,
          measureMemory: false
        };

        let result: any;
        let title: string;
        let description: string;

        // Run the appropriate benchmark based on type
        switch (type) {
          case 'all':
            // Run all benchmarks
            const allResults = {
              operations: runEnhancedListBenchmarks(size, benchmarkOptions),
              fusion: compareStandardVsFusedOperations(size, benchmarkOptions),
              specialized: compareStandardVsSpecializedLists(size, benchmarkOptions)
            };
            result = allResults;
            title = 'Enhanced List Benchmarks';
            description = 'Comprehensive benchmarks for enhanced List implementations';
            break;
          case 'operations':
            // Run basic operations benchmark
            result = runEnhancedListBenchmarks(size, benchmarkOptions);
            title = 'Enhanced List Operations';
            description = 'Benchmarks for enhanced List operations';
            break;
          case 'scalability':
            // Run scalability benchmark
            result = measureEnhancedListScalability(
              operation as any,
              maxSize,
              steps,
              benchmarkOptions
            );
            title = `Enhanced List Scalability: ${operation}`;
            description = `Measuring how ${operation} scales with input size`;
            break;
          case 'fusion':
            // Run operation fusion benchmark
            result = compareStandardVsFusedOperations(size, benchmarkOptions);
            title = 'Standard vs. Fused Operations';
            description = 'Comparison of standard operations with fused operations';
            break;
          case 'specialized':
            // Run specialized lists benchmark
            result = compareStandardVsSpecializedLists(size, benchmarkOptions);
            title = 'Standard vs. Specialized Lists';
            description = 'Comparison of standard lists with specialized lists';
            break;
          default:
            throw new Error(`Unknown benchmark type: ${type}`);
        }

        // Output results
        if (outputFormat === 'console') {
          if (type === 'all') {
            console.log('=== Enhanced List Operations ===');
            console.log(formatBenchmarkSuite(result.operations));
            console.log('\n=== Standard vs. Fused Operations ===');
            console.log(formatBenchmarkSuite(result.fusion));
            console.log('\n=== Standard vs. Specialized Lists ===');
            console.log(formatBenchmarkSuite(result.specialized));
          } else if (type === 'scalability') {
            console.log(formatScalabilityResult(result));
          } else {
            console.log(formatBenchmarkSuite(result));
          }
        } else {
          const output = exportToFormat(outputFormat, result, {
            chartType,
            logScale,
            title,
            description
          });

          if (outputFile) {
            const filePath = path.resolve(process.cwd(), outputFile);
            fs.writeFileSync(filePath, output);
            console.log(`Results saved to ${filePath}`);
          } else {
            console.log(output);
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }
    });

  return enhancedListCommand;
}

/**
 * Enhanced list command
 *
 * @param program - Commander program
 */
export function enhancedListCommand(program: Command): void {
  registerEnhancedListCommand(program);
}
