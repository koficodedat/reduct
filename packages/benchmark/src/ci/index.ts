/**
 * CI/CD integration for the benchmark package
 *
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { resolveReportPath } from '../utils/paths';
import { detectRegressions, TrendAnalysisOptions } from '../analysis/trends';
import { exportComparisonToMarkdown } from '../visualization/exporters';

/**
 * CI/CD integration options
 */
export interface CIOptions {
  /** Directory to store benchmark history */
  historyDir?: string;
  /** Maximum number of runs to keep */
  maxRuns?: number;
  /** Threshold for regression detection (0-1) */
  regressionThreshold?: number;
  /** Number of runs to use for baseline */
  baselineRuns?: number;
  /** Whether to fail the CI/CD pipeline if regressions are detected */
  failOnRegression?: boolean;
  /** Output format for reports (markdown, json) */
  outputFormat?: 'markdown' | 'json';
  /** Output file for reports */
  outputFile?: string;
  /** GitHub Actions environment */
  githubActions?: boolean;
  /** Whether to comment on pull requests with benchmark results */
  commentOnPR?: boolean;
}

/**
 * Default CI/CD integration options
 */
const defaultCIOptions: CIOptions = {
  historyDir: '.benchmark-history',
  maxRuns: 100,
  regressionThreshold: 0.1,
  baselineRuns: 3,
  failOnRegression: true,
  outputFormat: 'markdown',
  githubActions: process.env.GITHUB_ACTIONS === 'true',
  commentOnPR: true,
};

/**
 * Run benchmarks in CI/CD environment
 *
 * @param benchmarkCommand - Benchmark command to run
 * @param options - CI/CD integration options
 * @returns Whether the benchmarks passed (no regressions)
 */
export function runBenchmarksInCI(benchmarkCommand: string, options?: CIOptions): boolean {
  const opts = { ...defaultCIOptions, ...options };
  const historyDir = path.resolve(process.cwd(), opts.historyDir || '.benchmark-history');

  // Create history directory if it doesn't exist
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Run the benchmark command and capture the output
  console.log(`Running benchmark command: ${benchmarkCommand}`);
  const outputFile = path.resolve(process.cwd(), 'benchmark-results.json');

  try {
    // Run the benchmark command with JSON output
    const fullCommand = `${benchmarkCommand} --output json --output-file ${outputFile}`;
    execSync(fullCommand, { stdio: 'inherit' });

    // Check if the output file exists
    if (!fs.existsSync(outputFile)) {
      console.error('Benchmark command did not produce output file');
      return false;
    }

    // Load the benchmark results
    const results = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

    // Record the benchmark run in history
    const timestamp = new Date().toISOString();
    const gitCommit = getGitCommit();
    const gitBranch = getGitBranch();
    const runId = `${timestamp}-${gitCommit.slice(0, 7)}`;

    // Add metadata to the results
    const resultsWithMetadata = {
      ...results,
      metadata: {
        timestamp,
        gitCommit,
        gitBranch,
        runId,
        command: benchmarkCommand,
      },
    };

    // Save the results to history
    const historyFile = path.join(historyDir, `${runId}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(resultsWithMetadata, null, 2));

    // Clean up old history files if we have too many
    cleanupHistoryFiles(historyDir, opts.maxRuns || 100);

    // Detect regressions
    const regressions = detectRegressionsInCI(historyDir, {
      regressionThreshold: opts.regressionThreshold,
      baselineRuns: opts.baselineRuns,
    });

    // Generate report
    let report = '';
    if (opts.outputFormat === 'json') {
      report = JSON.stringify({
        results,
        regressions,
        metadata: {
          timestamp: new Date().toISOString(),
          gitCommit,
          gitBranch,
        },
      }, null, 2);
    } else {
      // Default to markdown
      report = generateCIReport(results, regressions, {
        gitCommit,
        gitBranch,
      });
    }

    // Save report
    if (opts.outputFile) {
      const reportPath = resolveReportPath(opts.outputFile);
      fs.writeFileSync(reportPath, report);
      console.log(`Report saved to ${reportPath}`);
    } else {
      console.log(report);
    }

    // Handle GitHub Actions integration
    if (opts.githubActions) {
      handleGitHubActions(report, regressions, opts);
    }

    // Determine if we should fail the CI/CD pipeline
    const hasRegressions = regressions.some(r => r.hasRegression);
    if (hasRegressions && opts.failOnRegression) {
      console.error('Performance regressions detected!');
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error running benchmarks in CI: ${error}`);
    return false;
  } finally {
    // Clean up the output file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  }
}

/**
 * Get the current git commit hash
 *
 * @returns Git commit hash
 */
function getGitCommit(): string {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    console.warn('Could not get git commit hash');
    return 'unknown';
  }
}

