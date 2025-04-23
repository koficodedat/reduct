/**
 * Sorting Benchmark Plugin
 * 
 * Provides benchmarks for sorting algorithms.
 * 
 * @packageDocumentation
 */

import { AdapterFactory } from '../adapter-factory';
import { BaseBenchmarkPlugin } from '../plugin';
import { BenchmarkOperation, BenchmarkSpecialCase } from '../types';

/**
 * Creates a random array of the specified size
 * 
 * @param size - Size of the array
 * @returns Array of random numbers
 */
function createRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
}

/**
 * Creates a sorted array of the specified size
 * 
 * @param size - Size of the array
 * @returns Sorted array of numbers
 */
function createSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Creates a reversed array of the specified size
 * 
 * @param size - Size of the array
 * @returns Reversed sorted array of numbers
 */
function createReversedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => size - i - 1);
}

/**
 * Creates a nearly sorted array of the specified size
 * 
 * @param size - Size of the array
 * @returns Nearly sorted array of numbers
 */
function createNearlySortedArray(size: number): number[] {
  const array = Array.from({ length: size }, (_, i) => i);
  // Swap about 5% of elements
  const swaps = Math.floor(size * 0.05);
  for (let i = 0; i < swaps; i++) {
    const idx1 = Math.floor(Math.random() * size);
    const idx2 = Math.floor(Math.random() * size);
    const temp = array[idx1];
    array[idx1] = array[idx2];
    array[idx2] = temp;
  }
  return array;
}

/**
 * Creates an array with few unique values
 * 
 * @param size - Size of the array
 * @returns Array with few unique values
 */
function createFewUniqueArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 10));
}

/**
 * Bubble sort implementation
 * 
 * @param arr - Array to sort
 * @returns Sorted array
 */
function bubbleSort<T>(arr: T[]): T[] {
  const result = [...arr];
  const n = result.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (result[j] > result[j + 1]) {
        // Swap
        const temp = result[j];
        result[j] = result[j + 1];
        result[j + 1] = temp;
      }
    }
  }
  
  return result;
}

/**
 * Selection sort implementation
 * 
 * @param arr - Array to sort
 * @returns Sorted array
 */
function selectionSort<T>(arr: T[]): T[] {
  const result = [...arr];
  const n = result.length;
  
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    
    for (let j = i + 1; j < n; j++) {
      if (result[j] < result[minIdx]) {
        minIdx = j;
      }
    }
    
    if (minIdx !== i) {
      // Swap
      const temp = result[i];
      result[i] = result[minIdx];
      result[minIdx] = temp;
    }
  }
  
  return result;
}

/**
 * Insertion sort implementation
 * 
 * @param arr - Array to sort
 * @returns Sorted array
 */
function insertionSort<T>(arr: T[]): T[] {
  const result = [...arr];
  const n = result.length;
  
  for (let i = 1; i < n; i++) {
    const key = result[i];
    let j = i - 1;
    
    while (j >= 0 && result[j] > key) {
      result[j + 1] = result[j];
      j--;
    }
    
    result[j + 1] = key;
  }
  
  return result;
}

/**
 * Merge sort implementation
 * 
 * @param arr - Array to sort
 * @returns Sorted array
 */
function mergeSort<T>(arr: T[]): T[] {
  if (arr.length <= 1) {
    return arr;
  }
  
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

/**
 * Merge two sorted arrays
 * 
 * @param left - Left array
 * @param right - Right array
 * @returns Merged array
 */
function merge<T>(left: T[], right: T[]): T[] {
  const result: T[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }
  
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

/**
 * Quick sort implementation
 * 
 * @param arr - Array to sort
 * @returns Sorted array
 */
function quickSort<T>(arr: T[]): T[] {
  if (arr.length <= 1) {
    return arr;
  }
  
  const result = [...arr];
  quickSortHelper(result, 0, result.length - 1);
  return result;
}

/**
 * Quick sort helper function
 * 
 * @param arr - Array to sort
 * @param low - Low index
 * @param high - High index
 */
function quickSortHelper<T>(arr: T[], low: number, high: number): void {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSortHelper(arr, low, pivotIndex - 1);
    quickSortHelper(arr, pivotIndex + 1, high);
  }
}

/**
 * Partition function for quick sort
 * 
 * @param arr - Array to partition
 * @param low - Low index
 * @param high - High index
 * @returns Pivot index
 */
function partition<T>(arr: T[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      // Swap
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  
  // Swap
  const temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  
  return i + 1;
}

/**
 * Heap sort implementation
 * 
 * @param arr - Array to sort
 * @returns Sorted array
 */
function heapSort<T>(arr: T[]): T[] {
  const result = [...arr];
  const n = result.length;
  
  // Build heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(result, n, i);
  }
  
  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    // Swap
    const temp = result[0];
    result[0] = result[i];
    result[i] = temp;
    
    // Heapify root element
    heapify(result, i, 0);
  }
  
  return result;
}

