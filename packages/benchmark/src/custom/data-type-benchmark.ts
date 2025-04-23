/**
 * Data Type Benchmark
 * 
 * Tests performance of List vs. native arrays with different data types
 */

import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

import { List } from '@reduct/data-structures';

// Size for all benchmarks
const SIZE = 10000;

// Number of iterations for each benchmark
const ITERATIONS = 10;

// Number of warmup iterations
const WARMUP_ITERATIONS = 5;

// Data types to test
const DATA_TYPES = ['numbers', 'strings', 'objects', 'mixed'];

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
 * Creates test data of the specified type
 */
function createTestData(type: string, size: number): any[] {
  switch (type) {
    case 'numbers':
      return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
    case 'strings':
      return Array.from({ length: size }, () => 
        Math.random().toString(36).substring(2, 8)
      );
    case 'objects':
      return Array.from({ length: size }, (_, i) => ({
        id: i,
        value: Math.random().toString(36).substring(2, 8)
      }));
    case 'mixed':
      return Array.from({ length: size }, (_, i) => {
        const type = i % 3;
        if (type === 0) return Math.floor(Math.random() * 1000);
        if (type === 1) return Math.random().toString(36).substring(2, 8);
        return {
          id: i,
          value: Math.random().toString(36).substring(2, 8)
        };
      });
    default:
      return [];
  }
}

/**
 * Runs the data type benchmark
 */
