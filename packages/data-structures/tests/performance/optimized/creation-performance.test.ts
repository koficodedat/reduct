import { describe, it, expect } from 'vitest';
import { List } from '../../../src/list';
import { OptimizedList } from '../../../src/optimized/list';
import { PersistentVector } from '../../../src/optimized/persistent-vector';

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
function runBenchmark<T, U, V>(
  name: string,
  originalFn: () => T,
  optimizedFn: () => U,
  nativeFn: () => V,
  iterations: number = 5
): void {
  let originalTotal = 0;
  let optimizedTotal = 0;
  let nativeTotal = 0;

  for (let i = 0; i < iterations; i++) {
    const [, originalTime] = measure(originalFn);
    const [, optimizedTime] = measure(optimizedFn);
    const [, nativeTime] = measure(nativeFn);

    originalTotal += originalTime;
    optimizedTotal += optimizedTime;
    nativeTotal += nativeTime;
  }

  const originalAvg = originalTotal / iterations;
  const optimizedAvg = optimizedTotal / iterations;
  const nativeAvg = nativeTotal / iterations;

  const optimizedImprovement = ((originalAvg - optimizedAvg) / originalAvg) * 100;
  const nativeComparison = ((nativeAvg - optimizedAvg) / nativeAvg) * 100;

  console.log(`${name}:`);
  console.log(`  Original: ${originalAvg.toFixed(3)} ms`);
  console.log(`  Optimized: ${optimizedAvg.toFixed(3)} ms`);
  console.log(`  Native: ${nativeAvg.toFixed(3)} ms`);
  console.log(`  Improvement over original: ${optimizedImprovement.toFixed(2)}%`);
  console.log(`  Comparison to native: ${nativeComparison.toFixed(2)}%`);
  console.log();
}

describe('Creation Performance', () => {
  // Skip these tests in CI environments
  if (process.env.CI) {
    it('skips performance tests in CI', () => {
      expect(true).toBe(true);
    });
    return;
  }

  describe('creation from array', () => {
    it('should compare creation performance for different sizes', () => {
      const sizes = [100, 1000, 10000, 100000];
      
      for (const size of sizes) {
        console.log(`\n=== Creation performance for size ${size} ===`);
        
        const array = Array.from({ length: size }, (_, i) => i);
        
        runBenchmark(
          'Creation',
          () => List.from(array),
          () => OptimizedList.from(array),
          () => [...array]
        );
      }
    });
  });

  describe('vector creation', () => {
    it('should compare PersistentVector creation performance', () => {
      const sizes = [100, 1000, 10000, 100000];
      
      for (const size of sizes) {
        console.log(`\n=== PersistentVector creation performance for size ${size} ===`);
        
        const array = Array.from({ length: size }, (_, i) => i);
        
        runBenchmark(
          'Vector Creation',
          () => {
            // Simulate the old approach (one by one)
            let vector = PersistentVector.empty<number>();
            for (const element of array) {
              vector = vector.append(element);
            }
            return vector;
          },
          () => PersistentVector.from(array),
          () => [...array]
        );
      }
    });
  });
});
