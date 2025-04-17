/**
 * Complex Comparison
 *
 * Provides functionality for running complex comparisons between
 * different implementations.
 *
 * @packageDocumentation
 */

import { ComplexComparisonConfig } from '../registry/types';
import { BenchmarkResult, BenchmarkComparison } from '../types';
import { benchmark } from '../utils';

/**
 * Result of a complex comparison
 */
export interface ComplexComparisonResult {
  /** Name of the comparison */
  name: string;
  /** Description of the comparison */
  description?: string;
  /** Test cases that were run */
  testCases: string[];
  /** Input sizes that were tested */
  inputSizes: number[];
  /** Results for each operation */
  results: Record<string, BenchmarkComparison[]>;
}

/**
 * Runs a complex comparison
 *
 * @param config - Comparison configuration
 * @returns Comparison results
 */
export function runComplexComparison(
  config: ComplexComparisonConfig
): ComplexComparisonResult {
  const { name, description, implementations, testCases, inputSizes, options } = config;

  // Initialize results
  const results: Record<string, BenchmarkComparison[]> = {};

  // Get all operations
  const operations = new Set<string>();
  for (const impl of implementations) {
    for (const opName of Object.keys(impl.operations)) {
      operations.add(opName);
    }
  }

  // Run benchmarks for each operation
  for (const opName of operations) {
    results[opName] = [];

    // Run benchmarks for each test case
    for (const testCase of testCases) {
      // Run benchmarks for each input size
      for (const size of inputSizes) {
        // Generate test data
        const testData = testCase.generator(size);

        // Run benchmarks for each implementation
        const benchmarkResults: Record<string, BenchmarkResult> = {};

        for (const impl of implementations) {
          // Skip if implementation doesn't support this operation
          if (!impl.operations[opName]) {
            continue;
          }

          // Create instance
          const instance = impl.factory(size, testData);

          // Get operation adapter
          const opAdapter = impl.operations[opName];

          // Run benchmark
          benchmarkResults[impl.id] = benchmark(
            () => opAdapter.adapter(instance, testData),
            impl.name,
            opName,
            size,
            options
          );
        }

        // Create comparison
        const comparison: BenchmarkComparison = createComparisonFromResults(
          benchmarkResults,
          opName,
          size,
          testCase.name
        );

        results[opName].push(comparison);
      }
    }
  }

  return {
    name,
    description,
    testCases: testCases.map(tc => tc.name),
    inputSizes,
    results
  };
}

/**
 * Creates a benchmark comparison from benchmark results
 *
 * @param results - Benchmark results
 * @param operation - Operation name
 * @param inputSize - Input size
 * @param testCase - Test case name
 * @returns Benchmark comparison
 */
function createComparisonFromResults(
  results: Record<string, BenchmarkResult>,
  operation: string,
  inputSize: number,
  testCase: string
): BenchmarkComparison {
  // Convert results to array
  const resultArray = Object.values(results);

  // Find fastest implementation
  const fastestTime = Math.min(...resultArray.map(r => r.timeMs));

  // Create comparison results
  const comparisonResults = resultArray.map(result => ({
    implementation: result.name,
    timeMs: result.timeMs,
    opsPerSecond: result.opsPerSecond,
    relativeFactor: result.timeMs / fastestTime,
    memoryBytes: result.memoryBytes
  }));

  // Sort by time (fastest first)
  comparisonResults.sort((a, b) => a.timeMs - b.timeMs);

  return {
    name: `${operation} - ${testCase}`,
    description: `Comparing ${operation} across different implementations (${testCase})`,
    operation,
    inputSize,
    results: comparisonResults
  };
}

/**
 * Formats a complex comparison result as a string
 *
 * @param result - Complex comparison result
 * @returns Formatted string
 */
export function formatComplexComparisonResult(result: ComplexComparisonResult): string {
  let output = `# ${result.name}\n\n`;

  if (result.description) {
    output += `${result.description}\n\n`;
  }

  output += `## Test Cases\n\n`;
  for (const testCase of result.testCases) {
    output += `- ${testCase}\n`;
  }

  output += `\n## Input Sizes\n\n`;
  for (const size of result.inputSizes) {
    output += `- ${size.toLocaleString()}\n`;
  }

  output += `\n## Results\n\n`;

  for (const [opName, comparisons] of Object.entries(result.results)) {
    output += `### ${opName} Operation\n\n`;

    for (const comparison of comparisons) {
      output += `#### ${comparison.name} (Size: ${comparison.inputSize.toLocaleString()})\n\n`;

      output += `| Implementation | Time (ms) | Ops/Sec | vs. Fastest |\n`;
      output += `| -------------- | --------- | ------- | ----------- |\n`;

      for (const result of comparison.results) {
        const relativeStr = result.relativeFactor === 1
          ? 'fastest'
          : `${result.relativeFactor.toFixed(2)}x slower`;

        output += `| ${result.implementation} | ${result.timeMs.toFixed(4)} | ${Math.floor(result.opsPerSecond).toLocaleString()} | ${relativeStr} |\n`;
      }

      output += `\n`;
    }
  }

  return output;
}
