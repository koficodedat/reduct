/**
 * Chart generator for benchmark results
 */

import * as fs from 'fs';
import * as path from 'path';

import { InputSizeBenchmarkResult } from '../suites/wasm-optimization/input-size-benchmark';

/**
 * Options for the chart generator
 */
export interface ChartGeneratorOptions {
  /**
   * The input directory containing benchmark reports
   */
  inputDir?: string;

  /**
   * The output directory for generated charts
   */
  outputDir?: string;
}

/**
 * Chart generator for benchmark results
 */
export class ChartGenerator {
  /**
   * The input directory containing benchmark reports
   */
  private readonly inputDir: string;

  /**
   * The output directory for generated charts
   */
  private readonly outputDir: string;

  /**
   * Create a new chart generator
   *
   * @param options The chart generator options
   */
  constructor(options: ChartGeneratorOptions = {}) {
    this.inputDir = options.inputDir || path.join(process.cwd(), 'packages/benchmark/reports');
    this.outputDir = options.outputDir || path.join(process.cwd(), 'packages/benchmark/charts');
  }

  /**
   * Generate charts for all benchmark reports
   */
  public generateCharts(): void {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Get all benchmark report files
    const files = fs.readdirSync(this.inputDir)
      .filter(file => file.endsWith('-size-benchmark.md'));

    // Generate charts for each report
    for (const file of files) {
      this.generateChartForReport(file);
    }
  }

  /**
   * Generate a chart for a benchmark report
   *
   * @param reportFile The benchmark report file
   */
  private generateChartForReport(reportFile: string): void {
    // Read the report file
    const reportPath = path.join(this.inputDir, reportFile);
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    // Parse the report to extract benchmark results
    const results = this.parseReportResults(reportContent);

    // Generate HTML with charts
    const html = this.generateHtml(results, reportFile.replace('.md', ''));

    // Save the HTML file
    const outputPath = path.join(this.outputDir, reportFile.replace('.md', '.html'));
    fs.writeFileSync(outputPath, html);

    console.log(`Chart generated: ${outputPath}`);
  }

