#!/usr/bin/env node

/**
 * CLI entry point
 *
 * This file is the entry point for the CLI when installed globally.
 *
 * @packageDocumentation
 */

import { Command } from 'commander';
import { runCommand } from './commands/run';
import { compareCommand } from './commands/compare';
import { adapterCompareCommand } from './commands/adapter-compare';
import { scalabilityCommand } from './commands/scalability';
import { exportCommand } from './commands/export';

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
  .option('-o, --operations <operations>', 'Operations to compare (comma-separated)')
  .option('-s, --size <number>', 'Size of the data structures', '10000')
  .option('-i, --iterations <number>', 'Number of iterations', '100')
  .option('-m, --measure-memory', 'Measure memory usage')
  .option('--output <format>', 'Output format (console, csv, md, html)', 'console')
  .option('-f, --output-file <file>', 'Output file path')
  .action(compareCommand);

// Adapter Compare command
program
  .command('adapter-compare')
  .description('Compare multiple data structures or algorithms using the adapter system')
  .argument('<types...>', 'Types to compare (list, array, map, quick-sort, etc.)')
  .option('-o, --operations <operations>', 'Operations to compare (comma-separated)')
  .option('-s, --size <number>', 'Size of the data structures', '10000')
  .option('-i, --iterations <number>', 'Number of iterations', '100')
  .option('-m, --measure-memory', 'Measure memory usage')
  .option('--output <format>', 'Output format (console, csv, md, html)', 'console')
  .option('-f, --output-file <file>', 'Output file path')
  .option('--min-score <number>', 'Minimum compatibility score (0-1)', '0.5')
  .action(adapterCompareCommand);

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
  .option('-t, --title <title>', 'Title for the output document')
  .option('--charts', 'Include charts in the output (for md and html formats)')
  .option('--no-headers', 'Exclude headers from CSV output')
  .option('--delimiter <char>', 'Delimiter for CSV output (default: comma)')
  .option('--format-numbers', 'Format numbers with thousands separator')
  .option('--log-scale', 'Use logarithmic scale for charts')
  .option('--no-legend', 'Hide chart legends')
  .option('--legend-position <position>', 'Legend position (top, bottom, left, right)', 'top')
  .option('--no-animation', 'Disable chart animations')
  .action(exportCommand);

program.parse();
