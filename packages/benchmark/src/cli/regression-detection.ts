#!/usr/bin/env node
/**
 * CLI script to detect performance regressions
 */
import { detectRegressions, saveRegressionResult, hasRegressions } from '../utils/regression-detection';
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
  .option('history-length', {
    alias: 'hl',
    type: 'number',
    description: 'Number of historical results to compare with',
    default: 5,
  })
  .option('regression-threshold', {
    alias: 't',
    type: 'number',
    description: 'Threshold for regression detection (percentage)',
    default: 10,
  })
  .option('improvement-threshold', {
    alias: 'i',
    type: 'number',
    description: 'Threshold for improvement detection (percentage)',
    default: 10,
  })
  .option('ignore-small-changes', {
    alias: 's',
    type: 'boolean',
    description: 'Whether to ignore small changes',
    default: true,
  })
  .option('small-change-threshold', {
    alias: 'c',
    type: 'number',
    description: 'Threshold for small changes (milliseconds)',
    default: 0.1,
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output file for regression report',
    default: path.join(process.cwd(), 'packages/benchmark/reports/regression-report.md'),
  })
  .option('fail-on-regression', {
    alias: 'f',
    type: 'boolean',
    description: 'Exit with non-zero code if regressions are detected',
    default: false,
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Detect regressions
console.log('Detecting performance regressions...');
console.log(`Results directory: ${argv.resultsDir}`);
console.log(`History length: ${argv.historyLength}`);
console.log(`Regression threshold: ${argv.regressionThreshold}%`);
console.log(`Improvement threshold: ${argv.improvementThreshold}%`);
console.log(`Ignore small changes: ${argv.ignoreSmallChanges}`);
console.log(`Small change threshold: ${argv.smallChangeThreshold}ms`);
console.log('');

const result = detectRegressions({
  resultsDir: argv.resultsDir,
  historyLength: argv.historyLength,
  regressionThreshold: argv.regressionThreshold,
  improvementThreshold: argv.improvementThreshold,
  ignoreSmallChanges: argv.ignoreSmallChanges,
  smallChangeThreshold: argv.smallChangeThreshold,
});

// Print summary
console.log('Performance Regression Summary:');
console.log('------------------------------');
console.log(`Regressions: ${result.regressions.length}`);
console.log(`Improvements: ${result.improvements.length}`);
console.log(`No significant changes: ${result.noChanges.length}`);
console.log(`New benchmarks: ${result.newBenchmarks.length}`);
console.log(`Missing benchmarks: ${result.missingBenchmarks.length}`);
console.log('');

// Print regressions
if (result.regressions.length > 0) {
  console.log('Regressions:');
  console.log('------------');

  for (const regression of result.regressions) {
    console.log(`${regression.name}:`);
    console.log(`  Current: ${regression.current.meanTime.toFixed(3)}ms`);
    console.log(`  Previous: ${regression.previous.meanTime.toFixed(3)}ms`);
    console.log(`  Change: ${regression.percentageChange.toFixed(2)}% (${regression.absoluteChange.toFixed(3)}ms)`);
    console.log('');
  }
}

// Print improvements
if (result.improvements.length > 0) {
  console.log('Improvements:');
  console.log('-------------');

  for (const improvement of result.improvements) {
    console.log(`${improvement.name}:`);
    console.log(`  Current: ${improvement.current.meanTime.toFixed(3)}ms`);
    console.log(`  Previous: ${improvement.previous.meanTime.toFixed(3)}ms`);
    console.log(`  Change: ${improvement.percentageChange.toFixed(2)}% (${improvement.absoluteChange.toFixed(3)}ms)`);
    console.log('');
  }
}

// Save regression report
saveRegressionResult(result, argv.output);
console.log(`Regression report saved to: ${argv.output}`);

// Exit with non-zero code if regressions are detected
if (argv.failOnRegression && hasRegressions(result)) {
  console.error('Performance regressions detected!');
  process.exit(1);
}