  /**
   * Parse benchmark results from a report
   *
   * @param reportContent The report content
   * @returns The parsed benchmark results
   */
  private parseReportResults(reportContent: string): InputSizeBenchmarkResult[] {
    const results: InputSizeBenchmarkResult[] = [];

    // Extract benchmark results from the report
    const sections = reportContent.split(/^## /m).slice(1);

    for (const section of sections) {
      // Skip summary and crossover points sections
      if (section.startsWith('Summary') || section.startsWith('Performance Crossover Points')) {
        continue;
      }

      // Parse the section header to get size category, data type, and input size
      const headerMatch = section.match(/^([a-z_]+) ([a-z_]+) \(size: (\d+)\)/i);
      if (!headerMatch) continue;

      const [, sizeCategory, dataTypeCategory, inputSizeStr] = headerMatch;
      const inputSize = parseInt(inputSizeStr, 10);

      // Extract results for each tier
      const tierSections = section.split(/^### /m).slice(1);

      for (const tierSection of tierSections) {
        // Skip speedup section
        if (tierSection.startsWith('Speedup')) {
          continue;
        }

        // Parse the tier
        const tier = tierSection.split('\n')[0].trim();

        // Extract execution time
        const executionTimeMatch = tierSection.match(/Execution time: ([\d.]+)ms/);
        if (!executionTimeMatch) continue;

        const executionTime = parseFloat(executionTimeMatch[1]);

        // Add the result
        results.push({
          name: `${sizeCategory}-${dataTypeCategory}-${inputSize}-${tier}`,
          executionTime,
          iterations: 0, // Not needed for visualization
          inputSize,
          sizeCategory: sizeCategory as any,
          dataTypeCategory: dataTypeCategory as any,
          tier: tier as any
        } as InputSizeBenchmarkResult);
      }
    }

    return results;
  }

  /**
   * Generate HTML with charts
   *
   * @param results The benchmark results
   * @param title The chart title
   * @returns The generated HTML
   */
  private generateHtml(results: InputSizeBenchmarkResult[], title: string): string {
    // Group results by data type
    const groupedByDataType = new Map<string, InputSizeBenchmarkResult[]>();

    for (const result of results) {
      const key = result.dataTypeCategory;
      if (!groupedByDataType.has(key)) {
        groupedByDataType.set(key, []);
      }
      groupedByDataType.get(key)!.push(result);
    }

    // Generate chart data for each data type
    const chartData: Record<string, any> = {};

    for (const [dataType, dataTypeResults] of groupedByDataType.entries()) {
      // Group by input size
      const groupedBySize = new Map<number, InputSizeBenchmarkResult[]>();

      for (const result of dataTypeResults) {
        if (!groupedBySize.has(result.inputSize)) {
          groupedBySize.set(result.inputSize, []);
        }
        groupedBySize.get(result.inputSize)!.push(result);
      }

      // Create data series for each tier
      const jsSeries: [number, number][] = [];
      const conditionalSeries: [number, number][] = [];
      const highValueSeries: [number, number][] = [];

      // Sort input sizes
      const sizes = Array.from(groupedBySize.keys()).sort((a, b) => a - b);

      for (const size of sizes) {
        const sizeResults = groupedBySize.get(size)!;

        const jsResult = sizeResults.find(r => r.tier === 'JS_PREFERRED');
        const conditionalResult = sizeResults.find(r => r.tier === 'CONDITIONAL');
        const highValueResult = sizeResults.find(r => r.tier === 'HIGH_VALUE');

        if (jsResult) {
          jsSeries.push([size, jsResult.executionTime]);
        }

        if (conditionalResult) {
          conditionalSeries.push([size, conditionalResult.executionTime]);
        }

        if (highValueResult) {
          highValueSeries.push([size, highValueResult.executionTime]);
        }
      }

      chartData[dataType] = {
        jsSeries,
        conditionalSeries,
        highValueSeries
      };
    }

    // Generate HTML
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${title} - Benchmark Charts</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .chart-container {
      width: 800px;
      height: 400px;
      margin-bottom: 40px;
    }
    h1 {
      color: #333;
    }
    h2 {
      color: #666;
    }
  </style>
</head>
<body>
  <h1>${title} - Benchmark Charts</h1>

  ${Object.entries(chartData).map(([dataType, _data]) => `
    <h2>${dataType} Data</h2>
    <div class="chart-container">
      <canvas id="chart-${dataType}"></canvas>
    </div>
    <div class="chart-container">
      <canvas id="chart-${dataType}-log"></canvas>
    </div>
  `).join('')}

  <script>
    // Chart data
    const chartData = ${JSON.stringify(chartData)};

    // Create charts
    document.addEventListener('DOMContentLoaded', function() {
      ${Object.keys(chartData).map(dataType => `
        // Linear scale chart for ${dataType}
        new Chart(document.getElementById('chart-${dataType}'), {
          type: 'line',
          data: {
            datasets: [
              {
                label: 'JavaScript',
                data: chartData['${dataType}'].jsSeries.map(point => ({ x: point[0], y: point[1] })),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1
              },
              {
                label: 'Conditional',
                data: chartData['${dataType}'].conditionalSeries.map(point => ({ x: point[0], y: point[1] })),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                tension: 0.1
              },
              {
                label: 'High Value',
                data: chartData['${dataType}'].highValueSeries.map(point => ({ x: point[0], y: point[1] })),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                type: 'linear',
                position: 'bottom',
                title: {
                  display: true,
                  text: 'Input Size'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Execution Time (ms)'
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: '${dataType} Data - Linear Scale'
              }
            }
          }
        });

        // Logarithmic scale chart for ${dataType}
        new Chart(document.getElementById('chart-${dataType}-log'), {
          type: 'line',
          data: {
            datasets: [
              {
                label: 'JavaScript',
                data: chartData['${dataType}'].jsSeries.map(point => ({ x: point[0], y: point[1] })),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1
              },
              {
                label: 'Conditional',
                data: chartData['${dataType}'].conditionalSeries.map(point => ({ x: point[0], y: point[1] })),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                tension: 0.1
              },
              {
                label: 'High Value',
                data: chartData['${dataType}'].highValueSeries.map(point => ({ x: point[0], y: point[1] })),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                type: 'logarithmic',
                position: 'bottom',
                title: {
                  display: true,
                  text: 'Input Size (log scale)'
                }
              },
              y: {
                type: 'logarithmic',
                title: {
                  display: true,
                  text: 'Execution Time (ms, log scale)'
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: '${dataType} Data - Logarithmic Scale'
              }
            }
          }
        });
      `).join('')}
    });
  </script>
</body>
</html>
`;
  }
}

/**
 * Generate charts for benchmark results
 *
 * @param options The chart generator options
 */
export function generateCharts(options: ChartGeneratorOptions = {}): void {
  const generator = new ChartGenerator(options);
  generator.generateCharts();
}

/**
 * Run the chart generator from the command line
 */
if (require.main === module) {
  generateCharts();
  console.log('Chart generation completed');
}
