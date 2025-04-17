/**
 * Stack data structure benchmarks
 *
 * @packageDocumentation
 */

import { Stack } from '@reduct/data-structures';
import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import { benchmark, generateRandomArray } from '../../utils';
import { compareStackWithNativeArrayAdapter } from './adapter-comparison';

/**
 * Runs benchmarks for the persistent Stack data structure
 *
 * @param size - Size of the stack to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function runStackBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const results: BenchmarkResult[] = [];

  // Create arrays for testing
  const array = generateRandomArray(size);
  const smallArray = generateRandomArray(10);

  // Create stacks for testing
  const stack = Stack.from(array);
  const smallStack = Stack.from(smallArray);

  // Construction benchmark
  results.push(
    benchmark(() => Stack.from(array), 'Stack', 'construction', size, options),
  );

  // Peek benchmark
  results.push(
    benchmark(
      () => {
        for (let i = 0; i < 1000; i++) {
          stack.peek();
        }
      },
      'Stack',
      'peek(1000x)',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Push benchmark
  results.push(
    benchmark(
      () => {
        let result = smallStack;
        for (let i = 0; i < 100; i++) {
          result = result.push(i);
        }
      },
      'Stack',
      'push(100x)',
      smallArray.length,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Pop benchmark
  results.push(
    benchmark(
      () => {
        let result = stack;
        for (let i = 0; i < 100; i++) {
          result = result.pop();
        }
      },
      'Stack',
      'pop(100x)',
      size,
      { ...options, iterations: Math.min(options.iterations || 100, 10) },
    ),
  );

  // Map benchmark
  results.push(
    benchmark(() => stack.map(x => x * 2), 'Stack', 'map', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  // Filter benchmark
  results.push(
    benchmark(() => stack.filter(x => x % 2 === 0), 'Stack', 'filter', size, {
      ...options,
      iterations: Math.min(options.iterations || 100, 10),
    }),
  );

  return {
    name: 'Stack Benchmarks',
    description: 'Performance benchmarks for the persistent Stack data structure',
    benchmarks: results,
  };
}

/**
 * Compares the Stack implementation with native JavaScript arrays
 *
 * @param size - Size of the data structures to test
 * @param options - Benchmark options
 * @returns Formatted benchmark results
 */
export function compareStackWithNativeArray(
  size: number = 10000,
  options: BenchmarkOptions = {},
): string {
  const array = generateRandomArray(size);
  const stack = Stack.from(array);

  const results: Record<string, BenchmarkResult> = {};

  // Construction
  results['Array.from'] = benchmark(() => Array.from(array), 'Array', 'construction', size, options);
  results['Stack.from'] = benchmark(() => Stack.from(array), 'Stack', 'construction', size, options);

  // Peek/access operation
  results['Array.at(-1)'] = benchmark(
    () => {
      for (let i = 0; i < 1000; i++) {
        array.at(-1);
      }
    },
    'Array',
    'at(-1)(1000x)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Stack.peek'] = benchmark(
    () => {
      for (let i = 0; i < 1000; i++) {
        stack.peek();
      }
    },
    'Stack',
    'peek(1000x)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Push operation (small scale)
  const smallArray = generateRandomArray(10);
  const smallStack = Stack.from(smallArray);

  results['Array.push'] = benchmark(
    () => {
      const arr = [...smallArray];
      for (let i = 0; i < 100; i++) {
        arr.push(i);
      }
    },
    'Array',
    'push(100x)',
    smallArray.length,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Stack.push'] = benchmark(
    () => {
      let s = smallStack;
      for (let i = 0; i < 100; i++) {
        s = s.push(i);
      }
    },
    'Stack',
    'push(100x)',
    smallArray.length,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Pop operation
  results['Array.pop'] = benchmark(
    () => {
      const arr = [...array];
      for (let i = 0; i < 100; i++) {
        arr.pop();
      }
    },
    'Array',
    'pop(100x)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Stack.pop'] = benchmark(
    () => {
      let s = stack;
      for (let i = 0; i < 100; i++) {
        s = s.pop();
      }
    },
    'Stack',
    'pop(100x)',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Map operation
  results['Array.map'] = benchmark(() => array.map(x => x * 2), 'Array', 'map', size, {
    ...options,
    iterations: Math.min(options.iterations || 100, 10),
  });

  results['Stack.map'] = benchmark(() => stack.map(x => x * 2), 'Stack', 'map', size, {
    ...options,
    iterations: Math.min(options.iterations || 100, 10),
  });

  // Filter operation
  results['Array.filter'] = benchmark(() => array.filter(x => x % 2 === 0), 'Array', 'filter', size, {
    ...options,
    iterations: Math.min(options.iterations || 100, 10),
  });

  results['Stack.filter'] = benchmark(() => stack.filter(x => x % 2 === 0), 'Stack', 'filter', size, {
    ...options,
    iterations: Math.min(options.iterations || 100, 10),
  });

  // Use the adapter-based implementation
  return compareStackWithNativeArrayAdapter(size, options);
}

/**
 * Measures how Stack operations scale with input size
 *
 * @param operation - The operation to test
 * @param maxSize - Maximum stack size to test
 * @param steps - Number of size increments to test
 * @param options - Benchmark options
 * @returns Scalability results
 */
export function measureStackScalability(
  operation: 'peek' | 'push' | 'pop' | 'map' | 'filter',
  maxSize: number = 100000,
  steps: number = 5,
  options: BenchmarkOptions = {},
): ScalabilityResult {
  const results: ScalabilityResult['results'] = [];

  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((maxSize / steps) * step);
    const array = generateRandomArray(size);
    const stack = Stack.from(array);

    let result: BenchmarkResult;

    switch (operation) {
      case 'peek':
        result = benchmark(
          () => {
            for (let i = 0; i < 1000; i++) {
              stack.peek();
            }
          },
          'Stack',
          'peek(1000x)',
          size,
          { ...options, iterations: Math.min(options.iterations || 100, 10) },
        );
        break;
      case 'push':
        result = benchmark(() => stack.push(999), 'Stack', 'push', size, options);
        break;
      case 'pop':
        result = benchmark(() => stack.pop(), 'Stack', 'pop', size, options);
        break;
      case 'map':
        result = benchmark(() => stack.map(x => x * 2), 'Stack', 'map', size, {
          ...options,
          iterations: Math.min(options.iterations || 100, 10),
        });
        break;
      case 'filter':
        result = benchmark(() => stack.filter(x => x % 2 === 0), 'Stack', 'filter', size, {
          ...options,
          iterations: Math.min(options.iterations || 100, 10),
        });
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    results.push({
      inputSize: size,
      timeMs: result.timeMs,
      opsPerSecond: result.opsPerSecond,
      memoryBytes: result.memoryBytes,
    });
  }

  return {
    implementation: 'Stack',
    operation,
    results,
  };
}
