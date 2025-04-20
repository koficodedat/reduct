/**
 * Mock implementation of @reduct/wasm for testing
 */

export function isWebAssemblySupported(): boolean {
  return true;
}

export interface PerformanceProfile {
  estimatedSpeedup: number;
  effectiveInputSize: number;
}

export interface AcceleratorOptions {
  requiredFeatures?: string[];
  elementType?: string;
  useSIMD?: boolean;
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
    domain: string,
    type: string,
    operation: string,
    options?: AcceleratorOptions
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
    return array.length === 0 ? Infinity : Math.min(...array);
  }

  max(array: number[]): number {
    return array.length === 0 ? -Infinity : Math.max(...array);
  }

  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    return [...array].sort(compareFn);
  }

  median(array: number[]): number {
    if (array.length === 0) return NaN;
    if (array.length === 1) return array[0];
    
    const sorted = [...array].sort((a, b) => a - b);
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
    
    const mean = array.reduce((a, b) => a + b, 0) / array.length;
    const variance = array.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / array.length;
    return Math.sqrt(variance);
  }

  percentile(array: number[], percentile: number): number {
    if (array.length === 0) return NaN;
    if (array.length === 1) return array[0];
    
    const p = Math.max(0, Math.min(100, percentile));
    const sorted = [...array].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
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
