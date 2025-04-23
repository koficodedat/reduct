/**
 * Mock implementation of @reduct/wasm for testing
 */

export function isWebAssemblySupported(): boolean {
  return true;
}

// Mock implementation of adaptive threshold manager
export const adaptiveThresholdManager = {
  config: {
    minInputSize: 1000,
    maxInputSize: 100000,
    minSpeedupRatio: 1.1,
    maxSamples: 100,
    adaptiveThresholds: true,
    learningRate: 0.1,
  } as ThresholdConfig,

  setPerformanceProfile(_domain: string, _type: string, _operation: string, _profile: any): void {
    // Mock implementation
  },

  recordSample(_domain: string, _type: string, _operation: string, _sample: {
    inputSize: number;
    jsTime: number;
    wasmTime: number;
    timestamp: number;
  }): void {
    // Mock implementation
  },

  shouldUseWasm(_domain: string, _type: string, _operation: string, inputSize: number): boolean {
    // Mock implementation - use WebAssembly for inputs larger than minInputSize
    return inputSize >= this.config.minInputSize;
  },

  getThreshold(_domain: string, _type: string, _operation: string): number {
    // Mock implementation
    return this.config.minInputSize;
  },

  getSamples(_domain: string, _type: string, _operation: string): Array<{
    inputSize: number;
    jsTime: number;
    wasmTime: number;
    timestamp: number;
  }> {
    // Mock implementation
    return [];
  }
};

// Mock implementation of performance counter
export const performanceCounter = {
  recordMeasurement(
    _domain: string,
    _type: string,
    _operation: string,
    _jsTime: number,
    _wasmTime: number,
    _inputSize: number,
    _usedWasm: boolean,
    _fallback: boolean
  ): void {
    // Mock implementation
  },

  getMetrics(_domain: string, _type: string, _operation: string): {
    totalExecutions: number;
    wasmExecutions: number;
    jsExecutions: number;
    avgJsTime: number;
    avgWasmTime: number;
    avgSpeedup: number;
    maxSpeedup: number;
    totalTimeSaved: number;
  } {
    // Mock implementation
    return {
      totalExecutions: 0,
      wasmExecutions: 0,
      jsExecutions: 0,
      avgJsTime: 0,
      avgWasmTime: 0,
      avgSpeedup: 1.0,
      maxSpeedup: 1.0,
      totalTimeSaved: 0
    };
  }
};

export interface PerformanceProfile {
  estimatedSpeedup: number;
  effectiveInputSize: number;
}

export interface AcceleratorOptions {
  requiredFeatures?: string[];
  elementType?: string;
  useSIMD?: boolean;
  thresholds?: {
    minArraySize?: number;
    minStringLength?: number;
    minMatrixSize?: number;
    adaptive?: boolean;
    adaptiveConfig?: Partial<ThresholdConfig>;
  };
}

export interface ThresholdConfig {
  minInputSize: number;
  maxInputSize: number;
  minSpeedupRatio: number;
  maxSamples: number;
  adaptiveThresholds: boolean;
  learningRate: number;
}

export enum WebAssemblyFeature {
  BASIC = 'basic',
  SIMD = 'simd',
  THREADS = 'threads',
  REFERENCE_TYPES = 'reference-types',
  BULK_MEMORY = 'bulk-memory',
  EXCEPTION_HANDLING = 'exception-handling'
}

export interface Accelerator<T, R> {
  execute(input: T): R;
  getPerformanceProfile(): PerformanceProfile;
}

export abstract class WasmAccelerator<T, R> implements Accelerator<T, R> {
  constructor(
    _domain: string,
    _type: string,
    _operation: string,
    _options?: AcceleratorOptions
  ) {}

  abstract execute(input: T): R;
  abstract getPerformanceProfile(): PerformanceProfile;

  protected getModule(): any {
    return null;
  }
}

export class NumericAccelerator extends WasmAccelerator<any, any> {
  constructor(options?: AcceleratorOptions) {
    super('data-structures', 'numeric', 'operations', options);
  }

  map<T, R>(array: T[], fn: (value: T, index: number) => R): R[] {
    return array.map(fn);
  }

  filter<T>(array: T[], fn: (value: T, index: number) => boolean): T[] {
    return array.filter(fn);
  }

  reduce<T, R>(array: T[], fn: (accumulator: R, value: T, index: number) => R, initial: R): R {
    return array.reduce(fn, initial);
  }

  mapFilter<T, R>(
    array: T[],
    mapFn: (value: T, index: number) => R,
    filterFn: (value: R, index: number) => boolean
  ): R[] {
    return array.map(mapFn).filter(filterFn);
  }

  mapReduce<T, U, V>(
    array: T[],
    mapFn: (value: T, index: number) => U,
    reduceFn: (accumulator: V, value: U, index: number) => V,
    initial: V
  ): V {
    return array.map(mapFn).reduce(reduceFn, initial);
  }

