/**
 * Operation Pattern Benchmark
 * 
 * Tests performance of List vs. native arrays with different operation patterns
 */

import { List } from '@reduct/data-structures';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

// Size for all benchmarks
const SIZE = 10000;

// Number of iterations for each benchmark
const ITERATIONS = 10;

// Number of warmup iterations
const WARMUP_ITERATIONS = 5;

// Operation patterns to test
const OPERATION_PATTERNS = [
  'single_map',
  'single_filter',
  'single_reduce',
  'chained_map_filter',
  'chained_filter_map',
  'chained_map_reduce',
  'chained_filter_reduce',
  'chained_map_filter_reduce',
  'batch_updates',
  'repeated_modifications'
];

/**
 * Measures the time taken to execute a function
 */
function measureTime(fn: () => any, iterations: number): number {
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
 * Creates a random array of the specified size
 */
function createRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
}

/**
 * Runs the operation pattern benchmark
 */
export async function runOperationPatternBenchmark(): Promise<any> {
  const results: any = {
    patterns: OPERATION_PATTERNS,
    list: [],
    array: [],
    ratio: []
  };
  
  // Create test data
  const data = createRandomArray(SIZE);
  const list = List.from(data);
  const array = [...data];
  
  for (const pattern of OPERATION_PATTERNS) {
    console.log(`Benchmarking pattern: ${pattern}...`);
    
    // Measure List performance
    let listTime: number;
    
    switch (pattern) {
      case 'single_map':
        listTime = measureTime(() => {
          return list.map(x => x * 2);
        }, ITERATIONS);
        break;
      case 'single_filter':
        listTime = measureTime(() => {
          return list.filter(x => x % 2 === 0);
        }, ITERATIONS);
        break;
      case 'single_reduce':
        listTime = measureTime(() => {
          return list.reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'chained_map_filter':
        listTime = measureTime(() => {
          return list.map(x => x * 2).filter(x => x % 4 === 0);
        }, ITERATIONS);
        break;
      case 'chained_filter_map':
        listTime = measureTime(() => {
          return list.filter(x => x % 2 === 0).map(x => x * 2);
        }, ITERATIONS);
        break;
      case 'chained_map_reduce':
        listTime = measureTime(() => {
          return list.map(x => x * 2).reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'chained_filter_reduce':
        listTime = measureTime(() => {
          return list.filter(x => x % 2 === 0).reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'chained_map_filter_reduce':
        listTime = measureTime(() => {
          return list.map(x => x * 2).filter(x => x % 4 === 0).reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'batch_updates':
        listTime = measureTime(() => {
          let result = list;
          for (let i = 0; i < 100; i++) {
            const index = Math.floor(Math.random() * SIZE);
            result = result.set(index, 999);
          }
          return result;
        }, ITERATIONS);
        break;
      case 'repeated_modifications':
        listTime = measureTime(() => {
          let result = list;
          for (let i = 0; i < 10; i++) {
            result = result.map(x => x + 1);
          }
          return result;
        }, ITERATIONS);
        break;
      default:
        listTime = 0;
    }
    
    // Measure Array performance
    let arrayTime: number;
    
    switch (pattern) {
      case 'single_map':
        arrayTime = measureTime(() => {
          return array.map(x => x * 2);
        }, ITERATIONS);
        break;
      case 'single_filter':
        arrayTime = measureTime(() => {
          return array.filter(x => x % 2 === 0);
        }, ITERATIONS);
        break;
      case 'single_reduce':
        arrayTime = measureTime(() => {
          return array.reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'chained_map_filter':
        arrayTime = measureTime(() => {
          return array.map(x => x * 2).filter(x => x % 4 === 0);
        }, ITERATIONS);
        break;
      case 'chained_filter_map':
        arrayTime = measureTime(() => {
          return array.filter(x => x % 2 === 0).map(x => x * 2);
        }, ITERATIONS);
        break;
      case 'chained_map_reduce':
        arrayTime = measureTime(() => {
          return array.map(x => x * 2).reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'chained_filter_reduce':
        arrayTime = measureTime(() => {
          return array.filter(x => x % 2 === 0).reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'chained_map_filter_reduce':
        arrayTime = measureTime(() => {
          return array.map(x => x * 2).filter(x => x % 4 === 0).reduce((acc, x) => acc + x, 0);
        }, ITERATIONS);
        break;
      case 'batch_updates':
        arrayTime = measureTime(() => {
          let result = [...array];
          for (let i = 0; i < 100; i++) {
            const index = Math.floor(Math.random() * SIZE);
            result = [...result.slice(0, index), 999, ...result.slice(index + 1)];
          }
          return result;
        }, ITERATIONS);
        break;
      case 'repeated_modifications':
        arrayTime = measureTime(() => {
          let result = [...array];
          for (let i = 0; i < 10; i++) {
            result = result.map(x => x + 1);
          }
          return result;
        }, ITERATIONS);
        break;
      default:
        arrayTime = 0;
    }
    
    // Calculate ratio (List time / Array time)
    const ratio = listTime / arrayTime;
    
    // Store results
    results.list.push(listTime);
    results.array.push(arrayTime);
    results.ratio.push(ratio);
  }
  
  return results;
}

/**
 * Saves benchmark results to a file
 */
export async function saveOperationPatternResults(results: any): Promise<void> {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Save raw results as JSON
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const jsonPath = path.join(reportsDir, `operation-pattern-benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Raw results saved to ${jsonPath}`);
  
  // Create markdown report
  let markdown = '# Operation Pattern Benchmark Results\n\n';
  markdown += `Date: ${new Date().toISOString()}\n\n`;
  markdown += `This benchmark compares the performance of List vs. native arrays with different operation patterns (size: ${SIZE}).\n\n`;
  
  // Add results table
  markdown += '| Operation Pattern | List (ms) | Array (ms) | Ratio (List/Array) |\n';
  markdown += '|-------------------|-----------|------------|--------------------|\n';
  
  for (let i = 0; i < results.patterns.length; i++) {
    const pattern = results.patterns[i];
    const listTime = results.list[i].toFixed(4);
    const arrayTime = results.array[i].toFixed(4);
    const ratio = results.ratio[i].toFixed(2);
    
    markdown += `| ${pattern.replace(/_/g, ' ')} | ${listTime} | ${arrayTime} | ${ratio}x |\n`;
  }
  
  markdown += '\n';
  
  // Add analysis
  markdown += '## Analysis\n\n';
  markdown += 'This section analyzes the performance of List vs. native arrays with different operation patterns.\n\n';
  
  // Find the pattern with the best ratio
  let bestRatioIndex = 0;
  let bestRatio = results.ratio[0];
  
  for (let i = 1; i < results.patterns.length; i++) {
    if (results.ratio[i] < bestRatio) {
      bestRatio = results.ratio[i];
      bestRatioIndex = i;
    }
  }
  
  const bestPattern = results.patterns[bestRatioIndex];
  
  markdown += `- Best performance ratio: ${bestRatio.toFixed(2)}x with "${bestPattern.replace(/_/g, ' ')}"\n`;
  
  // Check if List outperforms Array for any pattern
  const outperformsIndex = results.ratio.findIndex((r: number) => r <= 1);
  if (outperformsIndex >= 0) {
    markdown += `- List outperforms Array with "${results.patterns[outperformsIndex].replace(/_/g, ' ')}"\n`;
  } else {
    markdown += `- List does not outperform Array with any tested operation pattern\n`;
  }
  
  // Add observations about operation fusion
  markdown += '\n### Operation Fusion Analysis\n\n';
  
  // Compare chained operations vs. single operations
  const singleMapIndex = results.patterns.indexOf('single_map');
  const singleFilterIndex = results.patterns.indexOf('single_filter');
  const chainedMapFilterIndex = results.patterns.indexOf('chained_map_filter');
  
  if (singleMapIndex >= 0 && singleFilterIndex >= 0 && chainedMapFilterIndex >= 0) {
    const singleMapTime = results.list[singleMapIndex];
    const singleFilterTime = results.list[singleFilterIndex];
    const chainedMapFilterTime = results.list[chainedMapFilterIndex];
    
    const singleOperationsTime = singleMapTime + singleFilterTime;
    const fusionBenefit = (singleOperationsTime - chainedMapFilterTime) / singleOperationsTime * 100;
    
    markdown += `- Chained map+filter vs. separate operations: ${fusionBenefit.toFixed(2)}% faster\n`;
  }
  
  // Save markdown report
  const markdownPath = path.join(reportsDir, `operation-pattern-benchmark-${timestamp}.md`);
  fs.writeFileSync(markdownPath, markdown);
  console.log(`Markdown report saved to ${markdownPath}`);
}

/**
 * Main function
 */
export async function runOperationPatternBenchmarkAndSave(): Promise<void> {
  console.log('Running Operation Pattern Benchmark...');
  const results = await runOperationPatternBenchmark();
  await saveOperationPatternResults(results);
  console.log('Benchmark completed!');
}
