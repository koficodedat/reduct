/**
 * Stack data structure benchmarks
 *
 * @packageDocumentation
 */

// TODO: Import Stack when it's implemented
// import { Stack } from '@reduct/data-structures';

/**
 * Temporary Stack implementation for benchmarking
 */
export class Stack<T> {
  private readonly _data: T[];

  constructor(data: T[] = []) {
    this._data = data;
  }

  static empty<T>(): Stack<T> {
    return new Stack<T>();
  }

  static from<T>(elements: T[]): Stack<T> {
    return new Stack<T>([...elements]);
  }

  get size(): number {
    return this._data.length;
  }

  get isEmpty(): boolean {
    return this._data.length === 0;
  }

  peek(): T | undefined {
    return this._data[this._data.length - 1];
  }

  push(value: T): Stack<T> {
    return new Stack<T>([...this._data, value]);
  }

  pop(): Stack<T> {
    if (this._data.length === 0) {
      return this;
    }
    return new Stack<T>(this._data.slice(0, -1));
  }

  map<U>(fn: (value: T, index: number) => U): Stack<U> {
    return new Stack<U>(this._data.map(fn));
  }

  filter(fn: (value: T, index: number) => boolean): Stack<T> {
    return new Stack<T>(this._data.filter(fn));
  }
}
import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import { benchmark, generateRandomArray } from '../../utils';

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