  mapFilterReduce<T, U, V>(
    array: T[],
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean,
    reduceFn: (accumulator: V, value: U, index: number) => V,
    initial: V
  ): V {
    return array.map(mapFn).filter(filterFn).reduce(reduceFn, initial);
  }

  sum(array: number[]): number {
    return array.reduce((a, b) => a + b, 0);
  }

  average(array: number[]): number {
    return array.length === 0 ? 0 : array.reduce((a, b) => a + b, 0) / array.length;
  }

  min(array: number[]): number {
    if (array.length === 0) return Infinity;
    // Use a loop instead of Math.min(...array) to avoid stack overflow for large arrays
    let min = array[0];
    for (let i = 1; i < array.length; i++) {
      if (array[i] < min) min = array[i];
    }
    return min;
  }

  max(array: number[]): number {
    if (array.length === 0) return -Infinity;
    // Use a loop instead of Math.max(...array) to avoid stack overflow for large arrays
    let max = array[0];
    for (let i = 1; i < array.length; i++) {
      if (array[i] > max) max = array[i];
    }
    return max;
  }

  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    // Create a copy to avoid modifying the original array
    const copy = [...array];

    // If it's a numeric array and no custom comparator is provided, use our efficient sort
    if (typeof array[0] === 'number' && !compareFn) {
      return this._efficientSort(copy as unknown as number[]) as unknown as T[];
    }

    // Otherwise, use the native sort
    return copy.sort(compareFn);
  }

  median(array: number[]): number {
    if (array.length === 0) return NaN;
    if (array.length === 1) return array[0];

    // Create a copy to avoid modifying the original array
    const copy = array.slice();

    // Use a more efficient sorting algorithm for large arrays
    const sorted = this._efficientSort(copy);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  standardDeviation(array: number[]): number {
    if (array.length === 0) return NaN;
    if (array.length === 1) return 0;

    // Calculate mean in a single pass
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i];
    }
    const mean = sum / array.length;

    // Calculate variance in a single pass
    let variance = 0;
    for (let i = 0; i < array.length; i++) {
      const diff = array[i] - mean;
      variance += diff * diff;
    }
    variance /= array.length;

    return Math.sqrt(variance);
  }

  percentile(array: number[], percentile: number): number {
    if (array.length === 0) return NaN;
    if (array.length === 1) return array[0];

    const p = Math.max(0, Math.min(100, percentile));

    // Create a copy to avoid modifying the original array
    const copy = array.slice();

    // Use a more efficient sorting algorithm for large arrays
    const sorted = this._efficientSort(copy);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Efficient sorting algorithm for large arrays
   * Uses native sort for small arrays and a more efficient algorithm for large arrays
   */
  private _efficientSort(array: number[]): number[] {
    // For small arrays, use native sort
    if (array.length < 10000) {
      return array.sort((a, b) => a - b);
    }

    // For large arrays, use a more efficient algorithm
    // This is a non-recursive implementation to avoid stack overflow
    return this._iterativeSort(array);
  }

  /**
   * Non-recursive sorting implementation for large arrays
   */
  private _iterativeSort(array: number[]): number[] {
    // Use a simple merge sort implementation that doesn't use recursion
    const n = array.length;

    // Start with small subarrays and merge them
    for (let size = 1; size < n; size *= 2) {
      // Merge subarrays of size 'size'
      for (let leftStart = 0; leftStart < n; leftStart += 2 * size) {
        // Find endpoints of two subarrays to merge
        const mid = Math.min(leftStart + size - 1, n - 1);
        const rightEnd = Math.min(leftStart + 2 * size - 1, n - 1);

        // Merge the two subarrays
        this._merge(array, leftStart, mid, rightEnd);
      }
    }

    return array;
  }

  /**
   * Merge two sorted subarrays
   */
  private _merge(array: number[], left: number, mid: number, right: number): void {
    // Calculate sizes of two subarrays to be merged
    const n1 = mid - left + 1;
    const n2 = right - mid;

    // Create temporary arrays
    const leftArray = new Array(n1);
    const rightArray = new Array(n2);

    // Copy data to temporary arrays
    for (let i = 0; i < n1; i++) {
      leftArray[i] = array[left + i];
    }
    for (let j = 0; j < n2; j++) {
      rightArray[j] = array[mid + 1 + j];
    }

    // Merge the temporary arrays back into the original array
    let i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
      if (leftArray[i] <= rightArray[j]) {
        array[k] = leftArray[i];
        i++;
      } else {
        array[k] = rightArray[j];
        j++;
      }
      k++;
    }

    // Copy remaining elements of leftArray, if any
    while (i < n1) {
      array[k] = leftArray[i];
      i++;
      k++;
    }

    // Copy remaining elements of rightArray, if any
    while (j < n2) {
      array[k] = rightArray[j];
      j++;
      k++;
    }
  }

  execute(input: any): any {
    return input;
  }

  getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 1.0,
      effectiveInputSize: 1000
    };
  }
}