/**
 * Get the current git branch
 *
 * @returns Git branch name
 */
function getGitBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.warn('Could not get git branch name');
    return 'unknown';
  }
}

/**
 * Clean up old history files
 *
 * @param historyDir - Directory containing history files
 * @param maxRuns - Maximum number of runs to keep
 */
function cleanupHistoryFiles(historyDir: string, maxRuns: number): void {
  const files = fs.readdirSync(historyDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(historyDir, file),
      time: fs.statSync(path.join(historyDir, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > maxRuns) {
    const filesToDelete = files.slice(maxRuns);
    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
    }
    console.log(`Cleaned up ${filesToDelete.length} old history files`);
  }
}

/**
 * Detect regressions in CI/CD environment
 *
 * @param historyDir - Directory containing history files
 * @param options - Trend analysis options
 * @returns Regression analysis results
 */
function detectRegressionsInCI(historyDir: string, options?: Partial<TrendAnalysisOptions>): any[] {
  // Load all history files
  const files = fs.readdirSync(historyDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(historyDir, file),
      time: fs.statSync(path.join(historyDir, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.log('No benchmark history found');
    return [];
  }

  // Load the benchmark results from each file
  const history = files.map(file => {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const data = JSON.parse(content);
      return {
        ...data,
        timestamp: file.name.split('-')[0],
      };
    } catch (error) {
      console.warn(`Error loading history file ${file.name}: ${error}`);
      return null;
    }
  }).filter(Boolean);

  // Detect regressions
  return detectRegressions(history, options);
}

/**
 * Generate CI/CD report in Markdown format
 *
 * @param results - Benchmark results
 * @param regressions - Regression analysis results
 * @param options - Report options
 * @returns Report content
 */
function generateCIReport(results: any, regressions: any[], options: any): string {
  const { gitCommit, gitBranch } = options;

  // Default to markdown
  let report = `# Benchmark Results\n\n`;
  report += `*Run at: ${new Date().toISOString()}*\n\n`;
  report += `*Git commit: ${gitCommit}*\n\n`;
  report += `*Git branch: ${gitBranch}*\n\n`;

  // Add benchmark results
  report += `## Results\n\n`;
  if ('results' in results) {
    // It's a comparison
    report += exportComparisonToMarkdown(results);
  } else {
    // Just include a summary
    report += `Results included ${Object.keys(results).length} benchmarks.\n\n`;
  }

  // Add regression analysis
  report += `## Regression Analysis\n\n`;
  if (regressions.length === 0) {
    report += `No regressions detected.\n\n`;
  } else {
    const hasRegressions = regressions.some(r => r.hasRegression);
    if (hasRegressions) {
      report += `⚠️ **Performance regressions detected!** ⚠️\n\n`;
    } else {
      report += `No regressions detected.\n\n`;
    }

    for (const regression of regressions) {
      report += `### ${regression.implementation} - ${regression.operation}\n\n`;

      if (regression.hasRegression) {
        report += `⚠️ **Regression detected!**\n\n`;
        report += `- Current: ${regression.current.toFixed(4)} ms\n`;
        report += `- Baseline: ${regression.baseline.toFixed(4)} ms\n`;
        report += `- Change: ${(regression.percentChange * 100).toFixed(2)}%\n\n`;
      } else {
        report += `No regression detected.\n\n`;
        report += `- Current: ${regression.current.toFixed(4)} ms\n`;
        report += `- Baseline: ${regression.baseline.toFixed(4)} ms\n`;
        report += `- Change: ${(regression.percentChange * 100).toFixed(2)}%\n\n`;
      }
    }
  }

  return report;
}

/**
 * Handle GitHub Actions integration
 *
 * @param report - Benchmark report
 * @param regressions - Regression analysis results
 * @param options - CI/CD integration options
 */
function handleGitHubActions(report: string, regressions: any[], options: CIOptions): void {
  // Set output variables for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const hasRegressions = regressions.some(r => r.hasRegression);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_regressions=${hasRegressions}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `regression_count=${regressions.filter(r => r.hasRegression).length}\n`);
  }

  // Add annotations for regressions
  for (const regression of regressions) {
    if (regression.hasRegression) {
      const message = `Performance regression detected in ${regression.implementation} - ${regression.operation}. ` +
        `Current: ${regression.current.toFixed(4)} ms, Baseline: ${regression.baseline.toFixed(4)} ms, ` +
        `Change: ${(regression.percentChange * 100).toFixed(2)}%`;

      console.log(`::warning::${message}`);
    }
  }

  // Comment on PR if enabled
  if (options.commentOnPR && process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY && process.env.GITHUB_EVENT_PATH) {
    try {
      const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf-8'));
      if (event.pull_request) {
        const prNumber = event.pull_request.number;
        const repo = process.env.GITHUB_REPOSITORY;

        // Create comment using GitHub API
        const comment = {
          body: report,
        };

        const command = `curl -X POST -H "Authorization: token ${process.env.GITHUB_TOKEN}" ` +
          `-H "Accept: application/vnd.github.v3+json" ` +
          `https://api.github.com/repos/${repo}/issues/${prNumber}/comments ` +
          `-d '${JSON.stringify(comment)}'`;

        execSync(command, { stdio: 'pipe' });
        console.log(`Posted benchmark results as comment on PR #${prNumber}`);
      }
    } catch (error) {
      console.warn(`Error commenting on PR: ${error}`);
    }
  }
}

/**
 * Create a GitHub Actions workflow file for benchmarks
 *
 * @param outputPath - Path to save the workflow file
 * @param benchmarkCommand - Benchmark command to run
 * @param options - CI/CD integration options
 */
export function createGitHubWorkflow(outputPath: string, benchmarkCommand: string, options?: CIOptions): void {
  const opts = { ...defaultCIOptions, ...options };

  const workflow = `name: Benchmark

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  benchmark:
    name: Run Benchmarks
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build packages
        run: yarn build

      - name: Run benchmarks
        id: benchmark
        run: node packages/benchmark/dist/cli/bin.js ci "${benchmarkCommand}" ${opts.failOnRegression ? '--fail-on-regression' : ''} --output-file benchmark-report.md

      - name: Upload benchmark results
        uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: |
            benchmark-report.md
            .benchmark-history/*.json

      - name: Comment on PR
        if: github.event_name == 'pull_request' && steps.benchmark.outputs.has_regressions == 'true'
        uses: actions/github-script@v6
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('benchmark-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
`;

  fs.writeFileSync(outputPath, workflow);
  console.log(`GitHub Actions workflow file created at ${outputPath}`);
}

/**
 * CI command handler
 *
 * @param benchmarkCommand - Benchmark command to run
 * @param options - Command options
 */
export function ciCommand(benchmarkCommand: string, options: any): void {
  const ciOptions: CIOptions = {
    historyDir: options.historyDir,
    maxRuns: parseInt(options.maxRuns, 10),
    regressionThreshold: parseFloat(options.regressionThreshold),
    baselineRuns: parseInt(options.baselineRuns, 10),
    failOnRegression: options.failOnRegression,
    outputFormat: options.format,
    outputFile: options.outputFile,
    githubActions: process.env.GITHUB_ACTIONS === 'true',
    commentOnPR: options.commentOnPr,
  };

  const success = runBenchmarksInCI(benchmarkCommand, ciOptions);

  if (!success && ciOptions.failOnRegression) {
    process.exit(1);
  }
}

/**
 * Create workflow command handler
 *
 * @param benchmarkCommand - Benchmark command to run
 * @param options - Command options
 */
export function createWorkflowCommand(benchmarkCommand: string, options: any): void {
  const outputPath = options.output || '.github/workflows/benchmark.yml';
  const dirPath = path.dirname(outputPath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  createGitHubWorkflow(outputPath, benchmarkCommand, {
    failOnRegression: options.failOnRegression,
    historyDir: options.historyDir,
    maxRuns: parseInt(options.maxRuns, 10),
    regressionThreshold: parseFloat(options.regressionThreshold),
    baselineRuns: parseInt(options.baselineRuns, 10),
  });
}
