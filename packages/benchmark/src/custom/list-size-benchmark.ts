/**
 * List Size Benchmark
 *
 * Benchmarks the performance of different List implementations across various sizes.
 * This helps determine the optimal size thresholds for transitions between implementations.
 */

import { List } from '@reduct/data-structures';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Size ranges to test
const SMALL_SIZES = [1, 2, 4, 8, 16, 24, 32, 48, 64, 96, 128];
const MEDIUM_SIZES = [256, 512, 768, 1024, 1536, 2048];
const LARGE_SIZES = [4096, 8192, 16384, 32768, 65536];

// Operations to benchmark
const OPERATIONS = [
  'get',
  'append',
  'prepend',
  'set',
  'map',
  'filter',
  'reduce',
  'slice',
  'concat'
];

// Number of iterations for each benchmark
const ITERATIONS = 1000;
const WARMUP_ITERATIONS = 100;

/**
 * Creates a random array of the specified size
 */
function createRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
}

/**
 * Measures the execution time of a function
 */
function measureTime(fn: () => void, iterations: number): number {
  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    fn();
  }

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  return (end - start) / iterations;
}

/**
 * Benchmarks a specific operation on a List of the given size
 */
function benchmarkOperation(
  operation: string,
  size: number,
  data: number[]
): { operation: string; size: number; time: number } {
  const list = List.from(data);

  let fn: () => void;

  switch (operation) {
    case 'get':
      const randomIndex = Math.floor(Math.random() * size);
      fn = () => list.get(randomIndex);
      break;
    case 'append':
      fn = () => list.append(999);
      break;
    case 'prepend':
      fn = () => list.prepend(999);
      break;
    case 'set':
      const setIndex = Math.floor(Math.random() * size);
      fn = () => list.set(setIndex, 999);
      break;
    case 'map':
      fn = () => list.map(x => x * 2);
      break;
    case 'filter':
      fn = () => list.filter(x => x % 2 === 0);
      break;
    case 'reduce':
      fn = () => list.reduce((acc, x) => acc + x, 0);
      break;
    case 'slice':
      const start = Math.floor(size * 0.25);
      const end = Math.floor(size * 0.75);
      fn = () => list.slice(start, end);
      break;
    case 'concat':
      const smallList = List.from([1, 2, 3, 4, 5]);
      fn = () => list.concat(smallList);
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  const time = measureTime(fn, ITERATIONS);

  return {
    operation,
    size,
    time
  };
}

/**
 * Runs benchmarks for all operations across all sizes
 */
async function runBenchmarks(): Promise<any[]> {
  const results: any[] = [];
  const allSizes = [...SMALL_SIZES, ...MEDIUM_SIZES, ...LARGE_SIZES];

  for (const size of allSizes) {
    console.log(`Benchmarking size: ${size}`);
    const data = createRandomArray(size);

    for (const operation of OPERATIONS) {
      console.log(`  Operation: ${operation}`);
      const result = benchmarkOperation(operation, size, data);
      results.push(result);
    }
  }

  return results;
}

/**
 * Formats the results as a markdown table
 */
function formatResultsAsMarkdown(results: any[]): string {
  // Group results by operation
  const groupedByOperation: Record<string, any[]> = {};

  for (const result of results) {
    if (!groupedByOperation[result.operation]) {
      groupedByOperation[result.operation] = [];
    }
    groupedByOperation[result.operation].push(result);
  }

  // Create markdown content
  let markdown = '# List Size Benchmark Results\n\n';
  markdown += `Date: ${new Date().toISOString()}\n\n`;
  markdown += 'This benchmark measures the performance of different List operations across various sizes.\n';
  markdown += 'The goal is to determine the optimal size thresholds for transitions between implementations.\n\n';

  // Add a table for each operation
  for (const operation of OPERATIONS) {
    const operationResults = groupedByOperation[operation] || [];
    operationResults.sort((a, b) => a.size - b.size);

    markdown += `## ${operation}\n\n`;
    markdown += '| Size | Time (ms) |\n';
    markdown += '|------|----------|\n';

    for (const result of operationResults) {
      markdown += `| ${result.size} | ${result.time.toFixed(6)} |\n`;
    }

    markdown += '\n';
  }

  return markdown;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting List size benchmark...');

  const results = await runBenchmarks();

  // Format results as markdown
  const markdown = formatResultsAsMarkdown(results);

  // Save results to file
  const reportDir = path.resolve(__dirname, '../../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `list-size-benchmark-${Date.now()}.md`);
  fs.writeFileSync(reportPath, markdown);

  console.log(`Benchmark complete. Results saved to ${reportPath}`);
}

// Run the benchmark
main().catch(console.error);
