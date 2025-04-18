/**
 * Sorting algorithm benchmarks
 *
 * @packageDocumentation
 */

// TODO: Import sorting algorithms when they're implemented
// import {
//   quickSort,
//   mergeSort,
//   heapSort,
//   functionalQuickSort,
//   bottomUpMergeSort,
//   functionalHeapSort,
// } from '@reduct/algorithms';

/**
 * Temporary sorting algorithm implementations for benchmarking
 */

// Quick sort implementation
export function quickSort(arr: readonly number[]): number[] {
  if (arr.length <= 1) return [...arr];

  const copy = [...arr];
  const pivot = copy[Math.floor(copy.length / 2)];
  const left = copy.filter(x => x < pivot);
  const middle = copy.filter(x => x === pivot);
  const right = copy.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// Merge sort implementation
export function mergeSort(arr: readonly number[]): number[] {
  if (arr.length <= 1) return [...arr];

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}

// Heap sort implementation
export function heapSort(arr: readonly number[]): number[] {
  const copy = [...arr];
  const n = copy.length;

  // Build heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(copy, n, i);
  }

  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    [copy[0], copy[i]] = [copy[i], copy[0]];
    heapify(copy, i, 0);
  }

  return copy;
}

function heapify(arr: number[], n: number, i: number): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n && arr[left] > arr[largest]) {
    largest = left;
  }

  if (right < n && arr[right] > arr[largest]) {
    largest = right;
  }

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}

// Functional quick sort implementation
export function functionalQuickSort(arr: readonly number[]): number[] {
  if (arr.length <= 1) return [...arr];

  const [pivot, ...rest] = arr;
  const left = rest.filter(x => x <= pivot);
  const right = rest.filter(x => x > pivot);

  return [...functionalQuickSort(left), pivot, ...functionalQuickSort(right)];
}

// Bottom-up merge sort implementation
export function bottomUpMergeSort(arr: readonly number[]): number[] {
  const copy = [...arr];
  const n = copy.length;

  for (let width = 1; width < n; width *= 2) {
    for (let i = 0; i < n; i += 2 * width) {
      const left = i;
      const mid = Math.min(i + width, n);
      const right = Math.min(i + 2 * width, n);

      mergeInPlace(copy, left, mid, right);
    }
  }

  return copy;
}

function mergeInPlace(arr: number[], left: number, mid: number, right: number): void {
  const leftArr = arr.slice(left, mid);
  const rightArr = arr.slice(mid, right);

  let i = 0, j = 0, k = left;

  while (i < leftArr.length && j < rightArr.length) {
    if (leftArr[i] <= rightArr[j]) {
      arr[k++] = leftArr[i++];
    } else {
      arr[k++] = rightArr[j++];
    }
  }

  while (i < leftArr.length) {
    arr[k++] = leftArr[i++];
  }

  while (j < rightArr.length) {
    arr[k++] = rightArr[j++];
  }
}

// Functional heap sort implementation
export function functionalHeapSort(arr: readonly number[]): number[] {
  const copy = [...arr];
  return extractMax(buildHeap(copy));
}

function buildHeap(arr: number[]): number[] {
  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    arr = siftDown(arr, i, n);
  }
  return arr;
}

function siftDown(arr: number[], i: number, size: number): number[] {
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  let largest = i;

  if (left < size && arr[left] > arr[largest]) {
    largest = left;
  }

  if (right < size && arr[right] > arr[largest]) {
    largest = right;
  }

  if (largest !== i) {
    const newArr = [...arr];
    [newArr[i], newArr[largest]] = [newArr[largest], newArr[i]];
    return siftDown(newArr, largest, size);
  }

  return arr;
}

function extractMax(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const result: number[] = [];
  let heap = [...arr];

  while (heap.length > 0) {
    result.unshift(heap[0]);
    heap[0] = heap[heap.length - 1];
    heap.pop();
    if (heap.length > 0) {
      heap = siftDown(heap, 0, heap.length);
    }
  }

  return result;
}

import { BenchmarkOptions, BenchmarkResult, BenchmarkSuite, ScalabilityResult } from '../../types';
import {
  benchmark,
  generateRandomArray,
  generateSortedArray,
  generateReverseSortedArray,
  generatePartiallySortedArray,
} from '../../utils';

/**
 * Runs benchmarks on all sorting algorithms using a random array
 *
 * @param size - Size of the array to test
 * @param options - Benchmark options
 * @returns Benchmark suite with results
 */
