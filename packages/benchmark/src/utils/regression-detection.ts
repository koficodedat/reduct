/**
 * Utilities for detecting performance regressions
 */
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

/**
 * Benchmark result for regression detection
 */
export interface RegressionBenchmarkResult {
  /**
   * Name of the benchmark
   */
  name: string;

  /**
   * Mean execution time in milliseconds
   */
  meanTime: number;

  /**
   * Standard deviation of execution time in milliseconds
   */
  stdDev: number;

  /**
   * Minimum execution time in milliseconds
   */
  minTime: number;

  /**
   * Maximum execution time in milliseconds
   */
  maxTime: number;

  /**
   * Number of iterations
   */
  iterations: number;

  /**
   * Input size
   */
  inputSize: number;

  /**
   * Tier or implementation
   */
  tier: string;

  /**
   * Operation
   */
  operation: string;

  /**
   * Timestamp
   */
  timestamp: string;
}

/**
 * Regression detection options
 */
export interface RegressionDetectionOptions {
  /**
   * Directory containing benchmark results
   */
  resultsDir: string;

  /**
   * Number of historical results to compare with
   */
  historyLength?: number;

  /**
   * Threshold for regression detection (percentage)
   */
  regressionThreshold?: number;

  /**
   * Threshold for improvement detection (percentage)
   */
  improvementThreshold?: number;

  /**
   * Whether to ignore small changes
   */
  ignoreSmallChanges?: boolean;

  /**
   * Threshold for small changes (milliseconds)
   */
  smallChangeThreshold?: number;
}

/**
 * Regression detection result
 */
export interface RegressionDetectionResult {
  /**
   * Regressions detected
   */
  regressions: Array<{
    /**
     * Benchmark name
     */
    name: string;

    /**
     * Current result
     */
    current: RegressionBenchmarkResult;

    /**
     * Previous result
     */
    previous: RegressionBenchmarkResult;

    /**
     * Percentage change
     */
    percentageChange: number;

    /**
     * Absolute change in milliseconds
     */
    absoluteChange: number;
  }>;

  /**
   * Improvements detected
   */
  improvements: Array<{
    /**
     * Benchmark name
     */
    name: string;

    /**
     * Current result
     */
    current: RegressionBenchmarkResult;

    /**
     * Previous result
     */
    previous: RegressionBenchmarkResult;

    /**
     * Percentage change
     */
    percentageChange: number;

    /**
     * Absolute change in milliseconds
     */
    absoluteChange: number;
  }>;

  /**
   * No significant changes
   */
  noChanges: Array<{
    /**
     * Benchmark name
     */
    name: string;

    /**
     * Current result
     */
    current: RegressionBenchmarkResult;

    /**
     * Previous result
     */
    previous: RegressionBenchmarkResult;

    /**
     * Percentage change
     */
    percentageChange: number;

    /**
     * Absolute change in milliseconds
     */
    absoluteChange: number;
  }>;

  /**
   * New benchmarks
   */
  newBenchmarks: RegressionBenchmarkResult[];

  /**
   * Missing benchmarks
   */
  missingBenchmarks: RegressionBenchmarkResult[];
}

/**
 * Default regression detection options
 */
const DEFAULT_OPTIONS: Required<RegressionDetectionOptions> = {
  resultsDir: path.join(process.cwd(), 'packages/benchmark/reports'),
  historyLength: 5,
  regressionThreshold: 10, // 10% slower
  improvementThreshold: 10, // 10% faster
  ignoreSmallChanges: true,
  smallChangeThreshold: 0.1, // 0.1ms
};

/**
 * Parse benchmark results from markdown files
 * @param filePath Path to markdown file
 * @returns Benchmark results
 */
function parseBenchmarkResults(filePath: string): RegressionBenchmarkResult[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results: RegressionBenchmarkResult[] = [];

  // Extract timestamp from filename
  const timestamp = path.basename(filePath, '.md').split('-').slice(-6).join('-');

  // Extract operation from filename (unused for now but might be useful later)
  // const operation = path.basename(filePath, '.md').split('-').slice(0, -6).join('-');

  // Parse table rows
  const tableRegex = /\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const name = match[1].trim();

    // Skip header row
    if (name === 'Name') {
      continue;
    }

    // Extract input size and tier from name
    const nameMatch = name.match(/([^-]+)-([^-]+)-(\d+)$/);

    if (!nameMatch) {
      continue;
    }

    const benchmarkName = nameMatch[1];
    const tier = nameMatch[2];
    const inputSize = parseInt(nameMatch[3], 10);

    results.push({
      name,
      meanTime: parseFloat(match[2]),
      stdDev: parseFloat(match[3]),
      minTime: parseFloat(match[4]),
      maxTime: parseFloat(match[5]),
      iterations: parseInt(match[6], 10),
      inputSize,
      tier,
      operation: benchmarkName,
      timestamp,
    });
  }

  return results;
}

