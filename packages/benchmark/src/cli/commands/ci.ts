/**
 * CI/CD integration command
 *
 * @packageDocumentation
 */

import { Command } from 'commander';

import { ciCommand, createWorkflowCommand } from '../../ci';

/**
 * Create the CI command
 *
 * @returns Command instance
 */
export function createCICommand(): Command {
  const command = new Command('ci')
    .description('Run benchmarks in CI/CD environment')
    .argument('<command>', 'Benchmark command to run')
    .option('-d, --history-dir <directory>', 'Directory to store benchmark history', '.benchmark-history')
    .option('-m, --max-runs <number>', 'Maximum number of runs to keep', '100')
    .option('-t, --regression-threshold <number>', 'Threshold for regression detection (0-1)', '0.1')
    .option('-b, --baseline-runs <number>', 'Number of runs to use for baseline', '3')
    .option('-f, --format <format>', 'Output format (markdown, json)', 'markdown')
    .option('-o, --output-file <file>', 'Output file for reports')
    .option('--no-fail-on-regression', 'Do not fail the CI/CD pipeline if regressions are detected')
    .option('--no-comment-on-pr', 'Do not comment on pull requests with benchmark results')
    .action(ciCommand);

  // Add subcommand for creating GitHub Actions workflow
  command
    .command('create-workflow')
    .description('Create GitHub Actions workflow file for benchmarks')
    .argument('<command>', 'Benchmark command to run')
    .option('-o, --output <file>', 'Output file path', '.github/workflows/benchmark.yml')
    .option('-d, --history-dir <directory>', 'Directory to store benchmark history', '.benchmark-history')
    .option('-m, --max-runs <number>', 'Maximum number of runs to keep', '100')
    .option('-t, --regression-threshold <number>', 'Threshold for regression detection (0-1)', '0.1')
    .option('-b, --baseline-runs <number>', 'Number of runs to use for baseline', '3')
    .option('--no-fail-on-regression', 'Do not fail the CI/CD pipeline if regressions are detected')
    .action(createWorkflowCommand);

  return command;
}