export function runSortingBenchmarks(
  size: number = 10000,
  options: BenchmarkOptions = {},
): BenchmarkSuite {
  const array = generateRandomArray(size);

  const results: Record<string, BenchmarkResult> = {};

  // Benchmark each sorting algorithm
  results['quickSort'] = benchmark(
    () => quickSort([...array]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['mergeSort'] = benchmark(
    () => mergeSort([...array]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['heapSort'] = benchmark(
    () => heapSort([...array]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['functionalQuickSort'] = benchmark(
    () => functionalQuickSort([...array]),
    'functionalQuickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['functionalHeapSort'] = benchmark(
    () => functionalHeapSort([...array]),
    'functionalHeapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['bottomUpMergeSort'] = benchmark(
    () => bottomUpMergeSort([...array]),
    'bottomUpMergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  results['Array.sort'] = benchmark(
    () => [...array].sort((a, b) => a - b),
    'Array.sort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  return {
    name: 'Sorting Algorithm Benchmarks',
    description: 'Performance benchmarks for various sorting algorithms',
    benchmarks: Object.values(results),
  };
}

/**
 * Runs benchmarks on sorting algorithms with different array types
 *
 * @param size - Size of the arrays to test
 * @param options - Benchmark options
 * @returns Object with results for each array type
 */
export function runSortingBenchmarkSuite(
  size: number = 10000,
  options: BenchmarkOptions = {},
): {
  random: BenchmarkSuite;
  sorted: BenchmarkSuite;
  reversed: BenchmarkSuite;
  partiallySorted: BenchmarkSuite;
} {
  // Generate different array types
  const randomArray = generateRandomArray(size);
  const sortedArray = generateSortedArray(size);
  const reversedArray = generateReverseSortedArray(size);
  const partiallySortedArray = generatePartiallySortedArray(size);

  // Benchmark with random array
  const randomResults: Record<string, BenchmarkResult> = {};
  randomResults['quickSort'] = benchmark(
    () => quickSort([...randomArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  randomResults['mergeSort'] = benchmark(
    () => mergeSort([...randomArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  randomResults['heapSort'] = benchmark(
    () => heapSort([...randomArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Benchmark with sorted array
  const sortedResults: Record<string, BenchmarkResult> = {};
  sortedResults['quickSort'] = benchmark(
    () => quickSort([...sortedArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  sortedResults['mergeSort'] = benchmark(
    () => mergeSort([...sortedArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  sortedResults['heapSort'] = benchmark(
    () => heapSort([...sortedArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Benchmark with reversed array
  const reversedResults: Record<string, BenchmarkResult> = {};
  reversedResults['quickSort'] = benchmark(
    () => quickSort([...reversedArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  reversedResults['mergeSort'] = benchmark(
    () => mergeSort([...reversedArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  reversedResults['heapSort'] = benchmark(
    () => heapSort([...reversedArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  // Benchmark with partially sorted array
  const partiallySortedResults: Record<string, BenchmarkResult> = {};
  partiallySortedResults['quickSort'] = benchmark(
    () => quickSort([...partiallySortedArray]),
    'quickSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  partiallySortedResults['mergeSort'] = benchmark(
    () => mergeSort([...partiallySortedArray]),
    'mergeSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );
  partiallySortedResults['heapSort'] = benchmark(
    () => heapSort([...partiallySortedArray]),
    'heapSort',
    'sort',
    size,
    { ...options, iterations: Math.min(options.iterations || 100, 10) },
  );

  return {
    random: {
      name: 'Sorting Benchmarks (Random Array)',
      description: 'Performance benchmarks for sorting algorithms with random data',
      benchmarks: Object.values(randomResults),
    },
    sorted: {
      name: 'Sorting Benchmarks (Sorted Array)',
      description: 'Performance benchmarks for sorting algorithms with already sorted data',
      benchmarks: Object.values(sortedResults),
    },
    reversed: {
      name: 'Sorting Benchmarks (Reversed Array)',
      description: 'Performance benchmarks for sorting algorithms with reverse-sorted data',
      benchmarks: Object.values(reversedResults),
    },
    partiallySorted: {
      name: 'Sorting Benchmarks (Partially Sorted Array)',
      description: 'Performance benchmarks for sorting algorithms with partially sorted data',
      benchmarks: Object.values(partiallySortedResults),
    },
  };
}

/**
 * Measures how sorting algorithm performance scales with input size
 *
 * @param algorithm - The sorting algorithm to benchmark
 * @param maxSize - Maximum array size to test
 * @param steps - Number of size increments to test
 * @param options - Benchmark options
 * @returns Scalability results
 */
export function measureSortingScalability(
  algorithm: (items: readonly number[]) => number[],
  algorithmName: string,
  maxSize: number = 100000,
  steps: number = 5,
  options: BenchmarkOptions = {},
): ScalabilityResult {
  const results: ScalabilityResult['results'] = [];

  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((maxSize / steps) * step);
    const array = generateRandomArray(size);

    const result = benchmark(
      () => algorithm([...array]),
      algorithmName,
      'sort',
      size,
      {
        ...options,
        iterations: Math.max(1, Math.min(options.iterations || 100, Math.floor(1000 / size))),
      },
    );

    results.push({
      inputSize: size,
      timeMs: result.timeMs,
      opsPerSecond: result.opsPerSecond,
      memoryBytes: result.memoryBytes,
    });
  }

  return {
    implementation: algorithmName,
    operation: 'sort',
    results,
  };
}