export async function runDataTypeBenchmark(): Promise<any> {
  const results: any = {
    types: DATA_TYPES,
    operations: {},
  };

  // Test operations
  const operations = ['map', 'filter', 'reduce'];
  
  for (const operation of operations) {
    results.operations[operation] = {
      list: [],
      array: [],
      ratio: []
    };
    
    for (const type of DATA_TYPES) {
      console.log(`Benchmarking ${operation} with ${type}...`);
      
      // Create test data
      const data = createTestData(type, SIZE);
      const list = List.from(data);
      const array = [...data];
      
      // Measure List performance
      let listTime: number;
      
      switch (operation) {
        case 'map':
          if (type === 'numbers') {
            listTime = measureTime(() => {
              return list.map(x => (typeof x === 'number') ? x * 2 : x);
            }, ITERATIONS);
          } else if (type === 'strings') {
            listTime = measureTime(() => {
              return list.map(x => (typeof x === 'string') ? x.toUpperCase() : x);
            }, ITERATIONS);
          } else if (type === 'objects') {
            listTime = measureTime(() => {
              return list.map(x => (typeof x === 'object' && x !== null) ? { ...x, id: (x as any).id * 2 } : x);
            }, ITERATIONS);
          } else {
            listTime = measureTime(() => {
              return list.map(x => {
                if (typeof x === 'number') return x * 2;
                if (typeof x === 'string') return x.toUpperCase();
                if (typeof x === 'object' && x !== null) return { ...x, id: (x as any).id * 2 };
                return x;
              });
            }, ITERATIONS);
          }
          break;
        case 'filter':
          if (type === 'numbers') {
            listTime = measureTime(() => {
              return list.filter(x => (typeof x === 'number') ? x % 2 === 0 : true);
            }, ITERATIONS);
          } else if (type === 'strings') {
            listTime = measureTime(() => {
              return list.filter(x => (typeof x === 'string') ? x.length > 3 : true);
            }, ITERATIONS);
          } else if (type === 'objects') {
            listTime = measureTime(() => {
              return list.filter(x => (typeof x === 'object' && x !== null) ? (x as any).id % 2 === 0 : true);
            }, ITERATIONS);
          } else {
            listTime = measureTime(() => {
              return list.filter(x => {
                if (typeof x === 'number') return x % 2 === 0;
                if (typeof x === 'string') return x.length > 3;
                if (typeof x === 'object' && x !== null) return (x as any).id % 2 === 0;
                return true;
              });
            }, ITERATIONS);
          }
          break;
        case 'reduce':
          if (type === 'numbers') {
            listTime = measureTime(() => {
              return list.reduce((acc, x) => acc + (typeof x === 'number' ? x : 0), 0);
            }, ITERATIONS);
          } else if (type === 'strings') {
            listTime = measureTime(() => {
              return list.reduce((acc, x) => acc + (typeof x === 'string' ? x.length : 0), 0);
            }, ITERATIONS);
          } else if (type === 'objects') {
            listTime = measureTime(() => {
              return list.reduce((acc, x) => acc + (typeof x === 'object' && x !== null ? (x as any).id : 0), 0);
            }, ITERATIONS);
          } else {
            listTime = measureTime(() => {
              return list.reduce((acc, x) => {
                if (typeof x === 'number') return acc + x;
                if (typeof x === 'string') return acc + x.length;
                if (typeof x === 'object' && x !== null) return acc + (x as any).id;
                return acc;
              }, 0);
            }, ITERATIONS);
          }
          break;
        default:
          listTime = 0;
      }
      
      // Measure Array performance
      let arrayTime: number;
      
      switch (operation) {
        case 'map':
          if (type === 'numbers') {
            arrayTime = measureTime(() => {
              return array.map(x => (typeof x === 'number') ? x * 2 : x);
            }, ITERATIONS);
          } else if (type === 'strings') {
            arrayTime = measureTime(() => {
              return array.map(x => (typeof x === 'string') ? x.toUpperCase() : x);
            }, ITERATIONS);
          } else if (type === 'objects') {
            arrayTime = measureTime(() => {
              return array.map(x => (typeof x === 'object' && x !== null) ? { ...x, id: (x as any).id * 2 } : x);
            }, ITERATIONS);
          } else {
            arrayTime = measureTime(() => {
              return array.map(x => {
                if (typeof x === 'number') return x * 2;
                if (typeof x === 'string') return x.toUpperCase();
                if (typeof x === 'object' && x !== null) return { ...x, id: (x as any).id * 2 };
                return x;
              });
            }, ITERATIONS);
          }
          break;
        case 'filter':
          if (type === 'numbers') {
            arrayTime = measureTime(() => {
              return array.filter(x => (typeof x === 'number') ? x % 2 === 0 : true);
            }, ITERATIONS);
          } else if (type === 'strings') {
            arrayTime = measureTime(() => {
              return array.filter(x => (typeof x === 'string') ? x.length > 3 : true);
            }, ITERATIONS);
          } else if (type === 'objects') {
            arrayTime = measureTime(() => {
              return array.filter(x => (typeof x === 'object' && x !== null) ? (x as any).id % 2 === 0 : true);
            }, ITERATIONS);
          } else {
            arrayTime = measureTime(() => {
              return array.filter(x => {
                if (typeof x === 'number') return x % 2 === 0;
                if (typeof x === 'string') return x.length > 3;
                if (typeof x === 'object' && x !== null) return (x as any).id % 2 === 0;
                return true;
              });
            }, ITERATIONS);
          }
          break;
        case 'reduce':
          if (type === 'numbers') {
            arrayTime = measureTime(() => {
              return array.reduce((acc, x) => acc + (typeof x === 'number' ? x : 0), 0);
            }, ITERATIONS);
          } else if (type === 'strings') {
            arrayTime = measureTime(() => {
              return array.reduce((acc, x) => acc + (typeof x === 'string' ? x.length : 0), 0);
            }, ITERATIONS);
          } else if (type === 'objects') {
            arrayTime = measureTime(() => {
              return array.reduce((acc, x) => acc + (typeof x === 'object' && x !== null ? (x as any).id : 0), 0);
            }, ITERATIONS);
          } else {
            arrayTime = measureTime(() => {
              return array.reduce((acc, x) => {
                if (typeof x === 'number') return acc + x;
                if (typeof x === 'string') return acc + x.length;
                if (typeof x === 'object' && x !== null) return acc + (x as any).id;
                return acc;
              }, 0);
            }, ITERATIONS);
          }
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
export async function saveDataTypeResults(results: any): Promise<void> {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Save raw results as JSON
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const jsonPath = path.join(reportsDir, `data-type-benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Raw results saved to ${jsonPath}`);
  
  // Create markdown report
  let markdown = '# Data Type Benchmark Results\n\n';
  markdown += `Date: ${new Date().toISOString()}\n\n`;
  markdown += `This benchmark compares the performance of List vs. native arrays with different data types (size: ${SIZE}).\n\n`;
  
  // Add results for each operation
  for (const [operation, data] of Object.entries(results.operations)) {
    markdown += `## ${operation} Operation\n\n`;
    markdown += '| Data Type | List (ms) | Array (ms) | Ratio (List/Array) |\n';
    markdown += '|-----------|-----------|------------|--------------------|\n';
    
    for (let i = 0; i < results.types.length; i++) {
      const type = results.types[i];
      const listTime = (data as any).list[i].toFixed(4);
      const arrayTime = (data as any).array[i].toFixed(4);
      const ratio = (data as any).ratio[i].toFixed(2);
      
      markdown += `| ${type} | ${listTime} | ${arrayTime} | ${ratio}x |\n`;
    }
    
    markdown += '\n';
  }
  
  // Add analysis
  markdown += '## Analysis\n\n';
  markdown += 'This section analyzes the performance of List vs. native arrays with different data types.\n\n';
  
  for (const [operation, data] of Object.entries(results.operations)) {
    markdown += `### ${operation} Operation\n\n`;
    
    // Find the type with the best ratio
    let bestRatioIndex = 0;
    let bestRatio = (data as any).ratio[0];
    
    for (let i = 1; i < results.types.length; i++) {
      if ((data as any).ratio[i] < bestRatio) {
        bestRatio = (data as any).ratio[i];
        bestRatioIndex = i;
      }
    }
    
    const bestType = results.types[bestRatioIndex];
    
    markdown += `- Best performance ratio: ${bestRatio.toFixed(2)}x with ${bestType}\n`;
    
    // Check if List outperforms Array for any type
    const outperformsIndex = (data as any).ratio.findIndex((r: number) => r <= 1);
    if (outperformsIndex >= 0) {
      markdown += `- List outperforms Array with ${results.types[outperformsIndex]}\n`;
    } else {
      markdown += `- List does not outperform Array with any tested data type\n`;
    }
    
    markdown += '\n';
  }
  
  // Save markdown report
  const markdownPath = path.join(reportsDir, `data-type-benchmark-${timestamp}.md`);
  fs.writeFileSync(markdownPath, markdown);
  console.log(`Markdown report saved to ${markdownPath}`);
}

/**
 * Main function
 */
export async function runDataTypeBenchmarkAndSave(): Promise<void> {
  console.log('Running Data Type Benchmark...');
  const results = await runDataTypeBenchmark();
  await saveDataTypeResults(results);
  console.log('Benchmark completed!');
}
