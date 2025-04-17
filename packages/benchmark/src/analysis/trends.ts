/**
 * Trend analysis utilities for benchmark results
 *
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult, BenchmarkComparison, ScalabilityResult } from '../types';
import { calculateMean, calculateStatistics, StatisticalMetrics } from './statistics';

/**
 * Benchmark run with timestamp
 */
export interface BenchmarkRun {
  /** Timestamp of the run */
  timestamp: string;
  /** Results of the run */
  results: BenchmarkResult[] | BenchmarkComparison | BenchmarkComparison[] | ScalabilityResult;
  /** Type of the results */
  type: 'results' | 'comparison' | 'scalability';
  /** Metadata for the run */
  metadata?: Record<string, any>;
}

/**
 * Trend analysis options
 */
export interface TrendAnalysisOptions {
  /** Directory to store benchmark history (default: '.benchmark-history') */
  historyDir?: string;
  /** Maximum number of runs to keep (default: 100) */
  maxRuns?: number;
  /** Threshold for regression detection (default: 0.1 = 10%) */
  regressionThreshold?: number;
  /** Number of runs to use for baseline (default: 3) */
  baselineRuns?: number;
}

/**
 * Default options for trend analysis
 */
const defaultOptions: Required<TrendAnalysisOptions> = {
  historyDir: '.benchmark-history',
  maxRuns: 100,
  regressionThreshold: 0.1,
  baselineRuns: 3
};

/**
 * Trend analysis result
 */
export interface TrendAnalysisResult {
  /** Name of the benchmark */
  name: string;
  /** Operation being benchmarked */
  operation: string;
  /** Implementation being benchmarked */
  implementation: string;
  /** Trend data points */
  data: {
    /** Timestamp of the run */
    timestamp: string;
    /** Time in milliseconds */
    timeMs: number;
    /** Operations per second */
    opsPerSecond: number;
  }[];
  /** Statistical metrics for the trend */
  statistics: StatisticalMetrics;
  /** Regression analysis */
  regression?: {
    /** Whether a regression was detected */
    detected: boolean;
    /** Percentage change from baseline */
    percentChange: number;
    /** Absolute change from baseline */
    absoluteChange: number;
    /** Baseline value */
    baseline: number;
    /** Current value */
    current: number;
  };
}

/**
 * Ensure the history directory exists
 *
 * @param historyDir - Directory to store benchmark history
 */
function ensureHistoryDir(historyDir: string): void {
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
}

/**
 * Get the path to the history file for a benchmark
 *
 * @param historyDir - Directory to store benchmark history
 * @param name - Name of the benchmark
 * @returns Path to the history file
 */
function getHistoryFilePath(historyDir: string, name: string): string {
  return path.join(historyDir, `${name}.json`);
}

/**
 * Load benchmark history from file
 *
 * @param historyDir - Directory to store benchmark history
 * @param name - Name of the benchmark
 * @returns Array of benchmark runs
 */
export function loadBenchmarkHistory(historyDir: string, name: string): BenchmarkRun[] {
  const filePath = getHistoryFilePath(historyDir, name);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading benchmark history: ${error}`);
    return [];
  }
}

/**
 * Save benchmark history to file
 *
 * @param historyDir - Directory to store benchmark history
 * @param name - Name of the benchmark
 * @param runs - Array of benchmark runs
 */
export function saveBenchmarkHistory(historyDir: string, name: string, runs: BenchmarkRun[]): void {
  ensureHistoryDir(historyDir);
  const filePath = getHistoryFilePath(historyDir, name);

  try {
    fs.writeFileSync(filePath, JSON.stringify(runs, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error saving benchmark history: ${error}`);
  }
}

/**
 * Add a benchmark run to history
 *
 * @param results - Benchmark results
 * @param options - Trend analysis options
 * @returns Name of the benchmark
 */
