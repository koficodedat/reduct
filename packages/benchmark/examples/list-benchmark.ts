/**
 * List Benchmark
 *
 * Benchmarks the Reduct List implementation against native arrays
 * across different collection sizes.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Collection sizes to benchmark
const SIZES = [10, 50, 100, 200, 500, 1000, 5000, 10000];

// Operations to benchmark
const OPERATIONS = ['get', 'map', 'filter', 'reduce', 'append', 'prepend', 'concat'];

// Directory for storing benchmark results
const RESULT_DIR = path.join(__dirname, '../reports/list-benchmark');

/**
 * Run a benchmark command and save the output to a file
 */
function runBenchmark(command: string, outputPath?: string): string {
  try {
    const output = execSync(command, { encoding: 'utf8' });

    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, output);
    }

    return output;
  } catch (error) {
    console.error(`Error running benchmark: ${error}`);
    return '';
  }
}

/**
 * Run benchmarks for a specific size
 */
function runBenchmarksForSize(size: number): void {
  console.log(`\n=== Running benchmarks for size: ${size} ===`);

  // Create directory for this size
  const sizeDir = path.join(RESULT_DIR, `size-${size}`);
  if (!fs.existsSync(sizeDir)) {
    fs.mkdirSync(sizeDir, { recursive: true });
  }

  // Run comparison benchmark
  const compareOutput = runBenchmark(
    `yarn workspace @reduct/benchmark run benchmark compare reduct-list native-array -s ${size} --output md`,
    path.join(sizeDir, 'list-vs-native-array.md')
  );
  console.log(compareOutput);

  // Run operation-specific benchmarks
  for (const operation of OPERATIONS) {
    const adapterOutput = runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark adapter-compare reduct-list native-array -o ${operation} -s ${size} --output md`,
      path.join(sizeDir, `${operation}-comparison.md`)
    );
    console.log(adapterOutput);
  }
}

/**
 * Run scalability tests
 */
function runScalabilityTests(): void {
  console.log('\n=== Running scalability tests ===');

  // Create directory for scalability tests
  const scalabilityDir = path.join(RESULT_DIR, 'scalability');
  if (!fs.existsSync(scalabilityDir)) {
    fs.mkdirSync(scalabilityDir, { recursive: true });
  }

  // Run scalability tests for each operation
  for (const operation of OPERATIONS) {
    console.log(`Running scalability test for ${operation}...`);

    // Run scalability tests for Reduct list
    runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark scalability reduct-list ${operation} -m 10000 -s 5 --output md`,
      path.join(scalabilityDir, `list-${operation}-scalability.md`)
    );

    // Run scalability tests for native array
    runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark scalability native-array ${operation} -m 10000 -s 5 --output md`,
      path.join(scalabilityDir, `native-array-${operation}-scalability.md`)
    );
  }
}

/**
 * Run specialized benchmarks
 */
function runSpecializedBenchmarks(): void {
  console.log('\n=== Running specialized benchmarks ===');

  // Create directory for specialized benchmarks
  const specializedDir = path.join(RESULT_DIR, 'specialized');
  if (!fs.existsSync(specializedDir)) {
    fs.mkdirSync(specializedDir, { recursive: true });
  }

  // Test mapFilterReduce operation
  for (const size of [100, 1000, 10000]) {
    runBenchmark(
      `yarn workspace @reduct/benchmark run benchmark benchmark "mapFilterReduce-${size}" "function mapFilterReduceBenchmark() {
        const array = Array.from({length: ${size}}, (_, i) => i);
        const list = List.from(array);

        console.time('Reduct List');
        list.mapFilterReduce(x => x * 2, x => x % 3 === 0, (acc, x) => acc + x, 0);
        console.timeEnd('Reduct List');

        console.time('Native Array');
        array.map(x => x * 2).filter(x => x % 3 === 0).reduce((acc, x) => acc + x, 0);
        console.timeEnd('Native Array');
      }" --output md`,
      path.join(specializedDir, `mapFilterReduce-${size}.md`)
    );
  }
}

/**
 * Main function to run all benchmarks
 */
function main(): void {
  // Create result directory if it doesn't exist
  if (!fs.existsSync(RESULT_DIR)) {
    fs.mkdirSync(RESULT_DIR, { recursive: true });
  }

  // Create summary file
  const summaryPath = path.join(RESULT_DIR, 'summary.md');
  fs.writeFileSync(summaryPath, `# List Benchmark Results

Run on: ${new Date().toISOString()}

This benchmark compares the performance of the Reduct List implementation with native arrays
across different collection sizes.

`);

  // Run benchmarks for each size
  for (const size of SIZES) {
    runBenchmarksForSize(size);

    // Update summary
    fs.appendFileSync(summaryPath, `## Size: ${size}

- [List vs Native Array](size-${size}/list-vs-native-array.md)

### Operation-specific comparisons

`);
    for (const operation of OPERATIONS) {
      fs.appendFileSync(summaryPath, `- [${operation}](size-${size}/${operation}-comparison.md)\n`);
    }
    fs.appendFileSync(summaryPath, `\n`);
  }

  // Run scalability tests
  runScalabilityTests();

  // Update summary with scalability tests
  fs.appendFileSync(summaryPath, `## Scalability Tests

`);
  for (const operation of OPERATIONS) {
    fs.appendFileSync(summaryPath, `### ${operation}\n\n`);
    fs.appendFileSync(summaryPath, `- [Reduct List](scalability/list-${operation}-scalability.md)\n`);
    fs.appendFileSync(summaryPath, `- [Native Array](scalability/native-array-${operation}-scalability.md)\n\n`);
  }

  // Run specialized benchmarks
  runSpecializedBenchmarks();

  // Update summary with specialized benchmarks
  fs.appendFileSync(summaryPath, `## Specialized Benchmarks

`);
  for (const size of [100, 1000, 10000]) {
    fs.appendFileSync(summaryPath, `- [mapFilterReduce (${size} elements)](specialized/mapFilterReduce-${size}.md)\n`);
  }

  console.log(`\nBenchmark complete. Results saved to ${RESULT_DIR}`);
}

// Run the benchmark
main();
