/**
 * Phase Two Baseline Benchmarks
 *
 * This script establishes baseline performance metrics for the current
 * implementations of Immutable List and Functional Map across different input sizes.
 * It also compares them with native JavaScript implementations.
 *
 * The results are saved to the benchmark-results directory for future reference
 * and comparison with optimized implementations.
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
const RESULT_DIR = path.join(OUTPUT_DIR, `phase-two-baseline-${TIMESTAMP}`);

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
 * Run all benchmarks for a specific size
 */
async function runBenchmarksForSize(size: number): Promise<void> {
  console.log(`\n=== Running benchmarks for size: ${size} ===`);

  // Create directory for this size
  const sizeDir = path.join(RESULT_DIR, `size-${size}`);
  if (!fs.existsSync(sizeDir)) {
    fs.mkdirSync(sizeDir, { recursive: true });
  }

  // 1. Run List benchmarks
  const listOutput = await runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark run list -s ${size} --output md`,
    path.join(sizeDir, 'list.md')
  );
  console.log(listOutput);

  // 2. Run Map benchmarks
  const mapOutput = await runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark run map -s ${size} --output md`,
    path.join(sizeDir, 'map.md')
  );
  console.log(mapOutput);

  // 3. Compare List with native array
  const listCompareOutput = await runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark compare list array -s ${size} --output md`,
    path.join(sizeDir, 'list-vs-array.md')
  );
  console.log(listCompareOutput);

  // 4. Compare Map with native map
  const mapCompareOutput = await runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark compare map native-map -s ${size} --output md`,
    path.join(sizeDir, 'map-vs-native-map.md')
  );
  console.log(mapCompareOutput);

  // 5. Compare Map with object (use smaller size for large inputs to avoid buffer overflow)
  const objectCompareSize = size > 10000 ? 10000 : size;
  const mapObjectCompareOutput = await runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark compare map object -s ${objectCompareSize} --output md`,
    path.join(sizeDir, 'map-vs-object.md')
  );
  console.log(mapObjectCompareOutput);
}

/**
 * Run scalability tests for a specific operation
 */
async function runScalabilityTests(): Promise<void> {
  console.log('\n=== Running scalability tests ===');

  // Create directory for scalability tests
  const scalabilityDir = path.join(RESULT_DIR, 'scalability');
  if (!fs.existsSync(scalabilityDir)) {
    fs.mkdirSync(scalabilityDir, { recursive: true });
  }

  // List operations to test scalability
  const listOperations = ['get', 'append', 'prepend', 'map', 'filter', 'reduce'];

  // Run scalability tests for List operations
  for (const operation of listOperations) {
    console.log(`Running scalability test for List.${operation}...`);
    await runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark scalability list ${operation} -m 100000 -s 5 --output md`,
      path.join(scalabilityDir, `list-${operation}-scalability.md`)
    );
  }

  // Map operations to test scalability
  const mapOperations = ['get', 'has', 'set', 'delete', 'entries', 'keys', 'values'];

  // Run scalability tests for Map operations
  for (const operation of mapOperations) {
    console.log(`Running scalability test for Map.${operation}...`);
    await runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark scalability map ${operation} -m 100000 -s 5 --output md`,
      path.join(scalabilityDir, `map-${operation}-scalability.md`)
    );
  }
}

/**
 * Run all benchmarks for all sizes
 */
async function runAllBenchmarks(): Promise<void> {
  console.log('Running Phase Two baseline benchmarks...');

  // Create summary file
  const summaryPath = path.join(RESULT_DIR, 'summary.md');
  fs.writeFileSync(summaryPath, `# Phase Two Baseline Benchmarks

Run on: ${new Date().toISOString()}

`);

  // Run benchmarks for each size
  for (const size of SIZES) {
    await runBenchmarksForSize(size);

    // Update summary
    fs.appendFileSync(summaryPath, `## Size: ${size}

`);
    fs.appendFileSync(summaryPath, `- [List Benchmarks](size-${size}/list.md)\n`);
    fs.appendFileSync(summaryPath, `- [Map Benchmarks](size-${size}/map.md)\n`);
    fs.appendFileSync(summaryPath, `- [List vs Array](size-${size}/list-vs-array.md)\n`);
    fs.appendFileSync(summaryPath, `- [Map vs Native Map](size-${size}/map-vs-native-map.md)\n`);
    fs.appendFileSync(summaryPath, `- [Map vs Object](size-${size}/map-vs-object.md)\n\n`);
  }

  // Run scalability tests
  await runScalabilityTests();

  // Update summary with scalability tests
  fs.appendFileSync(summaryPath, `## Scalability Tests

`);
  fs.appendFileSync(summaryPath, `### List Scalability

`);
  fs.appendFileSync(summaryPath, `- [get](scalability/list-get-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [append](scalability/list-append-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [prepend](scalability/list-prepend-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [map](scalability/list-map-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [filter](scalability/list-filter-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [reduce](scalability/list-reduce-scalability.md)\n\n`);

  fs.appendFileSync(summaryPath, `### Map Scalability

`);
  fs.appendFileSync(summaryPath, `- [get](scalability/map-get-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [has](scalability/map-has-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [set](scalability/map-set-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [delete](scalability/map-delete-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [entries](scalability/map-entries-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [keys](scalability/map-keys-scalability.md)\n`);
  fs.appendFileSync(summaryPath, `- [values](scalability/map-values-scalability.md)\n`);

  console.log(`\nBaseline benchmarks completed. Results saved to ${RESULT_DIR}`);
  console.log(`Summary: ${summaryPath}`);
}

// Run the benchmarks
runAllBenchmarks().catch(error => {
  console.error('Error running benchmarks:', error);
  process.exit(1);
});

