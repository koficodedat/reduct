/**
 * Benchmark command
 *
 * Runs benchmarks using the benchmark registry.
 *
 * @packageDocumentation
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  BenchmarkRegistry,
  createBenchmarkConfig,
  initializeBenchmarkRegistry,
  AdapterFactory
} from '../../benchmark-registry/main';
import { benchmark } from '../../utils';
import { formatBenchmarkSuite } from '../../visualization/formatters';
import { resolveReportPath } from '../../utils/paths';

/**
 * Registers the benchmark command
 *
 * @param program - Commander program
 */
export function registerBenchmarkCommand(program: Command): void {
  const benchmarkCommand = program
    .command('benchmark <type>')
    .description('Run benchmarks for a specific type')
    .option('-o, --operations <operations>', 'Operations to benchmark (comma-separated)')
    .option('-i, --implementations <implementations>', 'Implementations to benchmark (comma-separated)')
    .option('-s, --sizes <sizes>', 'Input sizes to test (comma-separated)')
    .option('-n, --iterations <iterations>', 'Number of iterations to run')
    .option('-c, --special-case <case>', 'Special case to use')
    .option('-f, --output-file <file>', 'Output file for benchmark results')
    .option('--output <format>', 'Output format (console, json, csv, md, html)', 'console')
    .option('--list-operations', 'List available operations for the benchmark type')
    .option('--list-special-cases', 'List available special cases for the benchmark type')
    .action(async (type, options) => {
      try {
        // Initialize the benchmark registry
        initializeBenchmarkRegistry();

        // Get the benchmark definition
        const definition = BenchmarkRegistry.get(type);
        if (!definition) {
          console.error(`Benchmark type '${type}' not found`);
          console.log('Available benchmark types:');
          console.log(Array.from(BenchmarkRegistry.getAll().keys()).join(', '));
          process.exit(1);
        }

        // List operations if requested
        if (options.listOperations) {
          console.log(`Available operations for ${definition.name}:`);
          definition.operations.forEach(op => {
            console.log(`- ${op.name}${op.description ? `: ${op.description}` : ''}`);
          });
          return;
        }

        // List special cases if requested
        if (options.listSpecialCases) {
          if (!definition.specialCases || definition.specialCases.length === 0) {
            console.log(`No special cases available for ${definition.name}`);
            return;
          }

          console.log(`Available special cases for ${definition.name}:`);
          definition.specialCases.forEach(sc => {
            console.log(`- ${sc.name}${sc.description ? `: ${sc.description}` : ''}`);
          });
          return;
        }

        // Parse options
        const operations = options.operations ? options.operations.split(',') : undefined;
        const implementations = options.implementations ? options.implementations.split(',') : undefined;
        const inputSizes = options.sizes ? options.sizes.split(',').map(Number) : undefined;
        const iterations = options.iterations ? Number(options.iterations) : undefined;
        const specialCase = options.specialCase;

        // Create benchmark configuration
        const config = createBenchmarkConfig(type, {
          operations,
          implementations,
          inputSizes,
          iterations,
          specialCase
        });

        // Run benchmarks
        console.log(`Running ${definition.name}...`);

        // Get the setup function
        let setupFn = definition.setupFn;
        if (specialCase && definition.specialCases) {
          const sc = definition.specialCases.find(sc => sc.name === specialCase);
          if (sc) {
            setupFn = sc.setupFn;
          }
        }

        if (!setupFn) {
          console.error(`No setup function available for ${definition.name}`);
          process.exit(1);
        }

        // Run benchmarks for each operation
        const results = [];

        for (const operationName of config.operations || []) {
          const operation = definition.operations.find(op => op.name === operationName);
          if (!operation) {
            console.error(`Operation '${operationName}' not found for ${definition.name}`);
            continue;
          }

          console.log(`Benchmarking ${operationName}...`);

          // Create test data
          const size = config.inputSizes?.[0] || 1000;
          const testData = setupFn(size);

          // Run benchmark
          const result = benchmark(
            operation.adapter,
            [testData],
            { iterations: config.iterations || 1000 }
          );

          // Add metadata
          result.name = `${definition.type}.${operationName}`;
          result.operation = operationName;
          result.inputSize = size;

          results.push(result);
        }

        // Format and output results
        const outputFormat = options.output || 'console';

        // Create a benchmark suite from the results
        const suite = {
          name: `${definition.name} Benchmark`,
          description: definition.description || '',
          benchmarks: results
        };

        const formatted = formatBenchmarkSuite(suite);

        if (options.outputFile) {
          const outputPath = resolveReportPath(options.outputFile);
          fs.writeFileSync(outputPath, formatted, 'utf-8');
          console.log(`Results saved to ${outputPath}`);
        } else {
          console.log(formatted);
        }
      } catch (error) {
        console.error('Error running benchmark:', error);
        process.exit(1);
      }
    });

  // Add a command to list available benchmark types
  benchmarkCommand
    .command('list')
    .description('List available benchmark types')
    .action(() => {
      // Initialize the benchmark registry
      initializeBenchmarkRegistry();

      console.log('Available benchmark types:');
      const benchmarks = Array.from(BenchmarkRegistry.getAll().values());

      if (benchmarks.length === 0) {
        console.log('No benchmark types available');
        return;
      }

      // Group by category
      const categories = new Map<string, typeof benchmarks>();

      benchmarks.forEach(benchmark => {
        if (!categories.has(benchmark.category)) {
          categories.set(benchmark.category, []);
        }
        categories.get(benchmark.category)!.push(benchmark);
      });

      // Print by category
      for (const [category, benchmarks] of categories.entries()) {
        console.log(`\n${category.charAt(0).toUpperCase() + category.slice(1)}s:`);
        benchmarks.forEach(benchmark => {
          console.log(`- ${benchmark.type}: ${benchmark.name}${benchmark.description ? ` - ${benchmark.description}` : ''}`);
        });
      }
    });

  // Add a command to list available operations for a benchmark type
  benchmarkCommand
    .command('operations <type>')
    .description('List available operations for a benchmark type')
    .action((type) => {
      // Initialize the benchmark registry
      initializeBenchmarkRegistry();

      // Get the benchmark definition
      const definition = BenchmarkRegistry.get(type);
      if (!definition) {
        console.error(`Benchmark type '${type}' not found`);
        console.log('Available benchmark types:');
        console.log(Array.from(BenchmarkRegistry.getAll().keys()).join(', '));
        process.exit(1);
      }

      console.log(`Available operations for ${definition.name}:`);
      definition.operations.forEach(op => {
        console.log(`- ${op.name}${op.description ? `: ${op.description}` : ''}`);
      });
    });

  // Add a command to list available special cases for a benchmark type
  benchmarkCommand
    .command('special-cases <type>')
    .description('List available special cases for a benchmark type')
    .action((type) => {
      // Initialize the benchmark registry
      initializeBenchmarkRegistry();

      // Get the benchmark definition
      const definition = BenchmarkRegistry.get(type);
      if (!definition) {
        console.error(`Benchmark type '${type}' not found`);
        console.log('Available benchmark types:');
        console.log(Array.from(BenchmarkRegistry.getAll().keys()).join(', '));
        process.exit(1);
      }

      if (!definition.specialCases || definition.specialCases.length === 0) {
        console.log(`No special cases available for ${definition.name}`);
        return;
      }

      console.log(`Available special cases for ${definition.name}:`);
      definition.specialCases.forEach(sc => {
        console.log(`- ${sc.name}${sc.description ? `: ${sc.description}` : ''}`);
      });
    });
}
