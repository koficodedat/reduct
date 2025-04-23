/**
 * List Implementation Benchmark
 *
 * Benchmarks the performance of different List implementations:
 * - Native Array
 * - SmallList
 * - ChunkedList
 * - PersistentVector
 * - Integrated List (with automatic transitions)
 */

// External libraries
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Local imports from other packages
import { List, SmallList, ChunkedList, PersistentVector } from '@reduct/data-structures';

// Size categories to test
const SIZE_CATEGORIES = {
  small: [8, 16, 32],
  medium: [64, 256, 1000],
  large: [2000, 10000, 50000]
};

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
const ITERATIONS = 100;
const WARMUP_ITERATIONS = 10;

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
 * Benchmarks a specific operation on different implementations
 */
function benchmarkOperation(
  operation: string,
  size: number,
  data: number[]
): Record<string, number> {
  // Create instances of each implementation
  const nativeArray = [...data];
  const smallList = new SmallList(data);
  const chunkedList = ChunkedList.from(data);
  const persistentVector = PersistentVector.from(data);
  const integratedList = List.from(data);

  const results: Record<string, number> = {};

  // Benchmark native array
  results.nativeArray = measureTime(() => {
    switch (operation) {
      case 'get':
        const randomIndex = Math.floor(Math.random() * size);
        return nativeArray[randomIndex];
      case 'append':
        return [...nativeArray, 999];
      case 'prepend':
        return [999, ...nativeArray];
      case 'set':
        const setIndex = Math.floor(Math.random() * size);
        const newArray = [...nativeArray];
        newArray[setIndex] = 999;
        return newArray;
      case 'map':
        return nativeArray.map(x => x * 2);
      case 'filter':
        return nativeArray.filter(x => x % 2 === 0);
      case 'reduce':
        return nativeArray.reduce((acc, x) => acc + x, 0);
      case 'slice':
        const start = Math.floor(size * 0.25);
        const end = Math.floor(size * 0.75);
        return nativeArray.slice(start, end);
      case 'concat':
        return nativeArray.concat([1, 2, 3, 4, 5]);
      default:
        return nativeArray; // Default case to satisfy TypeScript
    }
  }, ITERATIONS);

  // Benchmark SmallList
  results.smallList = measureTime(() => {
    switch (operation) {
      case 'get':
        const randomIndex = Math.floor(Math.random() * size);
        return smallList.get(randomIndex);
      case 'append':
        return smallList.append(999);
      case 'prepend':
        return smallList.prepend(999);
      case 'set':
        const setIndex = Math.floor(Math.random() * size);
        return smallList.set(setIndex, 999);
      case 'map':
        return smallList.map(x => x * 2);
      case 'filter':
        return smallList.filter(x => x % 2 === 0);
      case 'reduce':
        return smallList.reduce((acc, x) => acc + x, 0);
      case 'slice':
        const start = Math.floor(size * 0.25);
        const end = Math.floor(size * 0.75);
        return smallList.slice(start, end);
      case 'concat':
        return smallList.concat(new SmallList([1, 2, 3, 4, 5]));
      default:
        return smallList; // Default case to satisfy TypeScript
    }
  }, ITERATIONS);

  // Benchmark ChunkedList
  results.chunkedList = measureTime(() => {
    switch (operation) {
      case 'get':
        const randomIndex = Math.floor(Math.random() * size);
        return chunkedList.get(randomIndex);
      case 'append':
        return chunkedList.append(999);
      case 'prepend':
        return chunkedList.prepend(999);
      case 'set':
        const setIndex = Math.floor(Math.random() * size);
        return chunkedList.set(setIndex, 999);
      case 'map':
        return chunkedList.map(x => x * 2);
      case 'filter':
        return chunkedList.filter(x => x % 2 === 0);
      case 'reduce':
        return chunkedList.reduce((acc, x) => acc + x, 0);
      case 'slice':
        const start = Math.floor(size * 0.25);
        const end = Math.floor(size * 0.75);
        return chunkedList.slice(start, end);
      case 'concat':
        return chunkedList.concat(ChunkedList.from([1, 2, 3, 4, 5]));
      default:
        return chunkedList; // Default case to satisfy TypeScript
    }
  }, ITERATIONS);

  // Benchmark PersistentVector
  results.persistentVector = measureTime(() => {
    switch (operation) {
      case 'get':
        const randomIndex = Math.floor(Math.random() * size);
        return persistentVector.get(randomIndex);
      case 'append':
        return persistentVector.append(999);
      case 'prepend':
        return persistentVector.prepend(999);
      case 'set':
        const setIndex = Math.floor(Math.random() * size);
        return persistentVector.set(setIndex, 999);
      case 'map':
        return persistentVector.map(x => x * 2);
      case 'filter':
        return persistentVector.filter(x => x % 2 === 0);
      case 'reduce':
        return persistentVector.reduce((acc, x) => acc + x, 0);
      case 'slice':
        const start = Math.floor(size * 0.25);
        const end = Math.floor(size * 0.75);
        return persistentVector.slice(start, end);
      case 'concat':
        return persistentVector.concat(PersistentVector.from([1, 2, 3, 4, 5]));
      default:
        return persistentVector; // Default case to satisfy TypeScript
    }
  }, ITERATIONS);

  // Benchmark Integrated List
  results.integratedList = measureTime(() => {
    switch (operation) {
      case 'get':
        const randomIndex = Math.floor(Math.random() * size);
        return integratedList.get(randomIndex);
      case 'append':
        return integratedList.append(999);
      case 'prepend':
        return integratedList.prepend(999);
      case 'set':
        const setIndex = Math.floor(Math.random() * size);
        return integratedList.set(setIndex, 999);
      case 'map':
        return integratedList.map(x => x * 2);
      case 'filter':
        return integratedList.filter(x => x % 2 === 0);
      case 'reduce':
        return integratedList.reduce((acc, x) => acc + x, 0);
      case 'slice':
        const start = Math.floor(size * 0.25);
        const end = Math.floor(size * 0.75);
        return integratedList.slice(start, end);
      case 'concat':
        return integratedList.concat(List.from([1, 2, 3, 4, 5]));
      default:
        return integratedList; // Default case to satisfy TypeScript
    }
  }, ITERATIONS);

  return results;
}

