/**
 * Searching Benchmark Plugin
 *
 * Provides benchmarks for searching algorithms.
 *
 * @packageDocumentation
 */

import { AdapterFactory } from '../adapter-factory';
import { BaseBenchmarkPlugin } from '../plugin';
import { BenchmarkOperation, BenchmarkSpecialCase } from '../types';

/**
 * Creates a random sorted array of the specified size
 *
 * @param size - Size of the array
 * @returns Sorted array of random numbers
 */
function createRandomSortedArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000)).sort((a, b) => a - b);
}

/**
 * Creates a sequential array of the specified size
 *
 * @param size - Size of the array
 * @returns Sequential array of numbers
 */
function createSequentialArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Creates an array with duplicates
 *
 * @param size - Size of the array
 * @returns Array with duplicates
 */
function createArrayWithDuplicates(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (size / 10))).sort((a, b) => a - b);
}

/**
 * Creates a large range array
 *
 * @param size - Size of the array
 * @returns Array with large range of values
 */
function createLargeRangeArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * size * 100)).sort((a, b) => a - b);
}

/**
 * Linear search implementation
 *
 * @param arr - Array to search
 * @param target - Target value
 * @returns Index of the target or -1 if not found
 */
function linearSearch<T>(arr: T[], target: T): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

/**
 * Binary search implementation
 *
 * @param arr - Sorted array to search
 * @param target - Target value
 * @returns Index of the target or -1 if not found
 */
function binarySearch<T>(arr: T[], target: T): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    }

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

/**
 * Interpolation search implementation
 *
 * @param arr - Sorted array of numbers to search
 * @param target - Target value
 * @returns Index of the target or -1 if not found
 */
function interpolationSearch(arr: number[], target: number): number {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high && target >= arr[low] && target <= arr[high]) {
    if (low === high) {
      if (arr[low] === target) {
        return low;
      }
      return -1;
    }

    // Calculate the position
    const pos = low + Math.floor(
      ((target - arr[low]) * (high - low)) / (arr[high] - arr[low])
    );

    if (arr[pos] === target) {
      return pos;
    }

    if (arr[pos] < target) {
      low = pos + 1;
    } else {
      high = pos - 1;
    }
  }

  return -1;
}

/**
 * Jump search implementation
 *
 * @param arr - Sorted array to search
 * @param target - Target value
 * @returns Index of the target or -1 if not found
 */
function jumpSearch<T>(arr: T[], target: T): number {
  const n = arr.length;
  let step = Math.floor(Math.sqrt(n));

  let prev = 0;
  while (arr[Math.min(step, n) - 1] < target) {
    prev = step;
    step += Math.floor(Math.sqrt(n));
    if (prev >= n) {
      return -1;
    }
  }

  while (arr[prev] < target) {
    prev++;
    if (prev === Math.min(step, n)) {
      return -1;
    }
  }

  if (arr[prev] === target) {
    return prev;
  }

  return -1;
}

/**
 * Exponential search implementation
 *
 * @param arr - Sorted array to search
 * @param target - Target value
 * @returns Index of the target or -1 if not found
 */
function exponentialSearch<T>(arr: T[], target: T): number {
  const n = arr.length;

  if (arr[0] === target) {
    return 0;
  }

  let i = 1;
  while (i < n && arr[i] <= target) {
    i *= 2;
  }

  return binarySearchBounded(arr, target, i / 2, Math.min(i, n - 1));
}

/**
 * Binary search within bounds
 *
 * @param arr - Sorted array to search
 * @param target - Target value
 * @param left - Left bound
 * @param right - Right bound
 * @returns Index of the target or -1 if not found
 */
function binarySearchBounded<T>(arr: T[], target: T, left: number, right: number): number {
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    }

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

/**
 * Native indexOf implementation
 *
 * @param arr - Array to search
 * @param target - Target value
 * @returns Index of the target or -1 if not found
 */
function nativeIndexOf<T>(arr: T[], target: T): number {
  return arr.indexOf(target);
}

/**
 * Searching benchmark plugin
 */
