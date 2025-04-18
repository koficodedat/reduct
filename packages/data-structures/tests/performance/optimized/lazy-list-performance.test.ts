import { describe, it, expect } from 'vitest';
import { List } from '../../../src/list';
import { OptimizedList } from '../../../src/optimized/list';
import { LazyList } from '../../../src/optimized/lazy-list';

/**
 * Measures the time taken to execute a function
 */
function measure<T>(fn: () => T): [T, number] {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return [result, end - start];
}

/**
 * Runs a benchmark for a specific operation
 */
function runBenchmark<T, U, V, W>(
  name: string,
  originalFn: () => T,
  optimizedFn: () => U,
  lazyFn: () => V,
  nativeFn: () => W,
  iterations: number = 5
): void {
  let originalTotal = 0;
  let optimizedTotal = 0;
  let lazyTotal = 0;
  let nativeTotal = 0;

  for (let i = 0; i < iterations; i++) {
    const [, originalTime] = measure(originalFn);
    const [, optimizedTime] = measure(optimizedFn);
    const [, lazyTime] = measure(lazyFn);
    const [, nativeTime] = measure(nativeFn);

    originalTotal += originalTime;
    optimizedTotal += optimizedTime;
    lazyTotal += lazyTime;
    nativeTotal += nativeTime;
  }

  const originalAvg = originalTotal / iterations;
  const optimizedAvg = optimizedTotal / iterations;
  const lazyAvg = lazyTotal / iterations;
  const nativeAvg = nativeTotal / iterations;

  const optimizedImprovement = ((originalAvg - optimizedAvg) / originalAvg) * 100;
  const lazyImprovement = ((originalAvg - lazyAvg) / originalAvg) * 100;
  const lazyVsOptimized = ((optimizedAvg - lazyAvg) / optimizedAvg) * 100;
  const nativeComparison = ((nativeAvg - lazyAvg) / nativeAvg) * 100;

  console.log(`${name}:`);
  console.log(`  Original: ${originalAvg.toFixed(3)} ms`);
  console.log(`  Optimized: ${optimizedAvg.toFixed(3)} ms`);
  console.log(`  Lazy: ${lazyAvg.toFixed(3)} ms`);
  console.log(`  Native: ${nativeAvg.toFixed(3)} ms`);
  console.log(`  Improvement over original: ${optimizedImprovement.toFixed(2)}%`);
  console.log(`  Lazy improvement over original: ${lazyImprovement.toFixed(2)}%`);
  console.log(`  Lazy improvement over optimized: ${lazyVsOptimized.toFixed(2)}%`);
  console.log(`  Lazy comparison to native: ${nativeComparison.toFixed(2)}%`);
  console.log();
}

describe('LazyList Performance', () => {
  // Skip these tests in CI environments
  if (process.env.CI) {
    it('skips performance tests in CI', () => {
      expect(true).toBe(true);
    });
    return;
  }

  describe('map operation', () => {
    it('should compare map performance', () => {
      const sizes = [100, 1000, 10000];
      
      for (const size of sizes) {
        console.log(`\n=== Map performance for size ${size} ===`);
        
        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const lazyList = LazyList.fromArray(array);
        
        runBenchmark(
          'Map',
          () => originalList.map(x => x * 2),
          () => optimizedList.map(x => x * 2),
          () => lazyList.map(x => x * 2).toArray(),
          () => array.map(x => x * 2)
        );
      }
    });
  });

  describe('filter operation', () => {
    it('should compare filter performance', () => {
      const sizes = [100, 1000, 10000];
      
      for (const size of sizes) {
        console.log(`\n=== Filter performance for size ${size} ===`);
        
        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const lazyList = LazyList.fromArray(array);
        
        runBenchmark(
          'Filter',
          () => originalList.filter(x => x % 2 === 0),
          () => optimizedList.filter(x => x % 2 === 0),
          () => lazyList.filter(x => x % 2 === 0).toArray(),
          () => array.filter(x => x % 2 === 0)
        );
      }
    });
  });

  describe('reduce operation', () => {
    it('should compare reduce performance', () => {
      const sizes = [100, 1000, 10000];
      
      for (const size of sizes) {
        console.log(`\n=== Reduce performance for size ${size} ===`);
        
        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const lazyList = LazyList.fromArray(array);
        
        runBenchmark(
          'Reduce',
          () => originalList.reduce((acc, x) => acc + x, 0),
          () => optimizedList.reduce((acc, x) => acc + x, 0),
          () => lazyList.reduce((acc, x) => acc + x, 0),
          () => array.reduce((acc, x) => acc + x, 0)
        );
      }
    });
  });

  describe('chained operations', () => {
    it('should compare performance for a sequence of operations', () => {
      const sizes = [100, 1000, 10000];
      
      for (const size of sizes) {
        console.log(`\n=== Chained operations performance for size ${size} ===`);
        
        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const lazyList = LazyList.fromArray(array);
        
        runBenchmark(
          'Map + Filter + Reduce',
          () => originalList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => optimizedList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => lazyList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => array
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0)
        );
      }
    });
  });
});