/**
 * Detect performance regressions
 * @param options Regression detection options
 * @returns Regression detection result
 */
export function detectRegressions(options: RegressionDetectionOptions): RegressionDetectionResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Find all benchmark result files
  const files = glob.sync(path.join(opts.resultsDir, '*.md'));

  // Group files by benchmark name
  const filesByBenchmark = new Map<string, string[]>();

  for (const file of files) {
    const benchmarkName = path.basename(file, '.md').split('-').slice(0, -6).join('-');

    if (!filesByBenchmark.has(benchmarkName)) {
      filesByBenchmark.set(benchmarkName, []);
    }

    filesByBenchmark.get(benchmarkName)!.push(file);
  }

  // Process each benchmark
  const result: RegressionDetectionResult = {
    regressions: [],
    improvements: [],
    noChanges: [],
    newBenchmarks: [],
    missingBenchmarks: [],
  };

  for (const [_benchmarkName, benchmarkFiles] of filesByBenchmark.entries()) {
    // Sort files by timestamp (newest first)
    benchmarkFiles.sort((a, b) => {
      const timestampA = path.basename(a, '.md').split('-').slice(-6).join('-');
      const timestampB = path.basename(b, '.md').split('-').slice(-6).join('-');
      return timestampB.localeCompare(timestampA);
    });

    // Get current and historical results
    const currentFile = benchmarkFiles[0];
    const historicalFiles = benchmarkFiles.slice(1, opts.historyLength + 1);

    if (!currentFile) {
      continue;
    }

    const currentResults = parseBenchmarkResults(currentFile);

    if (historicalFiles.length === 0) {
      // No historical data, all benchmarks are new
      result.newBenchmarks.push(...currentResults);
      continue;
    }

    // Parse historical results
    const historicalResults: RegressionBenchmarkResult[] = [];

    for (const file of historicalFiles) {
      historicalResults.push(...parseBenchmarkResults(file));
    }

    // Group results by name
    const currentResultsByName = new Map<string, RegressionBenchmarkResult>();
    const historicalResultsByName = new Map<string, RegressionBenchmarkResult[]>();

    for (const benchmarkResult of currentResults) {
      currentResultsByName.set(benchmarkResult.name, benchmarkResult);
    }

    for (const benchmarkResult of historicalResults) {
      if (!historicalResultsByName.has(benchmarkResult.name)) {
        historicalResultsByName.set(benchmarkResult.name, []);
      }

      historicalResultsByName.get(benchmarkResult.name)!.push(benchmarkResult);
    }

    // Compare current results with historical results
    for (const [name, current] of currentResultsByName.entries()) {
      const historical = historicalResultsByName.get(name);

      if (!historical || historical.length === 0) {
        // No historical data for this benchmark
        result.newBenchmarks.push(current);
        continue;
      }

      // Get the most recent historical result
      const previous = historical[0];

      // Calculate percentage change
      const percentageChange = ((current.meanTime - previous.meanTime) / previous.meanTime) * 100;
      const absoluteChange = current.meanTime - previous.meanTime;

      // Check if the change is significant
      if (opts.ignoreSmallChanges && Math.abs(absoluteChange) < opts.smallChangeThreshold) {
        result.noChanges.push({
          name,
          current,
          previous,
          percentageChange,
          absoluteChange,
        });
        continue;
      }

      // Check if it's a regression
      if (percentageChange >= opts.regressionThreshold) {
        result.regressions.push({
          name,
          current,
          previous,
          percentageChange,
          absoluteChange,
        });
        continue;
      }

      // Check if it's an improvement
      if (percentageChange <= -opts.improvementThreshold) {
        result.improvements.push({
          name,
          current,
          previous,
          percentageChange,
          absoluteChange,
        });
        continue;
      }

      // No significant change
      result.noChanges.push({
        name,
        current,
        previous,
        percentageChange,
        absoluteChange,
      });
    }

    // Check for missing benchmarks
    for (const [name, historical] of historicalResultsByName.entries()) {
      if (!currentResultsByName.has(name)) {
        result.missingBenchmarks.push(historical[0]);
      }
    }
  }

  return result;
}

