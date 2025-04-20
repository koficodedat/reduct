/**
 * Size Variation Benchmark
 * 
 * Tests performance of List vs. native arrays across different collection sizes
 */

import { List } from '@reduct/data-structures';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

// Size categories to test
const SIZE_CATEGORIES = [10, 100, 1000, 10000, 100000];

// Number of iterations for each benchmark
const ITERATIONS = 10;

// Number of warmup iterations
const WARMUP_ITERATIONS = 5;

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
 * Runs the size variation benchmark
 */
export async function runSizeVariationBenchmark(): Promise<any> {
  const results: any = {
    sizes: SIZE_CATEGORIES,
    operations: {},
  };

  // Test operations
  const operations = ['get', 'map', 'filter', 'reduce', 'append', 'prepend'];
  
  for (const operation of operations) {
    results.operations[operation] = {
      list: [],
      array: [],
      ratio: []
    };
    
    for (const size of SIZE_CATEGORIES) {
      console.log(`Benchmarking ${operation} with size ${size}...`);
      
      // Create test data
      const data = createRandomArray(size);
      const list = List.from(data);
      const array = [...data];
      
      // Measure List performance
      let listTime: number;
      
      switch (operation) {
        case 'get':
          listTime = measureTime(() => {
            const index = Math.floor(Math.random() * size);
            return list.get(index);
          }, ITERATIONS);
          break;
        case 'map':
          listTime = measureTime(() => {
            return list.map(x => x * 2);
          }, ITERATIONS);
          break;
        case 'filter':
          listTime = measureTime(() => {
            return list.filter(x => x % 2 === 0);
          }, ITERATIONS);
          break;
        case 'reduce':
          listTime = measureTime(() => {
            return list.reduce((acc, x) => acc + x, 0);
          }, ITERATIONS);
          break;
        case 'append':
          listTime = measureTime(() => {
            return list.append(999);
          }, ITERATIONS);
          break;
        case 'prepend':
          listTime = measureTime(() => {
            return list.prepend(999);
          }, ITERATIONS);
          break;
        default:
          listTime = 0;
      }
      
      // Measure Array performance
      let arrayTime: number;
      
      switch (operation) {
        case 'get':
          arrayTime = measureTime(() => {
            const index = Math.floor(Math.random() * size);
            return array[index];
          }, ITERATIONS);
          break;
        case 'map':
          arrayTime = measureTime(() => {
            return array.map(x => x * 2);
          }, ITERATIONS);
          break;
        case 'filter':
          arrayTime = measureTime(() => {
            return array.filter(x => x % 2 === 0);
          }, ITERATIONS);
          break;
        case 'reduce':
          arrayTime = measureTime(() => {
            return array.reduce((acc, x) => acc + x, 0);
          }, ITERATIONS);
          break;
        case 'append':
          arrayTime = measureTime(() => {
            return [...array, 999];
          }, ITERATIONS);
          break;
        case 'prepend':
          arrayTime = measureTime(() => {
            return [999, ...array];
          }, ITERATIONS);
          break;
        default:
          arrayTime = 0;
      }
      
      // Calculate ratio (List time / Array time)
      const ratio = listTime / arrayTime;
      
      // Store results
      results.operations[operation].list.push(listTime);
      results.operations[operation].array.push(arrayTime);
      results.operations[operation].ratio.push(ratio);
    }
  }
  
  return results;
}

/**
 * Saves benchmark results to a file
 */
export async function saveSizeVariationResults(results: any): Promise<void> {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Save raw results as JSON
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const jsonPath = path.join(reportsDir, `size-variation-benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Raw results saved to ${jsonPath}`);
  
  // Create markdown report
  let markdown = '# Size Variation Benchmark Results\n\n';
  markdown += `Date: ${new Date().toISOString()}\n\n`;
  markdown += 'This benchmark compares the performance of List vs. native arrays across different collection sizes.\n\n';
  
  // Add results for each operation
  for (const [operation, data] of Object.entries(results.operations)) {
    markdown += `## ${operation} Operation\n\n`;
    markdown += '| Size | List (ms) | Array (ms) | Ratio (List/Array) |\n';
    markdown += '|------|-----------|------------|--------------------|\n';
    
    for (let i = 0; i < results.sizes.length; i++) {
      const size = results.sizes[i];
      const listTime = (data as any).list[i].toFixed(4);
      const arrayTime = (data as any).array[i].toFixed(4);
      const ratio = (data as any).ratio[i].toFixed(2);
      
      markdown += `| ${size} | ${listTime} | ${arrayTime} | ${ratio}x |\n`;
    }
    
    markdown += '\n';
  }
  
  // Add crossover analysis
  markdown += '## Crossover Analysis\n\n';
  markdown += 'This section identifies the collection sizes where List performance approaches or exceeds native array performance.\n\n';
  
  for (const [operation, data] of Object.entries(results.operations)) {
    markdown += `### ${operation} Operation\n\n`;
    
    // Find the size with the best ratio
    let bestRatioIndex = 0;
    let bestRatio = (data as any).ratio[0];
    
    for (let i = 1; i < results.sizes.length; i++) {
      if ((data as any).ratio[i] < bestRatio) {
        bestRatio = (data as any).ratio[i];
        bestRatioIndex = i;
      }
    }
    
    const bestSize = results.sizes[bestRatioIndex];
    
    markdown += `- Best performance ratio: ${bestRatio.toFixed(2)}x at size ${bestSize}\n`;
    
    // Check if List outperforms Array for any size
    const outperformsIndex = (data as any).ratio.findIndex((r: number) => r <= 1);
    if (outperformsIndex >= 0) {
      markdown += `- List outperforms Array at size ${results.sizes[outperformsIndex]}\n`;
    } else {
      markdown += `- List does not outperform Array at any tested size\n`;
    }
    
    markdown += '\n';
  }
  
  // Save markdown report
  const markdownPath = path.join(reportsDir, `size-variation-benchmark-${timestamp}.md`);
  fs.writeFileSync(markdownPath, markdown);
  console.log(`Markdown report saved to ${markdownPath}`);
}

/**
 * Main function
 */
export async function runSizeVariationBenchmarkAndSave(): Promise<void> {
  console.log('Running Size Variation Benchmark...');
  const results = await runSizeVariationBenchmark();
  await saveSizeVariationResults(results);
  console.log('Benchmark completed!');
}
