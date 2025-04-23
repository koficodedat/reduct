/**
 * Benchmark result formatters
 *
 * @packageDocumentation
 */

import { BenchmarkResult, BenchmarkSuite, BenchmarkComparison, ScalabilityResult } from '../types';

import { formatBenchmarkResult, formatRelativeFactor, formatSectionHeader, formatSubsectionHeader, shouldUseColors } from './colors';

/**
 * Formats a benchmark suite as a string table
 *
 * @param suite - Benchmark suite to format
 * @returns Formatted string with results
 */
export function formatBenchmarkSuite(suite: BenchmarkSuite, useColors: boolean = shouldUseColors()): string {
  // Group benchmarks by implementation
  const implementationMap = new Map<string, BenchmarkResult[]>();

  for (const result of suite.benchmarks) {
    if (!implementationMap.has(result.name)) {
      implementationMap.set(result.name, []);
    }
    implementationMap.get(result.name)!.push(result);
  }

  let output = `${formatSectionHeader(suite.name, useColors)}\n\n`;

  if (suite.description) {
    output += `${suite.description}\n\n`;
  }

  // For each implementation, create a section
  for (const [implementation, results] of implementationMap.entries()) {
    output += `${formatSubsectionHeader(`### ${implementation} (size: ${results[0].inputSize})`, useColors)}\n\n`;
    output += `${formatBenchmarkResult('Operation     | Time (ms) | Ops/Sec   ', false, true, useColors)}\n`;
    output += '------------- | --------- | ----------\n';

    // Sort operations by time
    const sortedResults = [...results].sort((a, b) => a.timeMs - b.timeMs);

    for (const result of sortedResults) {
      const isFastest = result === sortedResults[0];
      const formattedOperation = formatBenchmarkResult(result.operation.padEnd(13), isFastest, false, useColors);
      const formattedTime = formatBenchmarkResult(result.timeMs.toFixed(4).padStart(9), isFastest, false, useColors);
      const formattedOps = formatBenchmarkResult(Math.floor(result.opsPerSecond).toString().padStart(10), isFastest, false, useColors);

      output += `${formattedOperation} | ${formattedTime} | ${formattedOps}\n`;
    }

    output += '\n';
  }

  return output;
}

/**
 * Formats a benchmark comparison as a string table
 *
 * @param comparison - Benchmark comparison to format
 * @returns Formatted string with results
 */
export function formatBenchmarkComparison(comparison: BenchmarkComparison, useColors: boolean = shouldUseColors()): string {
  let output = `${formatSectionHeader(comparison.name, useColors)}\n\n`;

  if (comparison.description) {
    output += `${comparison.description}\n\n`;
  }

  output += `Operation: ${comparison.operation}\n`;
  output += `Input size: ${comparison.inputSize.toLocaleString()}\n\n`;

  output += formatBenchmarkResult('Implementation  | Time (ms) | Ops/Sec   | vs. Fastest', false, true, useColors);
  if (comparison.results.some(r => r.memoryBytes !== undefined)) {
    output += ' | Memory (KB)';
  }
  output += '\n';

  output += '--------------- | --------- | --------- | -----------';
  if (comparison.results.some(r => r.memoryBytes !== undefined)) {
    output += ' | -----------';
  }
  output += '\n';

  // Sort implementations by time
  const sortedResults = [...comparison.results].sort((a, b) => a.timeMs - b.timeMs);

  for (const result of sortedResults) {
    const relativeText = formatRelativeFactor(result.relativeFactor, useColors);

    const isFastest = result.relativeFactor === 1;
    const formattedImpl = formatBenchmarkResult(result.implementation.padEnd(15), isFastest, false, useColors);
    const formattedTime = formatBenchmarkResult(result.timeMs.toFixed(4).padStart(9), isFastest, false, useColors);
    const formattedOps = formatBenchmarkResult(Math.floor(result.opsPerSecond).toString().padStart(9), isFastest, false, useColors);

    output += `${formattedImpl} | ${formattedTime} | ${formattedOps} | ${relativeText}`;

    if (result.memoryBytes !== undefined) {
      const memoryKB = (result.memoryBytes / 1024).toFixed(2);
      output += ` | ${memoryKB.padStart(11)}`;
    }

    output += '\n';
  }

  return output;
}

/**
 * Formats a scalability result as a string table
 *
 * @param result - Scalability result to format
 * @returns Formatted string with results
 */
export function formatScalabilityResult(result: ScalabilityResult, useColors: boolean = shouldUseColors()): string {
  let output = `${formatSectionHeader(`${result.implementation} Scalability (${result.operation})`, useColors)}\n\n`;

  output += formatBenchmarkResult('Input Size | Time (ms) | Ops/Sec   ', false, true, useColors);
  if (result.results.some(r => r.memoryBytes !== undefined)) {
    output += ' | Memory (KB)';
  }
  output += '\n';

  output += '---------- | --------- | ---------';
  if (result.results.some(r => r.memoryBytes !== undefined)) {
    output += ' | -----------';
  }
  output += '\n';

  // Sort by input size
  const sortedResults = [...result.results].sort((a, b) => a.inputSize - b.inputSize);

  for (const entry of sortedResults) {
    const formattedSize = formatBenchmarkResult(entry.inputSize.toString().padStart(10), false, false, useColors);
    const formattedTime = formatBenchmarkResult(entry.timeMs.toFixed(4).padStart(9), false, false, useColors);
    const formattedOps = formatBenchmarkResult(Math.floor(entry.opsPerSecond).toString().padStart(9), false, false, useColors);

    output += `${formattedSize} | ${formattedTime} | ${formattedOps}`;

    if (entry.memoryBytes !== undefined) {
      const memoryKB = (entry.memoryBytes / 1024).toFixed(2);
      output += ` | ${memoryKB.padStart(11)}`;
    }

    output += '\n';
  }

  return output;
}
