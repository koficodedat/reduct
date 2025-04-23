/**
 * CLI command for analyzing benchmark results
 *
 * @packageDocumentation
 */

import * as fs from 'fs';
// path is used indirectly via resolveReportPath
import * as _path from 'path';

import { Command } from 'commander';

import {
  // calculateStatistics is used indirectly by the analysis functions
  analyzeBenchmarkResults,
  analyzeBenchmarkComparison,
  analyzeScalabilityResult,
  formatStatisticalAnalysis
} from '../../analysis/statistics';
import { BenchmarkResult, BenchmarkComparison, ScalabilityResult } from '../../types';
import { resolveReportPath } from '../../utils/paths';

/**
 * Create the analyze command
 *
 * @returns Command instance
 */
export function createAnalyzeCommand(): Command {
  const command = new Command('analyze')
    .description('Analyze benchmark results statistically')
    .argument('<file>', 'JSON file containing benchmark results')
    .option('-o, --output <file>', 'Output file for analysis results')
    .option('-p, --precision <number>', 'Number of decimal places for output', '4')
    .option('-m, --method <method>', 'Method for outlier detection (iqr, zscore)', 'iqr')
    .option('-t, --threshold <number>', 'Threshold for outlier detection', '1.5')
    .option('-c, --confidence <number>', 'Confidence level for intervals (0-1)', '0.95')
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

        // Determine the type of data
        let analysis: Record<string, any>;

        if (Array.isArray(data) && data.length > 0 && 'name' in data[0] && 'operation' in data[0]) {
          // BenchmarkResult[]
          analysis = analyzeBenchmarkResults(data as BenchmarkResult[], {
            outlierDetectionMethod: options.method as 'iqr' | 'zscore',
            outlierThreshold: parseFloat(options.threshold),
            confidenceLevel: parseFloat(options.confidence)
          });
        } else if (!Array.isArray(data) && 'results' in data && Array.isArray(data.results)) {
          if ('implementation' in data) {
            // ScalabilityResult
            analysis = analyzeScalabilityResult(data as ScalabilityResult, {
              outlierDetectionMethod: options.method as 'iqr' | 'zscore',
              outlierThreshold: parseFloat(options.threshold),
              confidenceLevel: parseFloat(options.confidence)
            });
          } else {
            // BenchmarkComparison
            analysis = analyzeBenchmarkComparison(data as BenchmarkComparison, {
              outlierDetectionMethod: options.method as 'iqr' | 'zscore',
              outlierThreshold: parseFloat(options.threshold),
              confidenceLevel: parseFloat(options.confidence)
            });
          }
        } else {
          console.error('Invalid benchmark results format');
          process.exit(1);
        }

        // Format the analysis
        const formatted = formatStatisticalAnalysis(analysis, parseInt(options.precision, 10));

        // Output the analysis
        if (options.output) {
          const outputPath = resolveReportPath(options.output);
          fs.writeFileSync(outputPath, formatted, 'utf-8');
          console.log(`Analysis saved to ${outputPath}`);
        } else {
          console.log(formatted);
        }
      } catch (error) {
        console.error(`Error analyzing benchmark results: ${error}`);
        process.exit(1);
      }
    });

  return command;
}
