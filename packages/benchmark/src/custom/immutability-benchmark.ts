/**
 * Immutability Benchmark
 * 
 * Tests scenarios where immutability provides advantages
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

// Scenarios to test
const SCENARIOS = [
  'history_tracking',
  'structural_sharing',
  'memory_usage',
  'concurrent_access'
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
 * Measures the memory usage of a function
 */
function measureMemory(fn: () => any): number {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Measure memory before
  const memoryBefore = process.memoryUsage().heapUsed;

  // Run the function
  fn();

  // Measure memory after
  const memoryAfter = process.memoryUsage().heapUsed;

  return memoryAfter - memoryBefore;
}

/**
 * Creates a random array of the specified size
 */
function createRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
}

/**
 * Runs the immutability benchmark
 */
export async function runImmutabilityBenchmark(): Promise<any> {
  const results: any = {
    scenarios: SCENARIOS,
    metrics: {}
  };
  
  // Create test data
  const data = createRandomArray(SIZE);
  
  // Test each scenario
  for (const scenario of SCENARIOS) {
    console.log(`Benchmarking scenario: ${scenario}...`);
    
    switch (scenario) {
      case 'history_tracking': {
        // Test history tracking with List
        const listTime = measureTime(() => {
          const list = List.from(data);
          const history: any[] = [list];
          
          // Perform a series of operations and keep history
          for (let i = 0; i < 100; i++) {
            const index = Math.floor(Math.random() * SIZE);
            const newList = history[history.length - 1].set(index, 999);
            history.push(newList);
          }
          
          // Access a random historical version
          const randomHistoryIndex = Math.floor(Math.random() * history.length);
          return history[randomHistoryIndex];
        }, ITERATIONS);
        
        // Test history tracking with Array
        const arrayTime = measureTime(() => {
          const array = [...data];
          const history: any[] = [array];
          
          // Perform a series of operations and keep history
          for (let i = 0; i < 100; i++) {
            const index = Math.floor(Math.random() * SIZE);
            const newArray = [...history[history.length - 1]];
            newArray[index] = 999;
            history.push(newArray);
          }
          
          // Access a random historical version
          const randomHistoryIndex = Math.floor(Math.random() * history.length);
          return history[randomHistoryIndex];
        }, ITERATIONS);
        
        results.metrics[scenario] = {
          list: listTime,
          array: arrayTime,
          ratio: listTime / arrayTime
        };
        break;
      }
      
      case 'structural_sharing': {
        // Test structural sharing with List
        const listMemory = measureMemory(() => {
          const list = List.from(data);
          const lists: any[] = [];
          
          // Create 100 slightly modified versions
          for (let i = 0; i < 100; i++) {
            const index = Math.floor(Math.random() * SIZE);
            lists.push(list.set(index, 999));
          }
          
          return lists;
        });
        
        // Test structural sharing with Array
        const arrayMemory = measureMemory(() => {
          const array = [...data];
          const arrays: any[] = [];
          
          // Create 100 slightly modified versions
          for (let i = 0; i < 100; i++) {
            const index = Math.floor(Math.random() * SIZE);
            const newArray = [...array];
            newArray[index] = 999;
            arrays.push(newArray);
          }
          
          return arrays;
        });
        
        results.metrics[scenario] = {
          list: listMemory,
          array: arrayMemory,
          ratio: listMemory / arrayMemory
        };
        break;
      }
      
      case 'memory_usage': {
        // Test memory usage with List
        const listMemory = measureMemory(() => {
          const list = List.from(data);
          return list;
        });
        
        // Test memory usage with Array
        const arrayMemory = measureMemory(() => {
          const array = [...data];
          return array;
        });
        
        results.metrics[scenario] = {
          list: listMemory,
          array: arrayMemory,
          ratio: listMemory / arrayMemory
        };
        break;
      }
      
      case 'concurrent_access': {
        // Test concurrent access with List
        const listTime = measureTime(() => {
          const list = List.from(data);
          
          // Simulate concurrent operations
          const op1 = list.map(x => x * 2);
          const op2 = list.filter(x => x % 2 === 0);
          const op3 = list.reduce((acc, x) => acc + x, 0);
          
          return [op1, op2, op3];
        }, ITERATIONS);
        
        // Test concurrent access with Array
        const arrayTime = measureTime(() => {
          const array = [...data];
          
          // Simulate concurrent operations (with copying to avoid mutation)
          const op1 = [...array].map(x => x * 2);
          const op2 = [...array].filter(x => x % 2 === 0);
          const op3 = [...array].reduce((acc, x) => acc + x, 0);
          
          return [op1, op2, op3];
        }, ITERATIONS);
        
        results.metrics[scenario] = {
          list: listTime,
          array: arrayTime,
          ratio: listTime / arrayTime
        };
        break;
      }
    }
  }
  
  return results;
}

