#!/usr/bin/env node
/**
 * CLI script to generate a performance dashboard
 */
import { generateDashboard } from '../utils/dashboard';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('results-dir', {
    alias: 'r',
    type: 'string',
    description: 'Directory containing benchmark results',
    default: path.join(process.cwd(), 'packages/benchmark/reports'),
  })
  .option('output-dir', {
    alias: 'o',
    type: 'string',
    description: 'Output directory for dashboard',
    default: path.join(process.cwd(), 'packages/benchmark/dashboard'),
  })
  .option('history-length', {
    alias: 'hl',
    type: 'number',
    description: 'Number of historical results to include',
    default: 10,
  })
  .option('title', {
    alias: 't',
    type: 'string',
    description: 'Title of the dashboard',
    default: 'Reduct Performance Dashboard',
  })
  .option('description', {
    alias: 'd',
    type: 'string',
    description: 'Description of the dashboard',
    default: 'Performance dashboard for the Reduct library',
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Generate dashboard
console.log('Generating performance dashboard...');
console.log(`Results directory: ${argv.resultsDir}`);
console.log(`Output directory: ${argv.outputDir}`);
console.log(`History length: ${argv.historyLength}`);
console.log(`Title: ${argv.title}`);
console.log(`Description: ${argv.description}`);
console.log('');

generateDashboard({
  resultsDir: argv.resultsDir,
  outputDir: argv.outputDir,
  historyLength: argv.historyLength,
  title: argv.title,
  description: argv.description,
});
