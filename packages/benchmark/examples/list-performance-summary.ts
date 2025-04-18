/**
 * List Performance Summary
 * 
 * Runs key benchmarks to compare List vs native arrays
 * and displays the results in a simple format.
 */

import { List } from '@reduct/data-structures';
import { performance } from 'perf_hooks';

// Define input sizes to test
const inputSizes = [10, 100, 1000, 10000, 100000];

// Define operations to benchmark
const operations = [
  {
    name: 'prepend',
    listFn: (list: any) => list.prepend(999),
    arrayFn: (arr: any) => [999, ...arr]
  },
  {
    name: 'append',
    listFn: (list: any) => list.append(999),
    arrayFn: (arr: any) => [...arr, 999]
  },
  {
    name: 'map',
    listFn: (list: any) => list.map((x: number) => x * 2),
    arrayFn: (arr: any) => arr.map((x: number) => x * 2)
  },
  {
    name: 'filter',
    listFn: (list: any) => list.filter((x: number) => x % 2 === 0),
    arrayFn: (arr: any) => arr.filter((x: number) => x % 2 === 0)
  },
  {
    name: 'reduce',
    listFn: (list: any) => list.reduce((acc: number, x: number) => acc + x, 0),
    arrayFn: (arr: any) => arr.reduce((acc: number, x: number) => acc + x, 0)
  },
  {
    name: 'mapFilterReduce',
    listFn: (list: any) => list.mapFilterReduce(
      (x: number) => x * 2,
      (x: number) => x % 3 === 0,
      (acc: number, x: number) => acc + x,
      0
    ),
    arrayFn: (arr: any) => arr
      .map((x: number) => x * 2)
      .filter((x: number) => x % 3 === 0)
      .reduce((acc: number, x: number) => acc + x, 0)
  }
];

// Number of iterations for each benchmark
const iterations = 100;
const warmupIterations = 5;

// Run benchmarks
async function runBenchmarks() {
  console.log('# List vs Array Performance Summary\n');
  console.log('Operation | Size | List (ops/sec) | Array (ops/sec) | Ratio');
  console.log('----------|------|----------------|-----------------|------');
  
  for (const operation of operations) {
    for (const size of inputSizes) {
      // Create test data
      const list = List.of(size, i => i);
      const array = Array.from({ length: size }, (_, i) => i);
      
      // Warm up
      for (let i = 0; i < warmupIterations; i++) {
        operation.listFn(list);
        operation.arrayFn(array);
      }
      
      // Benchmark List
      const listStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        operation.listFn(list);
      }
      const listEnd = performance.now();
      const listTime = listEnd - listStart;
      const listOpsPerSec = Math.floor(iterations / (listTime / 1000));
      
      // Benchmark Array
      const arrayStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        operation.arrayFn(array);
      }
      const arrayEnd = performance.now();
      const arrayTime = arrayEnd - arrayStart;
      const arrayOpsPerSec = Math.floor(iterations / (arrayTime / 1000));
      
      // Calculate ratio
      const ratio = listOpsPerSec / arrayOpsPerSec;
      const ratioStr = ratio >= 1 
        ? `${ratio.toFixed(2)}x faster` 
        : `${(1 / ratio).toFixed(2)}x slower`;
      
      // Print results
      console.log(`${operation.name} | ${size.toLocaleString()} | ${listOpsPerSec.toLocaleString()} | ${arrayOpsPerSec.toLocaleString()} | ${ratioStr}`);
    }
    console.log('----------|------|----------------|-----------------|------');
  }
}

runBenchmarks().catch(console.error);