/**
 * Format regression detection result as markdown
 * @param result Regression detection result
 * @returns Markdown string
 */
export function formatRegressionResultMarkdown(result: RegressionDetectionResult): string {
  let markdown = '# Performance Regression Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;

  // Add summary
  markdown += '## Summary\n\n';
  markdown += `- Regressions: ${result.regressions.length}\n`;
  markdown += `- Improvements: ${result.improvements.length}\n`;
  markdown += `- No significant changes: ${result.noChanges.length}\n`;
  markdown += `- New benchmarks: ${result.newBenchmarks.length}\n`;
  markdown += `- Missing benchmarks: ${result.missingBenchmarks.length}\n\n`;

  // Add regressions
  if (result.regressions.length > 0) {
    markdown += '## Regressions\n\n';
    markdown += '| Benchmark | Operation | Tier | Input Size | Current (ms) | Previous (ms) | Change (%) | Change (ms) |\n';
    markdown += '| --------- | --------- | ---- | ---------- | ------------ | ------------- | ---------- | ----------- |\n';

    for (const regression of result.regressions) {
      markdown += `| ${regression.name} | ${regression.current.operation} | ${regression.current.tier} | ${regression.current.inputSize} | ${regression.current.meanTime.toFixed(3)} | ${regression.previous.meanTime.toFixed(3)} | ${regression.percentageChange.toFixed(2)}% | ${regression.absoluteChange.toFixed(3)} |\n`;
    }

    markdown += '\n';
  }

  // Add improvements
  if (result.improvements.length > 0) {
    markdown += '## Improvements\n\n';
    markdown += '| Benchmark | Operation | Tier | Input Size | Current (ms) | Previous (ms) | Change (%) | Change (ms) |\n';
    markdown += '| --------- | --------- | ---- | ---------- | ------------ | ------------- | ---------- | ----------- |\n';

    for (const improvement of result.improvements) {
      markdown += `| ${improvement.name} | ${improvement.current.operation} | ${improvement.current.tier} | ${improvement.current.inputSize} | ${improvement.current.meanTime.toFixed(3)} | ${improvement.previous.meanTime.toFixed(3)} | ${improvement.percentageChange.toFixed(2)}% | ${improvement.absoluteChange.toFixed(3)} |\n`;
    }

    markdown += '\n';
  }

  // Add new benchmarks
  if (result.newBenchmarks.length > 0) {
    markdown += '## New Benchmarks\n\n';
    markdown += '| Benchmark | Operation | Tier | Input Size | Mean (ms) | Std Dev (ms) | Min (ms) | Max (ms) |\n';
    markdown += '| --------- | --------- | ---- | ---------- | --------- | ------------ | -------- | -------- |\n';

    for (const benchmark of result.newBenchmarks) {
      markdown += `| ${benchmark.name} | ${benchmark.operation} | ${benchmark.tier} | ${benchmark.inputSize} | ${benchmark.meanTime.toFixed(3)} | ${benchmark.stdDev.toFixed(3)} | ${benchmark.minTime.toFixed(3)} | ${benchmark.maxTime.toFixed(3)} |\n`;
    }

    markdown += '\n';
  }

  // Add missing benchmarks
  if (result.missingBenchmarks.length > 0) {
    markdown += '## Missing Benchmarks\n\n';
    markdown += '| Benchmark | Operation | Tier | Input Size | Mean (ms) | Std Dev (ms) | Min (ms) | Max (ms) |\n';
    markdown += '| --------- | --------- | ---- | ---------- | --------- | ------------ | -------- | -------- |\n';

    for (const benchmark of result.missingBenchmarks) {
      markdown += `| ${benchmark.name} | ${benchmark.operation} | ${benchmark.tier} | ${benchmark.inputSize} | ${benchmark.meanTime.toFixed(3)} | ${benchmark.stdDev.toFixed(3)} | ${benchmark.minTime.toFixed(3)} | ${benchmark.maxTime.toFixed(3)} |\n`;
    }

    markdown += '\n';
  }

  return markdown;
}

/**
 * Save regression detection result to a file
 * @param result Regression detection result
 * @param filePath Path to save the result
 */
export function saveRegressionResult(result: RegressionDetectionResult, filePath: string): void {
  const markdown = formatRegressionResultMarkdown(result);
  fs.writeFileSync(filePath, markdown);
}

/**
 * Check if there are any regressions
 * @param result Regression detection result
 * @returns True if there are any regressions
 */
export function hasRegressions(result: RegressionDetectionResult): boolean {
  return result.regressions.length > 0;
}