export function recordBenchmarkRun(
  results: BenchmarkResult[] | BenchmarkComparison | BenchmarkComparison[] | ScalabilityResult,
  options?: TrendAnalysisOptions
): string {
  const opts = { ...defaultOptions, ...options };

  // Determine the type of results and generate a name
  let type: 'results' | 'comparison' | 'scalability';
  let name: string;

  if (Array.isArray(results) && results.length > 0 && 'name' in results[0] && 'operation' in results[0]) {
    // BenchmarkResult[]
    type = 'results';
    name = `benchmark-${results[0].name}-${results[0].operation}`;
  } else if (!Array.isArray(results) && 'results' in results && Array.isArray(results.results) && results.results.length > 0) {
    if ('implementation' in results) {
      // ScalabilityResult
      type = 'scalability';
      name = `scalability-${results.implementation}-${results.operation}`;
    } else {
      // BenchmarkComparison
      type = 'comparison';
      name = `comparison-${(results as BenchmarkComparison).operation}`;
    }
  } else if (Array.isArray(results) && results.length > 0 && 'operation' in results[0] && 'results' in results[0]) {
    // BenchmarkComparison[]
    type = 'comparison';
    name = `comparison-${results[0].operation}`;
  } else {
    throw new Error('Invalid benchmark results format');
  }

  // Create a new run
  const run: BenchmarkRun = {
    timestamp: new Date().toISOString(),
    results,
    type,
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  // Load existing history
  const history = loadBenchmarkHistory(opts.historyDir, name);

  // Add the new run
  history.push(run);

  // Limit the number of runs
  if (history.length > opts.maxRuns) {
    history.splice(0, history.length - opts.maxRuns);
  }

  // Save the updated history
  saveBenchmarkHistory(opts.historyDir, name, history);

  return name;
}

/**
 * Extract trend data from benchmark history
 *
 * @param history - Array of benchmark runs
 * @param implementation - Implementation to extract data for (optional)
 * @returns Array of trend analysis results
 */
export function extractTrendData(
  history: BenchmarkRun[],
  implementation?: string
): TrendAnalysisResult[] {
  if (history.length === 0) {
    return [];
  }

  const trends: TrendAnalysisResult[] = [];

  // Process based on the type of the first run
  const firstRun = history[0];

  if (firstRun.type === 'results') {
    // Group by name and operation
    const groupedData: Record<string, Record<string, any[]>> = {};

    for (const run of history) {
      if (run.type !== 'results') continue;
      const results = run.results as BenchmarkResult[];

      for (const result of results) {
        const key = `${result.name}-${result.operation}`;

        if (!groupedData[key]) {
          groupedData[key] = {};
        }

        if (!groupedData[key][result.name]) {
          groupedData[key][result.name] = [];
        }

        groupedData[key][result.name].push({
          timestamp: run.timestamp,
          timeMs: result.timeMs,
          opsPerSecond: result.opsPerSecond
        });
      }
    }

    // Create trend results
    for (const [key, implData] of Object.entries(groupedData)) {
      for (const [impl, data] of Object.entries(implData)) {
        if (implementation && impl !== implementation) continue;

        const [name, operation] = key.split('-');

        const timesMs = data.map(d => d.timeMs);
        const statistics = calculateStatistics(timesMs);

        trends.push({
          name,
          operation,
          implementation: impl,
          data,
          statistics
        });
      }
    }
  } else if (firstRun.type === 'comparison') {
    // Group by operation and implementation
    const groupedData: Record<string, Record<string, any[]>> = {};

    for (const run of history) {
      if (run.type !== 'comparison') continue;
      const comparison = run.results as BenchmarkComparison | BenchmarkComparison[];
      const operation = Array.isArray(comparison) ? comparison[0].operation : comparison.operation;

      if (!groupedData[operation]) {
        groupedData[operation] = {};
      }

      const results = Array.isArray(comparison) ? comparison[0].results : comparison.results;
      for (const result of results) {
        const impl = result.implementation;

        if (implementation && impl !== implementation) continue;

        if (!groupedData[operation][impl]) {
          groupedData[operation][impl] = [];
        }

        groupedData[operation][impl].push({
          timestamp: run.timestamp,
          timeMs: result.timeMs,
          opsPerSecond: result.opsPerSecond
        });
      }
    }

    // Create trend results
    for (const [operation, implData] of Object.entries(groupedData)) {
      for (const [impl, data] of Object.entries(implData)) {
        const timesMs = data.map(d => d.timeMs);
        const statistics = calculateStatistics(timesMs);

        trends.push({
          name: 'comparison',
          operation,
          implementation: impl,
          data,
          statistics
        });
      }
    }
  } else if (firstRun.type === 'scalability') {
    // Group by input size
    const groupedData: Record<number, any[]> = {};

    for (const run of history) {
      if (run.type !== 'scalability') continue;
      const scalability = run.results as ScalabilityResult;

      if (implementation && scalability.implementation !== implementation) continue;

      for (const result of scalability.results) {
        const size = result.inputSize;

        if (!groupedData[size]) {
          groupedData[size] = [];
        }

        groupedData[size].push({
          timestamp: run.timestamp,
          timeMs: result.timeMs,
          opsPerSecond: result.opsPerSecond
        });
      }
    }

    // Create trend results
    const scalability = history[0].results as ScalabilityResult;

    for (const [sizeStr, data] of Object.entries(groupedData)) {
      const size = parseInt(sizeStr, 10);
      const timesMs = data.map(d => d.timeMs);
      const statistics = calculateStatistics(timesMs);

      trends.push({
        name: `scalability-${size}`,
        operation: scalability.operation,
        implementation: scalability.implementation,
        data,
        statistics
      });
    }
  }

  return trends;
}

/**
 * Detect performance regressions in benchmark history
 *
 * @param history - Array of benchmark runs
 * @param options - Trend analysis options
 * @returns Array of trend analysis results with regression information
 */
export function detectRegressions(
  history: BenchmarkRun[],
  options?: TrendAnalysisOptions
): TrendAnalysisResult[] {
  const opts = { ...defaultOptions, ...options };

  if (history.length < opts.baselineRuns + 1) {
    // Not enough data to detect regressions
    return extractTrendData(history);
  }

  const trends = extractTrendData(history);

  for (const trend of trends) {
    // Sort data by timestamp
    trend.data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Get baseline (average of the first N runs)
    const baselineData = trend.data.slice(0, opts.baselineRuns);
    const baselineTimes = baselineData.map(d => d.timeMs);
    const baseline = calculateMean(baselineTimes);

    // Get current value (most recent run)
    const current = trend.data[trend.data.length - 1].timeMs;

    // Calculate change
    const absoluteChange = current - baseline;
    const percentChange = (absoluteChange / baseline) * 100;

    // Detect regression (higher time = worse performance)
    const detected = percentChange > opts.regressionThreshold * 100;

    trend.regression = {
      detected,
      percentChange,
      absoluteChange,
      baseline,
      current
    };
  }

  return trends;
}

/**
 * Format trend analysis result as a string
 *
 * @param trend - Trend analysis result
 * @param precision - Number of decimal places (default: 4)
 * @returns Formatted string
 */
export function formatTrendAnalysisResult(
  trend: TrendAnalysisResult,
  precision: number = 4
): string {
  const format = (num: number) => num.toFixed(precision);

  let output = `${trend.implementation} - ${trend.operation}:\n`;

  // Add statistics
  output += `  Mean: ${format(trend.statistics.mean)} ms\n`;
  output += `  Median: ${format(trend.statistics.median)} ms\n`;
  output += `  Std Dev: ${format(trend.statistics.stdDev)} ms\n`;
  output += `  Min: ${format(trend.statistics.min)} ms\n`;
  output += `  Max: ${format(trend.statistics.max)} ms\n`;

  // Add regression information if available
  if (trend.regression) {
    const reg = trend.regression;
    output += '\n  Regression Analysis:\n';
    output += `    Baseline: ${format(reg.baseline)} ms\n`;
    output += `    Current: ${format(reg.current)} ms\n`;
    output += `    Change: ${format(reg.absoluteChange)} ms (${format(reg.percentChange)}%)\n`;

    if (reg.detected) {
      output += '    REGRESSION DETECTED!\n';
    } else {
      output += '    No regression detected.\n';
    }
  }

  return output;
}

/**
 * Generate a simple ASCII chart for trend data
 *
 * @param trend - Trend analysis result
 * @param width - Width of the chart (default: 60)
 * @param height - Height of the chart (default: 10)
 * @returns ASCII chart
 */
export function generateAsciiChart(
  trend: TrendAnalysisResult,
  width: number = 60,
  height: number = 10
): string {
  if (trend.data.length < 2) {
    return 'Not enough data points for chart.';
  }

  // Extract time values
  const values = trend.data.map(d => d.timeMs);

  // Find min and max
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // Avoid division by zero

  // Create the chart
  const chart: string[] = [];

  // Add title
  chart.push(`${trend.implementation} - ${trend.operation} (Time in ms)`);
  chart.push(`Min: ${min.toFixed(4)}, Max: ${max.toFixed(4)}`);
  chart.push('');

  // Create y-axis labels
  const yLabels: string[] = [];
  for (let i = 0; i <= height; i++) {
    const value = max - (i / height) * range;
    yLabels.push(value.toFixed(4).padStart(10));
  }

  // Create the chart body
  for (let y = 0; y <= height; y++) {
    let line = yLabels[y] + ' |';

    for (let x = 0; x < width; x++) {
      const dataIndex = Math.floor((x / width) * (values.length - 1));
      const value = values[dataIndex];
      const normalizedValue = (value - min) / range;
      const yPos = height - Math.floor(normalizedValue * height);

      if (y === yPos) {
        line += '*';
      } else if (y === height) {
        line += '-'; // x-axis
      } else {
        line += ' ';
      }
    }

    chart.push(line);
  }

  // Add x-axis labels
  let xLabels = '           |';
  for (let x = 0; x < width; x += width / 4) {
    const dataIndex = Math.floor((x / width) * (trend.data.length - 1));
    const date = new Date(trend.data[dataIndex].timestamp);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    xLabels += label.padEnd(width / 4);
  }
  chart.push(xLabels);

  return chart.join('\n');
}

/**
 * Generate HTML chart data for trend visualization
 *
 * @param trend - Trend analysis result
 * @returns HTML chart data
 */
export function generateHtmlChartData(trend: TrendAnalysisResult): string {
  const labels = trend.data.map(d => {
    const date = new Date(d.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  });

  const timeData = trend.data.map(d => d.timeMs);
  const opsData = trend.data.map(d => d.opsPerSecond);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Time (ms)',
        data: timeData,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Ops/Sec',
        data: opsData,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  return JSON.stringify(chartData);
}

/**
 * Generate HTML for trend visualization
 *
 * @param trends - Array of trend analysis results
 * @returns HTML string
 */
export function generateTrendHtml(trends: TrendAnalysisResult[]): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Benchmark Trends</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .chart-container { width: 800px; height: 400px; margin-bottom: 30px; }
    .regression { color: red; font-weight: bold; }
    .no-regression { color: green; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Benchmark Trends</h1>
  <p>Generated: ${new Date().toISOString()}</p>
`;

  for (const trend of trends) {
    const chartId = `chart-${trend.implementation}-${trend.operation}`.replace(/[^a-zA-Z0-9]/g, '-');
    const chartData = generateHtmlChartData(trend);

    html += `
  <h2>${trend.implementation} - ${trend.operation}</h2>

  <div class="chart-container">
    <canvas id="${chartId}"></canvas>
  </div>

  <h3>Statistics</h3>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Mean</td>
      <td>${trend.statistics.mean.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>Median</td>
      <td>${trend.statistics.median.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>Std Dev</td>
      <td>${trend.statistics.stdDev.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>Min</td>
      <td>${trend.statistics.min.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>Max</td>
      <td>${trend.statistics.max.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>95% CI</td>
      <td>[${trend.statistics.ciLower.toFixed(4)}, ${trend.statistics.ciUpper.toFixed(4)}] ms</td>
    </tr>
  </table>
`;

    if (trend.regression) {
      const reg = trend.regression;
      const regClass = reg.detected ? 'regression' : 'no-regression';

      html += `
  <h3>Regression Analysis</h3>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Baseline</td>
      <td>${reg.baseline.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>Current</td>
      <td>${reg.current.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>Absolute Change</td>
      <td>${reg.absoluteChange.toFixed(4)} ms</td>
    </tr>
    <tr>
      <td>Percent Change</td>
      <td>${reg.percentChange.toFixed(2)}%</td>
    </tr>
    <tr>
      <td>Status</td>
      <td class="${regClass}">${reg.detected ? 'REGRESSION DETECTED!' : 'No regression detected'}</td>
    </tr>
  </table>
`;
    }

    html += `
  <script>
    const ctx${chartId.replace(/-/g, '')} = document.getElementById('${chartId}');
    new Chart(ctx${chartId.replace(/-/g, '')}, {
      type: 'line',
      data: ${chartData},
      options: {
        responsive: true,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Time (ms)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Ops/Sec'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  </script>
  <hr>
`;
  }

  html += `
</body>
</html>
`;

  return html;
}