export class SearchingBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'searching-benchmark-plugin';
  description = 'Provides benchmarks for searching algorithms';

  /**
   * Register searching benchmarks
   */
  register(): void {
    // Register adapters for searching algorithms
    this.registerSearchingAdapters();

    // Register searching benchmark definition
    this.registerBenchmark(
      this.createBenchmarkDefinition(
        'searching',
        'Searching Benchmarks',
        'algorithm',
        this.createSearchingOperations(),
        {
          description: 'Benchmarks for searching algorithms',
          setupFn: createRandomSortedArray,
          specialCases: this.createSearchingSpecialCases(),
          defaultInputSizes: [100, 1000, 10000],
          defaultIterations: 1000,
          tags: ['searching', 'algorithm'],
          examples: [
            'benchmark searching --operations linear-search,binary-search,native-indexOf',
            'benchmark searching --special-case sequential',
            'benchmark searching --input-sizes 100,1000,10000'
          ]
        }
      )
    );
  }

  /**
   * Register adapters for searching algorithms
   */
  private registerSearchingAdapters(): void {
    // For each adapter, we need to create a wrapper that generates a random target
    // This is because the benchmark system will call the adapter with just the instance

    AdapterFactory.registerAdapter('searching', 'linear-search', (arr: any[]) => {
      const target = arr[Math.floor(Math.random() * arr.length)];
      return linearSearch(arr, target);
    });

    AdapterFactory.registerAdapter('searching', 'binary-search', (arr: any[]) => {
      const target = arr[Math.floor(Math.random() * arr.length)];
      return binarySearch(arr, target);
    });

    AdapterFactory.registerAdapter('searching', 'interpolation-search', (arr: number[]) => {
      const target = arr[Math.floor(Math.random() * arr.length)];
      return interpolationSearch(arr, target);
    });

    AdapterFactory.registerAdapter('searching', 'jump-search', (arr: any[]) => {
      const target = arr[Math.floor(Math.random() * arr.length)];
      return jumpSearch(arr, target);
    });

    AdapterFactory.registerAdapter('searching', 'exponential-search', (arr: any[]) => {
      const target = arr[Math.floor(Math.random() * arr.length)];
      return exponentialSearch(arr, target);
    });

    AdapterFactory.registerAdapter('searching', 'native-indexOf', (arr: any[]) => {
      const target = arr[Math.floor(Math.random() * arr.length)];
      return nativeIndexOf(arr, target);
    });
  }

  /**
   * Create searching operations
   *
   * @returns Array of searching operations
   */
  private createSearchingOperations(): BenchmarkOperation[] {
    const operations: BenchmarkOperation[] = [];

    operations.push(this.createOperation(
      'linear-search',
      AdapterFactory.getAdapter('searching', 'linear-search')!,
      'Linear search algorithm (O(n))'
    ));

    operations.push(this.createOperation(
      'binary-search',
      AdapterFactory.getAdapter('searching', 'binary-search')!,
      'Binary search algorithm (O(log n))'
    ));

    operations.push(this.createOperation(
      'interpolation-search',
      AdapterFactory.getAdapter('searching', 'interpolation-search')!,
      'Interpolation search algorithm (O(log log n) average, O(n) worst case)'
    ));

    operations.push(this.createOperation(
      'jump-search',
      AdapterFactory.getAdapter('searching', 'jump-search')!,
      'Jump search algorithm (O(√n))'
    ));

    operations.push(this.createOperation(
      'exponential-search',
      AdapterFactory.getAdapter('searching', 'exponential-search')!,
      'Exponential search algorithm (O(log n))'
    ));

    operations.push(this.createOperation(
      'native-indexOf',
      AdapterFactory.getAdapter('searching', 'native-indexOf')!,
      'Native JavaScript indexOf implementation'
    ));

    return operations;
  }

  /**
   * Create special cases for searching benchmarks
   *
   * @returns Array of special cases
   */
  private createSearchingSpecialCases(): BenchmarkSpecialCase[] {
    return [
      this.createSpecialCase(
        'random-sorted',
        createRandomSortedArray,
        'Random sorted array of numbers'
      ),
      this.createSpecialCase(
        'sequential',
        createSequentialArray,
        'Sequential array of numbers'
      ),
      this.createSpecialCase(
        'with-duplicates',
        createArrayWithDuplicates,
        'Array with many duplicate values'
      ),
      this.createSpecialCase(
        'large-range',
        createLargeRangeArray,
        'Array with large range of values'
      )
    ];
  }
}
