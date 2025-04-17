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
  .option('-c, --chart-type <type>', 'Chart type for HTML output (bar, line, pie)', 'bar')
  .action(exportCommand);

program.parse();
