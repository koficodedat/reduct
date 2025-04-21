#!/usr/bin/env node
/**
 * CLI script to generate a notification dashboard
 */
import { generateNotificationDashboard } from '../utils/notification-dashboard';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('history-dir', {
    alias: 'hd',
    type: 'string',
    description: 'Directory containing notification history',
    default: path.join(process.cwd(), 'packages/benchmark/notification-history'),
  })
  .option('output-file', {
    alias: 'o',
    type: 'string',
    description: 'Output file for dashboard',
    default: path.join(process.cwd(), 'packages/benchmark/notification-dashboard/index.html'),
  })
  .option('max-entries', {
    alias: 'm',
    type: 'number',
    description: 'Maximum number of history entries to include',
    default: 100,
  })
  .option('title', {
    alias: 't',
    type: 'string',
    description: 'Title of the dashboard',
    default: 'Reduct Performance Notification Dashboard',
  })
  .option('description', {
    alias: 'd',
    type: 'string',
    description: 'Description of the dashboard',
    default: 'Dashboard for performance regression notifications',
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Generate dashboard
console.log('Generating notification dashboard...');
console.log(`History directory: ${argv.historyDir}`);
console.log(`Output file: ${argv.outputFile}`);
console.log(`Max entries: ${argv.maxEntries}`);
console.log(`Title: ${argv.title}`);
console.log(`Description: ${argv.description}`);
console.log('');

generateNotificationDashboard({
  historyDir: argv.historyDir,
  outputFile: argv.outputFile,
  maxEntries: argv.maxEntries,
  title: argv.title,
  description: argv.description,
});
