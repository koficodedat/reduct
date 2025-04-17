/**
 * Complex Compare Command
 * 
 * Provides a command for running complex comparisons between different
 * implementations based on capabilities.
 * 
 * @packageDocumentation
 */

import { Command, Option } from 'commander';
import { ComparisonBuilder, runComplexComparison, formatComplexComparisonResult } from '../../comparison';
import { exportToFormat } from '../../visualization/exporters';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates the complex-compare command
 * 
 * @returns The command
 */
export function createComplexCompareCommand(): Command {
  const command = new Command('complex-compare')
    .description('Compare implementations based on capabilities')
    .argument('<capability>', 'Capability to compare (e.g., sequence, key-value-store, stack)')
    .option('-o, --operations <list>', 'Comma-separated list of operations to compare')
    .option('-s, --size <number>', 'Size of the data structures to test', '10000')
    .option('-i, --iterations <number>', 'Number of iterations', '100')
    .option('--output <format>', 'Output format (console, csv, md, html)', 'console')
    .option('-f, --output-file <file>', 'Output file path')
    .option('--chart-type <type>', 'Chart type for HTML output (bar, line, pie)', 'bar')
    .option('--log-scale', 'Use logarithmic scale for charts')
    .addOption(new Option('--test-case <type>', 'Test case type').choices(['random', 'sequential', 'reversed']))
    .action(async (capability, options) => {
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
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    });
  
  return command;
}
