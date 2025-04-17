/**
 * CLI command for trend analysis
 *
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as path from 'path';
import { resolveReportPath } from '../../utils/paths';
import { Command } from 'commander';
import {
  loadBenchmarkHistory,
  detectRegressions,
  formatTrendAnalysisResult,
  generateAsciiChart,
  generateTrendHtml,
  recordBenchmarkRun
} from '../../analysis/trends';
import { BenchmarkResult, BenchmarkComparison, ScalabilityResult } from '../../types';

/**
 * Create the trend command
 *
 * @returns Command instance
 */
export function createTrendCommand(): Command {
  const command = new Command('trend')
    .description('Analyze benchmark trends over time')
    .argument('<name>', 'Name of the benchmark to analyze')
    .option('-d, --dir <directory>', 'Directory containing benchmark history', '.benchmark-history')
    .option('-o, --output <file>', 'Output file for trend analysis')
    .option('-f, --format <format>', 'Output format (text, html)', 'text')
    .option('-i, --implementation <name>', 'Filter by implementation name')
    .option('-t, --threshold <number>', 'Threshold for regression detection (0-1)', '0.1')
    .option('-b, --baseline <number>', 'Number of runs to use for baseline', '3')
    .option('-c, --chart', 'Include ASCII chart in text output', false)
    .action((name, options) => {
      try {
        // Load the benchmark history
        const historyDir = path.resolve(process.cwd(), options.dir);
        const history = loadBenchmarkHistory(historyDir, name);

        if (history.length === 0) {
          console.error(`No benchmark history found for ${name}`);
          process.exit(1);
        }

        // Detect regressions
        const trends = detectRegressions(history, {
          regressionThreshold: parseFloat(options.threshold),
          baselineRuns: parseInt(options.baseline, 10)
        });

        // Filter by implementation if specified
        const filteredTrends = options.implementation
          ? trends.filter(t => t.implementation === options.implementation)
          : trends;

        if (filteredTrends.length === 0) {
          console.error(`No trends found for implementation ${options.implementation}`);
          process.exit(1);
        }

        // Format the output
        let output: string;

        if (options.format === 'html') {
          output = generateTrendHtml(filteredTrends);
        } else {
          // Text format
          output = filteredTrends.map(trend => {
            let result = formatTrendAnalysisResult(trend);

            if (options.chart) {
              result += '\n' + generateAsciiChart(trend) + '\n';
            }

            return result;
          }).join('\n\n');
        }

        // Output the analysis
        if (options.output) {
          const outputPath = resolveReportPath(options.output);
          fs.writeFileSync(outputPath, output, 'utf-8');
          console.log(`Trend analysis saved to ${outputPath}`);
        } else {
          console.log(output);
        }
      } catch (error) {
        console.error(`Error analyzing benchmark trends: ${error}`);
        process.exit(1);
      }
    });

  // Add subcommand for recording benchmark results
  command
    .command('record')
    .description('Record benchmark results for trend analysis')
    .argument('<file>', 'JSON file containing benchmark results')
    .option('-d, --dir <directory>', 'Directory to store benchmark history', '.benchmark-history')
    .option('-m, --max-runs <number>', 'Maximum number of runs to keep', '100')
    .action((file, options) => {
      try {
        // Load the benchmark results
        const filePath = resolveReportPath(file);
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          process.exit(1);
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        // Record the benchmark run
        const name = recordBenchmarkRun(data, {
          historyDir: path.resolve(process.cwd(), options.dir),
          maxRuns: parseInt(options.maxRuns, 10)
        });

        console.log(`Benchmark results recorded as ${name}`);
      } catch (error) {
        console.error(`Error recording benchmark results: ${error}`);
        process.exit(1);
      }
    });

  return command;
}
