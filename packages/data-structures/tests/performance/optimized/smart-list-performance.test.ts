import { describe, it, expect } from 'vitest';
import { List } from '../../../src/list';
import { OptimizedList } from '../../../src/optimized/list';
import { SmartList } from '../../../src/optimized/smart-list';

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
  smartFn: () => V,
  nativeFn: () => W,
  iterations: number = 5
): void {
  let originalTotal = 0;
  let optimizedTotal = 0;
  let smartTotal = 0;
  let nativeTotal = 0;

  for (let i = 0; i < iterations; i++) {
    const [, originalTime] = measure(originalFn);
    const [, optimizedTime] = measure(optimizedFn);
    const [, smartTime] = measure(smartFn);
    const [, nativeTime] = measure(nativeFn);

    originalTotal += originalTime;
    optimizedTotal += optimizedTime;
    smartTotal += smartTime;
    nativeTotal += nativeTime;
  }

  const originalAvg = originalTotal / iterations;
  const optimizedAvg = optimizedTotal / iterations;
  const smartAvg = smartTotal / iterations;
  const nativeAvg = nativeTotal / iterations;

  const optimizedImprovement = ((originalAvg - optimizedAvg) / originalAvg) * 100;
  const smartImprovement = ((originalAvg - smartAvg) / originalAvg) * 100;
  const smartVsOptimized = ((optimizedAvg - smartAvg) / optimizedAvg) * 100;
  const smartVsNative = ((nativeAvg - smartAvg) / nativeAvg) * 100;

  console.log(`${name}:`);
  console.log(`  Original: ${originalAvg.toFixed(3)} ms`);
  console.log(`  Optimized: ${optimizedAvg.toFixed(3)} ms`);
  console.log(`  Smart: ${smartAvg.toFixed(3)} ms`);
  console.log(`  Native: ${nativeAvg.toFixed(3)} ms`);
  console.log(`  Improvement over original: ${optimizedImprovement.toFixed(2)}%`);
  console.log(`  Smart improvement over original: ${smartImprovement.toFixed(2)}%`);
  console.log(`  Smart improvement over optimized: ${smartVsOptimized.toFixed(2)}%`);
  console.log(`  Smart comparison to native: ${smartVsNative.toFixed(2)}%`);
  console.log();
}

describe('SmartList Performance', () => {
  // Skip these tests in CI environments
  if (process.env.CI) {
    it('skips performance tests in CI', () => {
      expect(true).toBe(true);
    });
    return;
  }

  describe('creation from array', () => {
    it('should compare creation performance for different sizes', () => {
      const sizes = [10, 100, 1000, 10000, 100000];

      for (const size of sizes) {
        console.log(`\n=== Creation performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);

        runBenchmark(
          'Creation',
          () => List.from(array),
          () => OptimizedList.from(array),
          () => SmartList.from(array),
          () => [...array]
        );
      }
    });
  });

  describe('map operation', () => {
    it('should compare map performance', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Map performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        runBenchmark(
          'Map',
          () => originalList.map(x => x * 2),
          () => optimizedList.map(x => x * 2),
          () => smartList.map(x => x * 2),
          () => array.map(x => x * 2)
        );
      }
    });
  });

  describe('filter operation', () => {
    it('should compare filter performance', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Filter performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        runBenchmark(
          'Filter',
          () => originalList.filter(x => x % 2 === 0),
          () => optimizedList.filter(x => x % 2 === 0),
          () => smartList.filter(x => x % 2 === 0),
          () => array.filter(x => x % 2 === 0)
        );
      }
    });
  });

  describe('reduce operation', () => {
    it('should compare reduce performance', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Reduce performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        runBenchmark(
          'Reduce',
          () => originalList.reduce((acc, x) => acc + x, 0),
          () => optimizedList.reduce((acc, x) => acc + x, 0),
          () => smartList.reduce((acc, x) => acc + x, 0),
          () => array.reduce((acc, x) => acc + x, 0)
        );
      }
    });
  });

  describe('chained operations', () => {
    it('should compare performance for a sequence of operations', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Chained operations performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        runBenchmark(
          'Map + Filter + Reduce (separate calls)',
          () => originalList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => optimizedList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => smartList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => array
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0)
        );

        // Test specialized method for chained operations
        runBenchmark(
          'Map + Filter + Reduce (specialized)',
          () => originalList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => optimizedList
            .map(x => x * 2)
            .filter(x => x % 4 === 0)
            .reduce((acc, x) => acc + x, 0),
          () => smartList
            .mapFilterReduce(
              x => x * 2,
              x => x % 4 === 0,
              (acc, x) => acc + x,
              0
            ),
          () => {
            // Optimized native implementation without intermediate arrays
            let sum = 0;
            for (let i = 0; i < array.length; i++) {
              const mapped = array[i] * 2;
              if (mapped % 4 === 0) {
                sum += mapped;
              }
            }
            return sum;
          }
        );
      }
    });
  });

  describe('append operation', () => {
    it('should compare append performance', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Append performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        runBenchmark(
          'Append',
          () => originalList.append(999),
          () => optimizedList.append(999),
          () => smartList.append(999),
          () => [...array, 999]
        );
      }
    });
  });

  describe('prepend operation', () => {
    it('should compare prepend performance', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Prepend performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        runBenchmark(
          'Prepend',
          () => originalList.prepend(999),
          () => optimizedList.prepend(999),
          () => smartList.prepend(999),
          () => [999, ...array]
        );
      }
    });
  });

  describe('get operation', () => {
    it('should compare get performance', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Get performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        const index = Math.floor(size / 2);

        runBenchmark(
          'Get',
          () => originalList.get(index),
          () => optimizedList.get(index),
          () => smartList.get(index),
          () => array[index]
        );
      }
    });
  });

  describe('set operation', () => {
    it('should compare set performance', () => {
      const sizes = [10, 100, 1000, 10000];

      for (const size of sizes) {
        console.log(`\n=== Set performance for size ${size} ===`);

        const array = Array.from({ length: size }, (_, i) => i);
        const originalList = List.from(array);
        const optimizedList = OptimizedList.from(array);
        const smartList = SmartList.from(array);

        const index = Math.floor(size / 2);

        runBenchmark(
          'Set',
          () => originalList.set(index, 999),
          () => optimizedList.set(index, 999),
          () => smartList.set(index, 999),
          () => {
            const newArray = [...array];
            newArray[index] = 999;
            return newArray;
          }
        );
      }
    });
  });
});
