# CI/CD Integration for Benchmarks

This document explains how to integrate the Reduct benchmark system with CI/CD pipelines, particularly GitHub Actions.

## Overview

The benchmark package provides tools for running benchmarks in CI/CD environments, detecting performance regressions, and reporting results. This is useful for:

- Automatically running benchmarks on pull requests
- Detecting performance regressions before they are merged
- Tracking performance over time
- Generating reports and visualizations

## Using the CI Command

The `ci` command is designed to run benchmarks in CI/CD environments:

```bash
# Basic usage
npx reduct-benchmark ci "adapter-compare array list --operations get --size 10000"

# With options
npx reduct-benchmark ci "adapter-compare array list --operations get --size 10000" \
  --history-dir .benchmark-history \
  --regression-threshold 0.1 \
  --baseline-runs 3 \
  --format markdown \
  --output-file benchmark-report.md
```

### Options

- `--history-dir <directory>`: Directory to store benchmark history (default: `.benchmark-history`)
- `--max-runs <number>`: Maximum number of runs to keep (default: `100`)
- `--regression-threshold <number>`: Threshold for regression detection (0-1) (default: `0.1`)
- `--baseline-runs <number>`: Number of runs to use for baseline (default: `3`)
- `--format <format>`: Output format (markdown, json) (default: `markdown`)
- `--output-file <file>`: Output file for reports
- `--no-fail-on-regression`: Do not fail the CI/CD pipeline if regressions are detected
- `--no-comment-on-pr`: Do not comment on pull requests with benchmark results

## Creating a GitHub Actions Workflow

You can create a GitHub Actions workflow file using the `ci create-workflow` command:

```bash
# Basic usage
npx reduct-benchmark ci create-workflow "adapter-compare array list --operations get --size 10000"

# With options
npx reduct-benchmark ci create-workflow "adapter-compare array list --operations get --size 10000" \
  --output .github/workflows/custom-benchmark.yml \
  --history-dir .benchmark-history \
  --regression-threshold 0.1 \
  --baseline-runs 3
```

### Options

- `--output <file>`: Output file path (default: `.github/workflows/benchmark.yml`)
- `--history-dir <directory>`: Directory to store benchmark history (default: `.benchmark-history`)
- `--max-runs <number>`: Maximum number of runs to keep (default: `100`)
- `--regression-threshold <number>`: Threshold for regression detection (0-1) (default: `0.1`)
- `--baseline-runs <number>`: Number of runs to use for baseline (default: `3`)
- `--no-fail-on-regression`: Do not fail the CI/CD pipeline if regressions are detected

## Example GitHub Actions Workflow

Here's an example GitHub Actions workflow file:

```yaml
name: Benchmark

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
        run: node packages/benchmark/dist/cli/bin.js ci "adapter-compare array list --operations get --size 10000 --iterations 100" --output-file benchmark-report.md
      
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
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('benchmark-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

## Programmatic Usage

You can also use the CI/CD integration programmatically:

```typescript
import { runBenchmarksInCI, createGitHubWorkflow } from '@reduct/benchmark';

// Run benchmarks in CI
const success = runBenchmarksInCI('adapter-compare array list --operations get --size 10000', {
  historyDir: '.benchmark-history',
  regressionThreshold: 0.1,
  baselineRuns: 3,
  failOnRegression: true,
  outputFormat: 'markdown',
  outputFile: 'benchmark-report.md',
});

// Create GitHub Actions workflow file
createGitHubWorkflow('.github/workflows/benchmark.yml', 'adapter-compare array list --operations get --size 10000', {
  failOnRegression: true,
  historyDir: '.benchmark-history',
  regressionThreshold: 0.1,
  baselineRuns: 3,
});
```

## Best Practices

1. **Keep benchmark runs consistent**: Use the same hardware and environment for all benchmark runs to ensure fair comparisons.

2. **Use appropriate thresholds**: Set the regression threshold based on the expected variability of your benchmarks. A value of 0.1 (10%) is a good starting point.

3. **Store benchmark history**: Keep a history of benchmark runs to track performance over time and detect regressions.

4. **Use artifacts**: Upload benchmark results as artifacts to make them available for later analysis.

5. **Comment on PRs**: Comment on pull requests with benchmark results to make it easy for reviewers to see performance changes.

6. **Fail on regressions**: Consider failing the CI/CD pipeline if significant regressions are detected to prevent performance degradation.

7. **Run benchmarks on a schedule**: Consider running benchmarks on a schedule (e.g., nightly) to track performance over time, not just on PRs.

## Troubleshooting

- **Inconsistent results**: If you're seeing inconsistent benchmark results, try increasing the number of iterations and warmup iterations.

- **False positives**: If you're seeing false positive regressions, try increasing the regression threshold or the number of baseline runs.

- **GitHub Actions limitations**: GitHub Actions runners may have variable performance. Consider using self-hosted runners for more consistent results.

- **Large history files**: If your benchmark history files are getting too large, consider reducing the number of runs to keep or the size of the benchmark data.