/**
 * Heapify function for heap sort
 * 
 * @param arr - Array to heapify
 * @param n - Size of the heap
 * @param i - Root index
 */
function heapify<T>(arr: T[], n: number, i: number): void {
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
    // Swap
    const temp = arr[i];
    arr[i] = arr[largest];
    arr[largest] = temp;
    
    // Recursively heapify the affected sub-tree
    heapify(arr, n, largest);
  }
}

/**
 * Native sort implementation (using Array.prototype.sort)
 * 
 * @param arr - Array to sort
 * @returns Sorted array
 */
function nativeSort<T>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a > b ? 1 : a < b ? -1 : 0);
}

/**
 * Sorting benchmark plugin
 */
export class SortingBenchmarkPlugin extends BaseBenchmarkPlugin {
  name = 'sorting-benchmark-plugin';
  description = 'Provides benchmarks for sorting algorithms';

  /**
   * Register sorting benchmarks
   */
  register(): void {
    // Register adapters for sorting algorithms
    this.registerSortingAdapters();

    // Register sorting benchmark definition
    this.registerBenchmark(
      this.createBenchmarkDefinition(
        'sorting',
        'Sorting Benchmarks',
        'algorithm',
        this.createSortingOperations(),
        {
          description: 'Benchmarks for sorting algorithms',
          setupFn: createRandomArray,
          specialCases: this.createSortingSpecialCases(),
          defaultInputSizes: [100, 1000, 10000],
          defaultIterations: 100,
          tags: ['sorting', 'algorithm'],
          examples: [
            'benchmark sorting --operations bubble-sort,quick-sort,native-sort',
            'benchmark sorting --special-case reversed',
            'benchmark sorting --input-sizes 100,500,1000'
          ]
        }
      )
    );
  }

  /**
   * Register adapters for sorting algorithms
   */
  private registerSortingAdapters(): void {
    AdapterFactory.registerAdapter('sorting', 'bubble-sort', bubbleSort);
    AdapterFactory.registerAdapter('sorting', 'selection-sort', selectionSort);
    AdapterFactory.registerAdapter('sorting', 'insertion-sort', insertionSort);
    AdapterFactory.registerAdapter('sorting', 'merge-sort', mergeSort);
    AdapterFactory.registerAdapter('sorting', 'quick-sort', quickSort);
    AdapterFactory.registerAdapter('sorting', 'heap-sort', heapSort);
    AdapterFactory.registerAdapter('sorting', 'native-sort', nativeSort);
  }

  /**
   * Create sorting operations
   * 
   * @returns Array of sorting operations
   */
  private createSortingOperations(): BenchmarkOperation[] {
    const operations: BenchmarkOperation[] = [];
    
    operations.push(this.createOperation(
      'bubble-sort',
      AdapterFactory.getAdapter('sorting', 'bubble-sort')!,
      'Bubble sort algorithm (O(n²))'
    ));
    operations.push(this.createOperation(
      'selection-sort',
      AdapterFactory.getAdapter('sorting', 'selection-sort')!,
      'Selection sort algorithm (O(n²))'
    ));
    operations.push(this.createOperation(
      'insertion-sort',
      AdapterFactory.getAdapter('sorting', 'insertion-sort')!,
      'Insertion sort algorithm (O(n²))'
    ));
    operations.push(this.createOperation(
      'merge-sort',
      AdapterFactory.getAdapter('sorting', 'merge-sort')!,
      'Merge sort algorithm (O(n log n))'
    ));
    operations.push(this.createOperation(
      'quick-sort',
      AdapterFactory.getAdapter('sorting', 'quick-sort')!,
      'Quick sort algorithm (O(n log n) average, O(n²) worst case)'
    ));
    operations.push(this.createOperation(
      'heap-sort',
      AdapterFactory.getAdapter('sorting', 'heap-sort')!,
      'Heap sort algorithm (O(n log n))'
    ));
    operations.push(this.createOperation(
      'native-sort',
      AdapterFactory.getAdapter('sorting', 'native-sort')!,
      'Native JavaScript sort implementation'
    ));
    
    return operations;
  }

  /**
   * Create special cases for sorting benchmarks
   * 
   * @returns Array of special cases
   */
  private createSortingSpecialCases(): BenchmarkSpecialCase[] {
    return [
      this.createSpecialCase(
        'random',
        createRandomArray,
        'Random array of numbers'
      ),
      this.createSpecialCase(
        'sorted',
        createSortedArray,
        'Already sorted array'
      ),
      this.createSpecialCase(
        'reversed',
        createReversedArray,
        'Reversed sorted array'
      ),
      this.createSpecialCase(
        'nearly-sorted',
        createNearlySortedArray,
        'Nearly sorted array (95% sorted)'
      ),
      this.createSpecialCase(
        'few-unique',
        createFewUniqueArray,
        'Array with few unique values'
      )
    ];
  }
}