/**
 * Saves benchmark results to a file
 */
export async function saveImmutabilityResults(results: any): Promise<void> {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Save raw results as JSON
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const jsonPath = path.join(reportsDir, `immutability-benchmark-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Raw results saved to ${jsonPath}`);
  
  // Create markdown report
  let markdown = '# Immutability Benchmark Results\n\n';
  markdown += `Date: ${new Date().toISOString()}\n\n`;
  markdown += `This benchmark tests scenarios where immutability provides advantages (size: ${SIZE}).\n\n`;
  
  // Add results table
  markdown += '| Scenario | List | Array | Ratio (List/Array) | Metric |\n';
  markdown += '|----------|------|-------|-------------------|--------|\n';
  
  for (const scenario of results.scenarios) {
    const metric = results.metrics[scenario];
    const listValue = scenario === 'structural_sharing' || scenario === 'memory_usage'
      ? `${(metric.list / 1024 / 1024).toFixed(2)} MB`
      : `${metric.list.toFixed(4)} ms`;
    const arrayValue = scenario === 'structural_sharing' || scenario === 'memory_usage'
      ? `${(metric.array / 1024 / 1024).toFixed(2)} MB`
      : `${metric.array.toFixed(4)} ms`;
    const ratio = metric.ratio.toFixed(2);
    const metricType = scenario === 'structural_sharing' || scenario === 'memory_usage'
      ? 'Memory'
      : 'Time';
    
    markdown += `| ${scenario.replace(/_/g, ' ')} | ${listValue} | ${arrayValue} | ${ratio}x | ${metricType} |\n`;
  }
  
  markdown += '\n';
  
  // Add analysis
  markdown += '## Analysis\n\n';
  markdown += 'This section analyzes scenarios where immutability provides advantages.\n\n';
  
  // Analyze each scenario
  for (const scenario of results.scenarios) {
    const metric = results.metrics[scenario];
    const ratio = metric.ratio;
    
    markdown += `### ${scenario.replace(/_/g, ' ')}\n\n`;
    
    switch (scenario) {
      case 'history_tracking':
        if (ratio < 1) {
          markdown += `- List is ${(1 / ratio).toFixed(2)}x faster than Array for history tracking\n`;
          markdown += '- This demonstrates the advantage of immutable data structures for maintaining history\n';
        } else {
          markdown += `- List is ${ratio.toFixed(2)}x slower than Array for history tracking\n`;
          markdown += '- Despite theoretical advantages, the implementation overhead affects performance\n';
        }
        break;
      
      case 'structural_sharing':
        if (ratio < 1) {
          markdown += `- List uses ${(1 / ratio).toFixed(2)}x less memory than Array for multiple versions\n`;
          markdown += '- This demonstrates the memory efficiency of structural sharing in immutable data structures\n';
        } else {
          markdown += `- List uses ${ratio.toFixed(2)}x more memory than Array for multiple versions\n`;
          markdown += '- The overhead of the immutable data structure outweighs the benefits of structural sharing\n';
        }
        break;
      
      case 'memory_usage':
        if (ratio < 1) {
          markdown += `- List uses ${(1 / ratio).toFixed(2)}x less memory than Array for basic storage\n`;
          markdown += '- This suggests the internal representation is more memory-efficient\n';
        } else {
          markdown += `- List uses ${ratio.toFixed(2)}x more memory than Array for basic storage\n`;
          markdown += '- The additional metadata for immutability increases memory usage\n';
        }
        break;
      
      case 'concurrent_access':
        if (ratio < 1) {
          markdown += `- List is ${(1 / ratio).toFixed(2)}x faster than Array for concurrent operations\n`;
          markdown += '- This demonstrates the advantage of immutable data structures for concurrent access patterns\n';
        } else {
          markdown += `- List is ${ratio.toFixed(2)}x slower than Array for concurrent operations\n`;
          markdown += '- The overhead of creating new arrays for each operation affects performance\n';
        }
        break;
    }
    
    markdown += '\n';
  }
  
  // Save markdown report
  const markdownPath = path.join(reportsDir, `immutability-benchmark-${timestamp}.md`);
  fs.writeFileSync(markdownPath, markdown);
  console.log(`Markdown report saved to ${markdownPath}`);
}

/**
 * Main function
 */
export async function runImmutabilityBenchmarkAndSave(): Promise<void> {
  console.log('Running Immutability Benchmark...');
  const results = await runImmutabilityBenchmark();
  await saveImmutabilityResults(results);
  console.log('Benchmark completed!');
}
