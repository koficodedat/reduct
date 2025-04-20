/**
 * Type declarations for @reduct/wasm package
 */

declare module '@reduct/wasm' {
  /**
   * Check if WebAssembly is supported in the current environment
   */
  export function isWebAssemblySupported(): boolean;

  /**
   * Performance profile for an accelerator
   */
  export interface PerformanceProfile {
    /**
     * Estimated speedup factor compared to JavaScript
     */
    estimatedSpeedup: number;

    /**
     * Effective input size where WebAssembly becomes faster than JavaScript
     */
    effectiveInputSize: number;
  }

  /**
   * Options for an accelerator
   */
  export interface AcceleratorOptions {
    /**
     * Required WebAssembly features
     */
    requiredFeatures?: WebAssemblyFeature[];

    /**
     * Element type for specialized accelerators
     */
    elementType?: string;

    /**
     * Whether to use SIMD when available
     */
    useSIMD?: boolean;
  }

  /**
   * WebAssembly features
   */
  export enum WebAssemblyFeature {
    BASIC = 'basic',
    SIMD = 'simd',
    THREADS = 'threads',
    REFERENCE_TYPES = 'reference-types',
    BULK_MEMORY = 'bulk-memory',
    EXCEPTION_HANDLING = 'exception-handling'
  }

  /**
   * Base accelerator interface
   */
  export interface Accelerator<T, R> {
    /**
     * Execute the accelerated operation
     */
    execute(input: T): R;

    /**
     * Get the performance profile of the accelerator
     */
    getPerformanceProfile(): PerformanceProfile;
  }

  /**
   * Base class for WebAssembly accelerators
   */
  export abstract class WasmAccelerator<T, R> implements Accelerator<T, R> {
    /**
     * Create a new WebAssembly accelerator
     */
    constructor(
      domain: string,
      type: string,
      operation: string,
      options?: AcceleratorOptions
    );

    /**
     * Execute the accelerated operation
     */
    abstract execute(input: T): R;

    /**
     * Get the performance profile of the accelerator
     */
    abstract getPerformanceProfile(): PerformanceProfile;

    /**
     * Get the WebAssembly module
     */
    protected getModule(): any;
  }

  /**
   * Numeric accelerator for array operations
   */
  export class NumericAccelerator extends WasmAccelerator<any, any> {
    /**
     * Create a new numeric accelerator
     */
    constructor(options?: AcceleratorOptions);

    /**
     * Map operation
     */
    map<T, R>(array: T[], fn: (value: T, index: number) => R): R[];

    /**
     * Filter operation
     */
    filter<T>(array: T[], fn: (value: T, index: number) => boolean): T[];

    /**
     * Reduce operation
     */
    reduce<T, R>(array: T[], fn: (accumulator: R, value: T, index: number) => R, initial: R): R;

    /**
     * Map-filter operation
     */
    mapFilter<T, R>(
      array: T[],
      mapFn: (value: T, index: number) => R,
      filterFn: (value: R, index: number) => boolean
    ): R[];

    /**
     * Map-reduce operation
     */
    mapReduce<T, U, V>(
      array: T[],
      mapFn: (value: T, index: number) => U,
      reduceFn: (accumulator: V, value: U, index: number) => V,
      initial: V
    ): V;

    /**
     * Map-filter-reduce operation
     */
    mapFilterReduce<T, U, V>(
      array: T[],
      mapFn: (value: T, index: number) => U,
      filterFn: (value: U, index: number) => boolean,
      reduceFn: (accumulator: V, value: U, index: number) => V,
      initial: V
    ): V;

    /**
     * Sum operation
     */
    sum(array: number[]): number;

    /**
     * Average operation
     */
    average(array: number[]): number;

    /**
     * Min operation
     */
    min(array: number[]): number;

    /**
     * Max operation
     */
    max(array: number[]): number;

    /**
     * Sort operation
     */
    sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[];

    /**
     * Median operation
     */
    median(array: number[]): number;

    /**
     * Standard deviation operation
     */
    standardDeviation(array: number[]): number;

    /**
     * Percentile operation
     */
    percentile(array: number[], percentile: number): number;

    /**
     * Execute the accelerated operation
     */
    execute(input: any): any;

    /**
     * Get the performance profile of the accelerator
     */
    getPerformanceProfile(): PerformanceProfile;
  }
}
