/**
 * Optimized List Comparison Benchmarks
 *
 * This script compares the performance of the original List implementation
 * with the optimized List implementation across different input sizes.
 *
 * The results are saved to the reports directory for analysis.
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const execPromise = util.promisify(exec);

// Configuration
const SIZES = [100, 1000, 10000, 100000];
const OUTPUT_DIR = path.join(__dirname, '../../reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const RESULT_DIR = path.join(OUTPUT_DIR, `optimized-list-comparison-${TIMESTAMP}`);

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(RESULT_DIR)) {
  fs.mkdirSync(RESULT_DIR, { recursive: true });
}

/**
 * Run a benchmark command and save the output to a file
 */
async function runBenchmark(command: string, outputFile: string): Promise<string> {
  console.log(`Running: ${command}`);
  try {
    // Increase the maxBuffer size to handle larger outputs
    const { stdout } = await execPromise(command, { maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer
    fs.writeFileSync(outputFile, stdout);
    return stdout;
  } catch (error) {
    console.error(`Error running benchmark: ${error}`);
    // Write error information to the output file
    fs.writeFileSync(outputFile, `# Benchmark Error

The benchmark command failed with the following error:

\`\`\`
${error}
\`\`\`

This might be due to buffer overflow with large datasets. This will be addressed in Phase Two enhancements.`);
    return '';
  }
}

/**
 * Run comparison benchmarks for a specific size
 */
async function runComparisonForSize(size: number): Promise<void> {
  console.log(`\n=== Running comparison for size: ${size} ===`);

  // Create directory for this size
  const sizeDir = path.join(RESULT_DIR, `size-${size}`);
  if (!fs.existsSync(sizeDir)) {
    fs.mkdirSync(sizeDir, { recursive: true });
  }

  // Compare original List with optimized List
  const listCompareOutput = await runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark compare reduct-list optimized-list -s ${size} --output md`,
    path.join(sizeDir, 'original-vs-optimized.md')
  );
  console.log(listCompareOutput);

  // Compare optimized List with native array
  const arrayCompareOutput = await runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark compare optimized-list native-array -s ${size} --output md`,
    path.join(sizeDir, 'optimized-vs-array.md')
  );
  console.log(arrayCompareOutput);
}

/**
 * Run scalability tests for both implementations
 */
async function runScalabilityTests(): Promise<void> {
  console.log('\n=== Running scalability tests ===');

  // Create directory for scalability tests
  const scalabilityDir = path.join(RESULT_DIR, 'scalability');
  if (!fs.existsSync(scalabilityDir)) {
    fs.mkdirSync(scalabilityDir, { recursive: true });
  }

  // List operations to test scalability
  const operations = ['get', 'append', 'prepend', 'map', 'filter', 'reduce'];

  // Run scalability tests for original List
  for (const operation of operations) {
    console.log(`Running scalability test for original List.${operation}...`);
    await runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark scalability reduct-list ${operation} -m 100000 -s 5 --output md`,
      path.join(scalabilityDir, `original-list-${operation}-scalability.md`)
    );
  }

  // Run scalability tests for optimized List
  for (const operation of operations) {
    console.log(`Running scalability test for optimized List.${operation}...`);
    await runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark scalability optimized-list ${operation} -m 100000 -s 5 --output md`,
      path.join(scalabilityDir, `optimized-list-${operation}-scalability.md`)
    );
  }
}

/**
 * Run all comparison benchmarks
 */
async function runAllComparisons(): Promise<void> {
  console.log('Running optimized List comparison benchmarks...');

  // Create summary file
  const summaryPath = path.join(RESULT_DIR, 'summary.md');
  fs.writeFileSync(summaryPath, `# Optimized List Comparison Benchmarks

Run on: ${new Date().toISOString()}

This benchmark compares the performance of the original List implementation with the optimized List implementation using PersistentVector.

`);

  // Run comparisons for each size
  for (const size of SIZES) {
    await runComparisonForSize(size);

    // Update summary
    fs.appendFileSync(summaryPath, `## Size: ${size}

`);
    fs.appendFileSync(summaryPath, `- [Original vs Optimized](size-${size}/original-vs-optimized.md)\n`);
    fs.appendFileSync(summaryPath, `- [Optimized vs Native Array](size-${size}/optimized-vs-array.md)\n\n`);
  }

  // Run scalability tests
  await runScalabilityTests();

  // Update summary with scalability tests
  fs.appendFileSync(summaryPath, `## Scalability Tests

`);
  fs.appendFileSync(summaryPath, `### Original List Scalability

`);
  for (const operation of ['get', 'append', 'prepend', 'map', 'filter', 'reduce']) {
    fs.appendFileSync(summaryPath, `- [${operation}](scalability/original-list-${operation}-scalability.md)\n`);
  }
  fs.appendFileSync(summaryPath, `\n`);

  fs.appendFileSync(summaryPath, `### Optimized List Scalability

`);
  for (const operation of ['get', 'append', 'prepend', 'map', 'filter', 'reduce']) {
    fs.appendFileSync(summaryPath, `- [${operation}](scalability/optimized-list-${operation}-scalability.md)\n`);
  }

  console.log(`\nComparison benchmarks completed. Results saved to ${RESULT_DIR}`);
  console.log(`Summary: ${summaryPath}`);
}

// Run the benchmarks
runAllComparisons().catch(error => {
  console.error('Error running benchmarks:', error);
  process.exit(1);
});
