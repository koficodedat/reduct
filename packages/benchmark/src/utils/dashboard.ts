/**
 * Utilities for generating a performance dashboard
 */
import * as fs from 'fs';
import * as path from 'path';

import * as glob from 'glob';

import { RegressionBenchmarkResult } from './regression-detection';

/**
 * Dashboard options
 */
export interface DashboardOptions {
  /**
   * Directory containing benchmark results
   */
  resultsDir: string;

  /**
   * Output directory for dashboard
   */
  outputDir: string;

  /**
   * Number of historical results to include
   */
  historyLength?: number;

  /**
   * Title of the dashboard
   */
  title?: string;

  /**
   * Description of the dashboard
   */
  description?: string;
}

/**
 * Dashboard data
 */
export interface DashboardData {
  /**
   * Title of the dashboard
   */
  title: string;

  /**
   * Description of the dashboard
   */
  description: string;

  /**
   * Timestamp of the dashboard generation
   */
  timestamp: string;

  /**
   * Benchmarks grouped by operation
   */
  benchmarksByOperation: Map<string, {
    /**
     * Results grouped by input size
     */
    resultsBySize: Map<number, {
      /**
       * Results grouped by tier
       */
      resultsByTier: Map<string, {
        /**
         * Results over time
         */
        results: RegressionBenchmarkResult[];
      }>;
    }>;
  }>;
}

/**
 * Default dashboard options
 */
