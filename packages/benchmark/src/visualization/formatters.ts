/**
 * Benchmark result formatters
 *
 * @packageDocumentation
 */

import { BenchmarkResult, BenchmarkSuite, BenchmarkComparison, ScalabilityResult } from '../types';

/**
 * Formats a benchmark suite as a string table
 *
 * @param suite - Benchmark suite to format
 * @returns Formatted string with results
 */
export function formatBenchmarkSuite(suite: BenchmarkSuite): string {
  // Group benchmarks by implementation
  const implementationMap = new Map<string, BenchmarkResult[]>();
  
  for (const result of suite.benchmarks) {
    if (!implementationMap.has(result.name)) {
      implementationMap.set(result.name, []);
    }
    implementationMap.get(result.name)!.push(result);
  }

  let output = `## ${suite.name}\n\n`;
  
  if (suite.description) {
    output += `${suite.description}\n\n`;
  }

  // For each implementation, create a section
  for (const [implementation, results] of implementationMap.entries()) {
    output += `### ${implementation} (size: ${results[0].inputSize})\n\n`;
    output += 'Operation     | Time (ms) | Ops/Sec   \n';
    output += '------------- | --------- | ----------\n';

    // Sort operations by time
    const sortedResults = [...results].sort((a, b) => a.timeMs - b.timeMs);

    for (const result of sortedResults) {
      output += `${result.operation.padEnd(13)} | ${result.timeMs.toFixed(4).padStart(9)} | ${Math.floor(
        result.opsPerSecond,
      )
        .toString()
        .padStart(10)}\n`;
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
export function formatBenchmarkComparison(comparison: BenchmarkComparison): string {
  let output = `## ${comparison.name}\n\n`;
  
  if (comparison.description) {
    output += `${comparison.description}\n\n`;
  }

  output += `Operation: ${comparison.operation}\n`;
  output += `Input size: ${comparison.inputSize.toLocaleString()}\n\n`;
  
  output += 'Implementation  | Time (ms) | Ops/Sec   | vs. Fastest';
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
    const relativeText =
      result.relativeFactor === 1 ? 'fastest' : `${result.relativeFactor.toFixed(2)}x slower`;

    output += `${result.implementation.padEnd(15)} | ${result.timeMs.toFixed(4).padStart(9)} | ${Math.floor(
      result.opsPerSecond,
    )
      .toString()
      .padStart(9)} | ${relativeText.padStart(11)}`;
    
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
export function formatScalabilityResult(result: ScalabilityResult): string {
  let output = `## ${result.implementation} Scalability (${result.operation})\n\n`;
  
  output += 'Input Size | Time (ms) | Ops/Sec   ';
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
    output += `${entry.inputSize.toString().padStart(10)} | ${entry.timeMs.toFixed(4).padStart(9)} | ${Math.floor(
      entry.opsPerSecond,
    )
      .toString()
      .padStart(9)}`;
    
    if (entry.memoryBytes !== undefined) {
      const memoryKB = (entry.memoryBytes / 1024).toFixed(2);
      output += ` | ${memoryKB.padStart(11)}`;
    }
    
    output += '\n';
  }

  return output;
}
