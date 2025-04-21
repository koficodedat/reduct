/**
 * Benchmark for numeric array operations
 */
import { BaseBenchmark, BaseBenchmarkOptions, AcceleratorTier } from './base-benchmark';

/**
 * Mock NumericArrayAccelerator class for benchmarking
 */
class NumericArrayAccelerator {
  /**
   * Create a new numeric array accelerator
   * @param options Options for the accelerator
   */
  constructor(_options: any = {}) {}

  /**
   * Determine the appropriate tier for the input
   * @param input The input to evaluate
   * @returns The appropriate tier for the input
   */
  public determineTier(_input: any): AcceleratorTier {
    return AcceleratorTier.HIGH_VALUE;
  }

  /**
   * Map operation for numeric arrays
   * @param array The input array
   * @param mapFn The mapping function
   * @returns The mapped array
   */
  public map<T extends number, U extends number>(array: T[], mapFn: (value: T, index: number) => U): U[] {
    return array.map(mapFn);
  }

  /**
   * Filter operation for numeric arrays
   * @param array The input array
   * @param filterFn The filter function
   * @returns The filtered array
   */
  public filter<T extends number>(array: T[], filterFn: (value: T, index: number) => boolean): T[] {
    return array.filter(filterFn);
  }

  /**
   * Reduce operation for numeric arrays
   * @param array The input array
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  public reduce<T extends number, U>(array: T[], reduceFn: (accumulator: U, value: T, index: number) => U, initialValue: U): U {
    return array.reduce(reduceFn, initialValue);
  }

  /**
   * Sort operation for numeric arrays
   * @param array The input array
   * @param compareFn The compare function
   * @returns The sorted array
   */
  public sort<T extends number>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    return [...array].sort(compareFn);
  }

  /**
   * Map-filter operation for numeric arrays
   * @param array The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @returns The mapped and filtered array
   */
  public mapFilter<T extends number, U extends number>(array: T[], mapFn: (value: T, index: number) => U, filterFn: (value: U, index: number) => boolean): U[] {
    return array.map(mapFn).filter(filterFn);
  }

  /**
   * Sum operation for numeric arrays
   * @param array The input array
   * @returns The sum of all elements
   */
  public sum(array: number[]): number {
    return array.reduce((sum, value) => sum + value, 0);
  }

  /**
   * Average operation for numeric arrays
   * @param array The input array
   * @returns The average of all elements
   */
  public average(array: number[]): number {
    return array.length === 0 ? 0 : this.sum(array) / array.length;
  }

  /**
   * Min operation for numeric arrays
   * @param array The input array
   * @returns The minimum value
   */
  public min(array: number[]): number {
    return array.length === 0 ? NaN : Math.min(...array);
  }

  /**
   * Max operation for numeric arrays
   * @param array The input array
   * @returns The maximum value
   */
  public max(array: number[]): number {
    return array.length === 0 ? NaN : Math.max(...array);
  }
}

/**
 * Numeric array operation type
 */
export type NumericArrayOperation = 'map' | 'filter' | 'reduce' | 'sort' | 'mapFilter' | 'sum' | 'average' | 'min' | 'max';

/**
 * Numeric array benchmark options
 */
export interface NumericArrayBenchmarkOptions extends BaseBenchmarkOptions {
  /**
   * Operation to benchmark
   */
  operation: NumericArrayOperation;
}

/**
 * Benchmark for numeric array operations
 */
export class NumericArrayBenchmark extends BaseBenchmark<number[], any> {
  /**
   * Operation to benchmark
   */
  private readonly operation: NumericArrayOperation;

  /**
   * Create a new numeric array benchmark
   * @param options Options for the benchmark
   */
  constructor(options: NumericArrayBenchmarkOptions) {
    super(
      `numeric-array-${options.operation}`,
      `Benchmark for numeric array ${options.operation} operation`,
      options
    );

    this.operation = options.operation;
  }

  /**
   * Generate input for the benchmark
   * @param size Size of the input
   * @returns Input for the benchmark
   */
  protected generateInput(size: number): number[] {
    const array = new Array(size);

    for (let i = 0; i < size; i++) {
      array[i] = Math.random();
    }

    return array;
  }

  /**
   * Get the size of the input
   * @param input Input for the benchmark
   * @returns Size of the input
   */
  protected getInputSize(input: number[]): number {
    return input.length;
  }

  /**
   * Create an accelerator for the benchmark
   * @param tier Tier to use
   * @returns Accelerator for the benchmark
   */
  protected createAccelerator(tier: AcceleratorTier): { execute: (input: number[]) => any } {
    // Create a numeric array accelerator
    const accelerator = new NumericArrayAccelerator({
      thresholds: {
        // Enable adaptive thresholds if specified
        adaptive: this.options.useAdaptiveThresholds,
        adaptiveConfig: this.options.adaptiveConfig,
      },
    });

    // Create a wrapper that forces the specified tier
    return {
      execute: (input: number[]) => {
        // Override the determineTier method to always return the specified tier
        const originalDetermineTier = accelerator.determineTier;
        accelerator.determineTier = () => tier;

        // Execute the operation
        let result;

        switch (this.operation) {
          case 'map':
            result = accelerator.map(input, x => x * 2);
            break;
          case 'filter':
            result = accelerator.filter(input, x => x > 0.5);
            break;
          case 'reduce':
            result = accelerator.reduce(input, (acc, x) => acc + x, 0);
            break;
          case 'sort':
            result = accelerator.sort(input);
            break;
          case 'mapFilter':
            result = accelerator.mapFilter(input, x => x * 2, x => x > 1);
            break;
          case 'sum':
            result = accelerator.sum(input);
            break;
          case 'average':
            result = accelerator.average(input);
            break;
          case 'min':
            result = accelerator.min(input);
            break;
          case 'max':
            result = accelerator.max(input);
            break;
          default:
            throw new Error(`Unsupported operation: ${this.operation}`);
        }

        // Restore the original determineTier method
        accelerator.determineTier = originalDetermineTier;

        return result;
      },
    };
  }

  /**
   * Execute the native implementation
   * @param input Input for the benchmark
   * @returns Result of the native implementation
   */
  protected executeNative(input: number[]): any {
    switch (this.operation) {
      case 'map':
        return input.map(x => x * 2);
      case 'filter':
        return input.filter(x => x > 0.5);
      case 'reduce':
        return input.reduce((acc, x) => acc + x, 0);
      case 'sort':
        return [...input].sort();
      case 'mapFilter':
        return input.map(x => x * 2).filter(x => x > 1);
      case 'sum':
        return input.reduce((acc, x) => acc + x, 0);
      case 'average':
        return input.length === 0 ? 0 : input.reduce((acc, x) => acc + x, 0) / input.length;
      case 'min':
        return input.length === 0 ? NaN : Math.min(...input);
      case 'max':
        return input.length === 0 ? NaN : Math.max(...input);
      default:
        throw new Error(`Unsupported operation: ${this.operation}`);
    }
  }
}