const DEFAULT_OPTIONS: Required<DashboardOptions> = {
  resultsDir: path.join(process.cwd(), 'packages/benchmark/reports'),
  outputDir: path.join(process.cwd(), 'packages/benchmark/dashboard'),
  historyLength: 10,
  title: 'Reduct Performance Dashboard',
  description: 'Performance dashboard for the Reduct library',
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
 * Generate dashboard data
 * @param options Dashboard options
 * @returns Dashboard data
 */
export function generateDashboardData(options: DashboardOptions): DashboardData {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Find all benchmark result files
  const files = glob.sync(path.join(opts.resultsDir, '*.md'));

  // Group files by benchmark name
  const filesByBenchmark = new Map<string, string[]>();

  for (const file of files) {
    // Skip regression reports
    if (path.basename(file).startsWith('regression-report')) {
      continue;
    }

    const _benchmarkName = path.basename(file, '.md').split('-').slice(0, -6).join('-');

    if (!filesByBenchmark.has(_benchmarkName)) {
      filesByBenchmark.set(_benchmarkName, []);
    }

    filesByBenchmark.get(_benchmarkName)!.push(file);
  }

  // Initialize dashboard data
  const dashboardData: DashboardData = {
    title: opts.title || DEFAULT_OPTIONS.title,
    description: opts.description || DEFAULT_OPTIONS.description,
    timestamp: new Date().toISOString(),
    benchmarksByOperation: new Map(),
  };

  // Process each benchmark
  for (const [_benchmarkName, benchmarkFiles] of filesByBenchmark.entries()) {
    // Sort files by timestamp (newest first)
    benchmarkFiles.sort((a, b) => {
      const timestampA = path.basename(a, '.md').split('-').slice(-6).join('-');
      const timestampB = path.basename(b, '.md').split('-').slice(-6).join('-');
      return timestampB.localeCompare(timestampA);
    });

    // Limit to history length
    const filesToProcess = benchmarkFiles.slice(0, opts.historyLength);

    // Parse benchmark results
    const allResults: RegressionBenchmarkResult[] = [];

    for (const file of filesToProcess) {
      allResults.push(...parseBenchmarkResults(file));
    }

    // Group results by operation
    for (const result of allResults) {
      if (!dashboardData.benchmarksByOperation.has(result.operation)) {
        dashboardData.benchmarksByOperation.set(result.operation, {
          resultsBySize: new Map(),
        });
      }

      const operationData = dashboardData.benchmarksByOperation.get(result.operation)!;

      if (!operationData.resultsBySize.has(result.inputSize)) {
        operationData.resultsBySize.set(result.inputSize, {
          resultsByTier: new Map(),
        });
      }

      const sizeData = operationData.resultsBySize.get(result.inputSize)!;

      if (!sizeData.resultsByTier.has(result.tier)) {
        sizeData.resultsByTier.set(result.tier, {
          results: [],
        });
      }

      const tierData = sizeData.resultsByTier.get(result.tier)!;
      tierData.results.push(result);

      // Sort results by timestamp (oldest first)
      tierData.results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
  }

  return dashboardData;
}

/**
 * Generate dashboard HTML
 * @param data Dashboard data
 * @returns Dashboard HTML
 */
export function generateDashboardHtml(data: DashboardData): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 {
      color: #0066cc;
    }
    .dashboard-header {
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
    }
    .dashboard-timestamp {
      color: #666;
      font-size: 0.9em;
    }
    .operation-section {
      margin-bottom: 40px;
    }
    .size-section {
      margin-bottom: 30px;
    }
    .chart-container {
      width: 100%;
      height: 400px;
      margin-bottom: 20px;
    }
    .tier-legend {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .tier-legend-item {
      display: flex;
      align-items: center;
      margin-right: 20px;
      margin-bottom: 10px;
    }
    .tier-legend-color {
      width: 20px;
      height: 20px;
      margin-right: 5px;
      border-radius: 3px;
    }
    .tier-high-value {
      background-color: #4285F4;
    }
    .tier-conditional {
      background-color: #EA4335;
    }
    .tier-js-preferred {
      background-color: #FBBC05;
    }
    .tier-native {
      background-color: #34A853;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
    }
    tr:hover {
      background-color: #f9f9f9;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="dashboard-header">
    <h1>${data.title}</h1>
    <p>${data.description}</p>
    <p class="dashboard-timestamp">Generated: ${data.timestamp}</p>
  </div>

  <div class="tier-legend">
    <div class="tier-legend-item">
      <div class="tier-legend-color tier-high-value"></div>
      <span>High Value</span>
    </div>
    <div class="tier-legend-item">
      <div class="tier-legend-color tier-conditional"></div>
      <span>Conditional</span>
    </div>
    <div class="tier-legend-item">
      <div class="tier-legend-color tier-js-preferred"></div>
      <span>JS Preferred</span>
    </div>
    <div class="tier-legend-item">
      <div class="tier-legend-color tier-native"></div>
      <span>Native</span>
    </div>
  </div>

  <div id="dashboard-content">`;

  // Add operation sections
  for (const [operation, operationData] of data.benchmarksByOperation.entries()) {
    html += `
    <div class="operation-section">
      <h2>${operation} Operation</h2>`;

    // Add size sections
    const sizes = Array.from(operationData.resultsBySize.keys()).sort((a, b) => a - b);

    for (const size of sizes) {
      const sizeData = operationData.resultsBySize.get(size)!;

      html += `
      <div class="size-section">
        <h3>Input Size: ${size}</h3>

        <div class="chart-container">
          <canvas id="chart-${operation}-${size}"></canvas>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Latest Mean (ms)</th>
              <th>Min (ms)</th>
              <th>Max (ms)</th>
              <th>Std Dev (ms)</th>
            </tr>
          </thead>
          <tbody>`;

      // Add tier rows
      for (const [tier, tierData] of sizeData.resultsByTier.entries()) {
        const latestResult = tierData.results[tierData.results.length - 1];

        html += `
            <tr>
              <td>${tier}</td>
              <td>${latestResult.meanTime.toFixed(3)}</td>
              <td>${latestResult.minTime.toFixed(3)}</td>
              <td>${latestResult.maxTime.toFixed(3)}</td>
              <td>${latestResult.stdDev.toFixed(3)}</td>
            </tr>`;
      }

      html += `
          </tbody>
        </table>
      </div>`;
    }

    html += `
    </div>`;
  }

  html += `
  </div>

  <script>
    // Initialize charts
    document.addEventListener('DOMContentLoaded', function() {`;

  // Add chart initialization
  for (const [operation, operationData] of data.benchmarksByOperation.entries()) {
    for (const [size, sizeData] of operationData.resultsBySize.entries()) {
      // Prepare chart data
      const labels: string[] = [];
      const datasets: any[] = [];

      // Find all timestamps
      const allTimestamps = new Set<string>();

      for (const [_tier, tierData] of sizeData.resultsByTier.entries()) {
        for (const result of tierData.results) {
          allTimestamps.add(result.timestamp);
        }
      }

      // Sort timestamps
      const sortedTimestamps = Array.from(allTimestamps).sort();

      // Format timestamps for labels
      for (const timestamp of sortedTimestamps) {
        // Format as YYYY-MM-DD HH:MM
        // Just use the timestamp directly since it's already in a good format
        const formattedDate = timestamp;
        labels.push(formattedDate);
      }

      // Add datasets for each tier
      for (const [tier, tierData] of sizeData.resultsByTier.entries()) {
        const data: number[] = [];
        const resultsByTimestamp = new Map<string, RegressionBenchmarkResult>();

        for (const result of tierData.results) {
          resultsByTimestamp.set(result.timestamp, result);
        }

        for (const timestamp of sortedTimestamps) {
          const result = resultsByTimestamp.get(timestamp);
          data.push(result ? result.meanTime : NaN);
        }

        let color = '#000000';

        switch (tier) {
          case 'high-value':
            color = '#4285F4';
            break;
          case 'conditional':
            color = '#EA4335';
            break;
          case 'js-preferred':
            color = '#FBBC05';
            break;
          case 'native':
            color = '#34A853';
            break;
        }

        datasets.push({
          label: tier,
          data,
          borderColor: color,
          backgroundColor: `${color}33`,
          tension: 0.1,
        });
      }

      html += `
      new Chart(document.getElementById('chart-${operation}-${size}'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(labels)},
          datasets: ${JSON.stringify(datasets)}
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '${operation} Operation - Input Size ${size}'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Timestamp'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Mean Time (ms)'
              },
              beginAtZero: true
            }
          }
        }
      });`;
    }
  }

  html += `
    });
  </script>
</body>
</html>`;

  return html;
}

/**
 * Generate dashboard
 * @param options Dashboard options
 */
export function generateDashboard(options: DashboardOptions): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create output directory if it doesn't exist
  if (!fs.existsSync(opts.outputDir)) {
    fs.mkdirSync(opts.outputDir, { recursive: true });
  }

  // Generate dashboard data
  const dashboardData = generateDashboardData(opts);

  // Generate dashboard HTML
  const dashboardHtml = generateDashboardHtml(dashboardData);

  // Save dashboard HTML
  const dashboardPath = path.join(opts.outputDir, 'index.html');
  fs.writeFileSync(dashboardPath, dashboardHtml);

  console.log(`Dashboard generated at: ${dashboardPath}`);
}
