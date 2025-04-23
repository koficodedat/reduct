#!/usr/bin/env node
/**
 * CLI script to perform automatic bisection
 */
import * as fs from 'fs';
import * as path from 'path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { performBisection, formatBisectionResultMarkdown } from '../utils/bisection';


// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('repo-path', {
    alias: 'r',
    type: 'string',
    description: 'Path to the repository',
    default: process.cwd(),
  })
  .option('good-commit', {
    alias: 'g',
    type: 'string',
    description: 'Good commit (known to be without regression)',
  })
  .option('bad-commit', {
    alias: 'b',
    type: 'string',
    description: 'Bad commit (known to have regression)',
  })
  .option('benchmark-command', {
    alias: 'c',
    type: 'string',
    description: 'Command to run the benchmark',
    demandOption: true,
  })
  .option('regression-detection-command', {
    alias: 'd',
    type: 'string',
    description: 'Command to run to detect regressions',
    demandOption: true,
  })
  .option('max-iterations', {
    alias: 'm',
    type: 'number',
    description: 'Maximum number of iterations',
    default: 20,
  })
  .option('timeout', {
    alias: 't',
    type: 'number',
    description: 'Timeout for each command in milliseconds',
    default: 10 * 60 * 1000, // 10 minutes
  })
  .option('skip-verification', {
    alias: 's',
    type: 'boolean',
    description: 'Whether to skip verification of good and bad commits',
    default: false,
  })
  .option('clean-working-dir', {
    alias: 'w',
    type: 'boolean',
    description: 'Whether to clean the working directory before each checkout',
    default: true,
  })
  .option('output-file', {
    alias: 'o',
    type: 'string',
    description: 'Output file for bisection results (JSON)',
    default: path.join(process.cwd(), 'packages/benchmark/bisection-results.json'),
  })
  .option('markdown-file', {
    alias: 'md',
    type: 'string',
    description: 'Output file for bisection results (Markdown)',
    default: path.join(process.cwd(), 'packages/benchmark/bisection-results.md'),
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Perform bisection
console.log('Performing automatic bisection...');
console.log(`Repository path: ${argv.repoPath}`);
console.log(`Good commit: ${argv.goodCommit || 'auto'}`);
console.log(`Bad commit: ${argv.badCommit || 'auto'}`);
console.log(`Benchmark command: ${argv.benchmarkCommand}`);
console.log(`Regression detection command: ${argv.regressionDetectionCommand}`);
console.log(`Maximum iterations: ${argv.maxIterations}`);
console.log(`Timeout: ${argv.timeout}ms`);
console.log(`Skip verification: ${argv.skipVerification}`);
console.log(`Clean working directory: ${argv.cleanWorkingDir}`);
console.log(`Output file (JSON): ${argv.outputFile}`);
console.log(`Output file (Markdown): ${argv.markdownFile}`);
console.log('');

performBisection({
  repoPath: argv.repoPath,
  goodCommit: argv.goodCommit,
  badCommit: argv.badCommit,
  benchmarkCommand: argv.benchmarkCommand,
  regressionDetectionCommand: argv.regressionDetectionCommand,
  maxIterations: argv.maxIterations,
  timeout: argv.timeout,
  skipVerification: argv.skipVerification,
  cleanWorkingDir: argv.cleanWorkingDir,
  outputFile: argv.outputFile,
})
  .then((result) => {
    console.log('\nBisection completed successfully!');
    console.log(`First bad commit: ${result.firstBadCommit.hash}`);
    console.log(`Author: ${result.firstBadCommit.author}`);
    console.log(`Date: ${result.firstBadCommit.date}`);
    console.log(`Message: ${result.firstBadCommit.message}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Duration: ${(result.duration / 1000 / 60).toFixed(2)} minutes`);
    
    // Save markdown result
    if (argv.markdownFile) {
      const markdown = formatBisectionResultMarkdown(result);
      const markdownDir = path.dirname(argv.markdownFile);
      
      if (!fs.existsSync(markdownDir)) {
        fs.mkdirSync(markdownDir, { recursive: true });
      }
      
      fs.writeFileSync(argv.markdownFile, markdown);
      console.log(`\nBisection results (Markdown) saved to: ${argv.markdownFile}`);
    }
  })
  .catch((error) => {
    console.error('\nBisection failed:', error);
    process.exit(1);
  });