/**
 * Runs benchmarks for all operations across all sizes
 */
async function runBenchmarks(): Promise<any[]> {
  const results: any[] = [];

  for (const [category, sizes] of Object.entries(SIZE_CATEGORIES)) {
    for (const size of sizes) {
      console.log(`Benchmarking ${category} size: ${size}`);
      const data = createRandomArray(size);

      for (const operation of OPERATIONS) {
        console.log(`  Operation: ${operation}`);
        const operationResults = benchmarkOperation(operation, size, data);

        results.push({
          category,
          size,
          operation,
          ...operationResults
        });
      }
    }
  }

  return results;
}

/**
 * Formats the results as a markdown table
 */
function formatResultsAsMarkdown(results: any[]): string {
  // Group results by size category and operation
  const groupedResults: Record<string, Record<string, any[]>> = {};

  for (const result of results) {
    if (!groupedResults[result.category]) {
      groupedResults[result.category] = {};
    }

    if (!groupedResults[result.category][result.operation]) {
      groupedResults[result.category][result.operation] = [];
    }

    groupedResults[result.category][result.operation].push(result);
  }

  // Create markdown content
  let markdown = '# List Implementation Benchmark Results\n\n';
  markdown += `Date: ${new Date().toISOString()}\n\n`;
  markdown += 'This benchmark compares the performance of different List implementations:\n';
  markdown += '- Native Array\n';
  markdown += '- SmallList\n';
  markdown += '- ChunkedList\n';
  markdown += '- PersistentVector\n';
  markdown += '- Integrated List (with automatic transitions)\n\n';

  // Add tables for each category and operation
  for (const [category, operations] of Object.entries(groupedResults)) {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Collections\n\n`;

    for (const [operation, results] of Object.entries(operations)) {
      markdown += `### ${operation}\n\n`;
      markdown += '| Size | Native Array | SmallList | ChunkedList | PersistentVector | Integrated List |\n';
      markdown += '|------|-------------|-----------|-------------|------------------|----------------|\n';

      // Sort results by size
      results.sort((a, b) => a.size - b.size);

      for (const result of results) {
        markdown += `| ${result.size} | ${result.nativeArray.toFixed(6)} | ${result.smallList.toFixed(6)} | ${result.chunkedList.toFixed(6)} | ${result.persistentVector.toFixed(6)} | ${result.integratedList.toFixed(6)} |\n`;
      }

      markdown += '\n';
    }
  }

  return markdown;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting List implementation benchmark...');

  const results = await runBenchmarks();

  // Format results as markdown
  const markdown = formatResultsAsMarkdown(results);

  // Save results to file
  const reportDir = path.resolve(__dirname, '../../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `list-implementation-benchmark-${Date.now()}.md`);
  fs.writeFileSync(reportPath, markdown);

  console.log(`Benchmark complete. Results saved to ${reportPath}`);
}

// Run the benchmark
main().catch(console.error);
