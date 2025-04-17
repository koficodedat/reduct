/**
 * CLI for Reduct Benchmarking
 *
 * Provides a command-line interface for running benchmarks, comparing
 * implementations, and exporting results.
 *
 * @packageDocumentation
 */

import { Command } from 'commander';
import { runCommand } from './commands/run';
import { compareCommand } from './commands/compare';
import { scalabilityCommand } from './commands/scalability';
import { exportCommand } from './commands/export';
import { registerTemplateExportCommand } from './commands/template-export';
import { createAnalyzeCommand } from './commands/analyze';
import { createTrendCommand } from './commands/trend';
import { ComparisonBuilder, runComplexComparison, formatComplexComparisonResult } from '../comparison';
import { exportToFormat } from '../visualization/exporters';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates the CLI program with all commands and options
 *
 * @returns Configured commander program
 */
export function createCLI(): Command {
  const program = new Command();

  program
    .name('reduct-benchmark')
    .description('Reduct benchmarking CLI')
    .version('0.1.0');

  // Run command
  program
    .command('run')
    .description('Run benchmarks for a specific data structure or algorithm')
    .argument('<type>', 'Type to benchmark (list, map, stack, sorting, searching)')
    .option('-s, --size <number>', 'Size of the data structure', '10000')
    .option('-i, --iterations <number>', 'Number of iterations', '100')
    .option('-m, --measure-memory', 'Measure memory usage')
    .option('-o, --output <format>', 'Output format (console, csv, md, html)', 'console')
    .option('-f, --output-file <file>', 'Output file path')
    .action(runCommand);

  // Compare command
  program
    .command('compare')
    .description('Compare multiple data structures or algorithms')
    .argument('<types...>', 'Types to compare (list, array, map, etc.)')
    .option('-o, --operations <operations...>', 'Operations to compare')
    .option('-s, --size <number>', 'Size of the data structures', '10000')
    .option('-i, --iterations <number>', 'Number of iterations', '100')
    .option('-m, --measure-memory', 'Measure memory usage')
    .option('--output <format>', 'Output format (console, csv, md, html)', 'console')
    .option('-f, --output-file <file>', 'Output file path')
    .action(compareCommand);

  // Scalability command
  program
    .command('scalability')
    .description('Measure how performance scales with input size')
    .argument('<type>', 'Type to benchmark (list, map, stack, sorting, searching)')
    .argument('<operation>', 'Operation to test')
    .option('-m, --max-size <number>', 'Maximum size to test', '100000')
    .option('-s, --steps <number>', 'Number of size steps', '5')
    .option('-i, --iterations <number>', 'Number of iterations', '100')
    .option('--output <format>', 'Output format (console, csv, md, html)', 'console')
    .option('-f, --output-file <file>', 'Output file path')
    .action(scalabilityCommand);

  // Export command
  program
    .command('export')
    .description('Export benchmark results to various formats')
    .argument('<format>', 'Output format (csv, md, html, console)')
    .option('-i, --input <file>', 'Input JSON file with benchmark results')
    .option('-o, --output <file>', 'Output file')
    .option('-c, --chart-type <type>', 'Chart type for HTML output (bar, line, pie, radar)', 'bar')
    .action(exportCommand);

  // Register template export command
  registerTemplateExportCommand(program);

  // Register analyze command
  program.addCommand(createAnalyzeCommand());

  // Register trend command
  program.addCommand(createTrendCommand());

  // Register complex compare command
  program
    .command('complex-compare')
    .description('Compare implementations based on capabilities')
    .argument('<capability>', 'Capability to compare (e.g., sequence, key-value-store, stack)')
    .option('-o, --operations <list>', 'Comma-separated list of operations to compare')
    .option('-s, --size <number>', 'Size of the data structures to test', '10000')
    .option('-i, --iterations <number>', 'Number of iterations', '100')
    .option('--output <format>', 'Output format (console, csv, md, html)', 'console')
    .option('-f, --output-file <file>', 'Output file path')
    .option('--chart-type <type>', 'Chart type for HTML output (bar, line, pie)', 'bar')
    .option('--log-scale', 'Use logarithmic scale for charts')
    .option('--test-case <type>', 'Test case type (random, sequential, reversed)', 'random')
    .action((capability, options) => {
      try {
        // Parse options
        const size = parseInt(options.size, 10);
        const iterations = parseInt(options.iterations, 10);
        const operations = options.operations ? options.operations.split(',') : undefined;
        const outputFormat = options.output;
        const outputFile = options.outputFile;
        const chartType = options.chartType;
        const logScale = options.logScale;
        const testCase = options.testCase || 'random';

        // Create builder
        const builder = new ComparisonBuilder()
          .name(`${capability.charAt(0).toUpperCase() + capability.slice(1)} Comparison`)
          .description(`Comparing different implementations with the ${capability} capability`)
          .withCapability(capability)
          .withInputSizes([size])
          .withOptions({
            iterations,
            warmupIterations: 10
          });

        // Add operations if specified
        if (operations) {
          builder.withOperations(operations);
        }

        // Add test case based on type
        if (testCase === 'random') {
          builder.addTestCase('Random', (size) => {
            return {
              array: Array.from({ length: size }, () => Math.floor(Math.random() * size)),
              indices: Array.from({ length: 100 }, () => Math.floor(Math.random() * size)),
              keys: Array.from({ length: 100 }, () => `key${Math.floor(Math.random() * size)}`)
            };
          });
        } else if (testCase === 'sequential') {
          builder.addTestCase('Sequential', (size) => {
            return {
              array: Array.from({ length: size }, (_, i) => i),
              indices: Array.from({ length: 100 }, (_, i) => i * Math.floor(size / 100)),
              keys: Array.from({ length: 100 }, (_, i) => `key${i * Math.floor(size / 100)}`)
            };
          });
        } else if (testCase === 'reversed') {
          builder.addTestCase('Reversed', (size) => {
            return {
              array: Array.from({ length: size }, (_, i) => size - i - 1),
              indices: Array.from({ length: 100 }, (_, i) => size - i * Math.floor(size / 100) - 1),
              keys: Array.from({ length: 100 }, (_, i) => `key${size - i * Math.floor(size / 100) - 1}`)
            };
          });
        }

        // Build and run comparison
        const config = builder.build();
        const results = runComplexComparison(config);

        // Output results
        if (outputFormat === 'console') {
          console.log(formatComplexComparisonResult(results));
        } else {
          const output = exportToFormat(outputFormat, results, {
            chartType,
            logScale,
            title: results.name,
            description: results.description
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

  return program;
}

/**
 * CLI entry point
 *
 * @param args - Command line arguments
 */
export function cli(args: string[] = process.argv.slice(2)): void {
  const program = createCLI();
  program.parse(args);
}
