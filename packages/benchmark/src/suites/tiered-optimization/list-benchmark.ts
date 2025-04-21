/**
 * Benchmark for list operations
 */
import { BaseBenchmark, BaseBenchmarkOptions, AcceleratorTier } from './base-benchmark';

/**
 * Mock ListAccelerator class for benchmarking
 */
class ListAccelerator {
  /**
   * Create a new list accelerator
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
   * Map operation for arrays
   * @param array The input array
   * @param mapFn The mapping function
   * @returns The mapped array
   */
  public map<T, R>(array: T[], mapFn: (value: T, index: number) => R): R[] {
    return array.map(mapFn);
  }

  /**
   * Filter operation for arrays
   * @param array The input array
   * @param filterFn The filter function
   * @returns The filtered array
   */
  public filter<T>(array: T[], filterFn: (value: T, index: number) => boolean): T[] {
    return array.filter(filterFn);
  }

  /**
   * Reduce operation for arrays
   * @param array The input array
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  public reduce<T, R>(array: T[], reduceFn: (accumulator: R, value: T, index: number) => R, initialValue: R): R {
    return array.reduce(reduceFn, initialValue);
  }

  /**
   * Sort operation for arrays
   * @param array The input array
   * @param compareFn The compare function
   * @returns The sorted array
   */
  public sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    return [...array].sort(compareFn);
  }

  /**
   * Map-filter operation for arrays
   * @param array The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @returns The mapped and filtered array
   */
  public mapFilter<T, R>(array: T[], mapFn: (value: T, index: number) => R, filterFn: (value: R, index: number) => boolean): R[] {
    return array.map(mapFn).filter(filterFn);
  }

  /**
   * Map-reduce operation for arrays
   * @param array The input array
   * @param mapFn The mapping function
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  public mapReduce<T, R, U>(array: T[], mapFn: (value: T, index: number) => R, reduceFn: (accumulator: U, value: R, index: number) => U, initialValue: U): U {
    return array.map(mapFn).reduce(reduceFn, initialValue);
  }

  /**
   * Filter-reduce operation for arrays
   * @param array The input array
   * @param filterFn The filter function
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  public filterReduce<T, R>(array: T[], filterFn: (value: T, index: number) => boolean, reduceFn: (accumulator: R, value: T, index: number) => R, initialValue: R): R {
    return array.filter(filterFn).reduce(reduceFn, initialValue);
  }

  /**
   * Map-filter-reduce operation for arrays
   * @param array The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  public mapFilterReduce<T, R, U>(array: T[], mapFn: (value: T, index: number) => R, filterFn: (value: R, index: number) => boolean, reduceFn: (accumulator: U, value: R, index: number) => U, initialValue: U): U {
    return array.map(mapFn).filter(filterFn).reduce(reduceFn, initialValue);
  }
}

/**
 * List operation type
 */
export type ListOperation = 'map' | 'filter' | 'reduce' | 'sort' | 'mapFilter' | 'mapReduce' | 'filterReduce' | 'mapFilterReduce';

/**
 * List benchmark options
 */
export interface ListBenchmarkOptions extends BaseBenchmarkOptions {
  /**
   * Operation to benchmark
   */
  operation: ListOperation;

  /**
   * Type of elements in the list
   */
  elementType?: 'number' | 'string' | 'object';
}

/**
 * Benchmark for list operations
 */
export class ListBenchmark extends BaseBenchmark<any[], any> {
  /**
   * Operation to benchmark
   */
  private readonly operation: ListOperation;

  /**
   * Type of elements in the list
   */
  private readonly elementType: 'number' | 'string' | 'object';

  /**
   * Create a new list benchmark
   * @param options Options for the benchmark
   */
  constructor(options: ListBenchmarkOptions) {
    super(
      `list-${options.operation}-${options.elementType || 'number'}`,
      `Benchmark for list ${options.operation} operation with ${options.elementType || 'number'} elements`,
      options
    );

    this.operation = options.operation;
    this.elementType = options.elementType || 'number';
  }

  /**
   * Generate input for the benchmark
   * @param size Size of the input
   * @returns Input for the benchmark
   */
  protected generateInput(size: number): any[] {
    const array = new Array(size);

    switch (this.elementType) {
      case 'number':
        for (let i = 0; i < size; i++) {
          array[i] = Math.random();
        }
        break;
      case 'string':
        for (let i = 0; i < size; i++) {
          array[i] = `item-${i}`;
        }
        break;
      case 'object':
        for (let i = 0; i < size; i++) {
          array[i] = { id: i, value: Math.random() };
        }
        break;
    }

    return array;
  }

  /**
   * Get the size of the input
   * @param input Input for the benchmark
   * @returns Size of the input
   */
  protected getInputSize(input: any[]): number {
    return input.length;
  }

  /**
   * Create an accelerator for the benchmark
   * @param tier Tier to use
   * @returns Accelerator for the benchmark
   */
  protected createAccelerator(tier: AcceleratorTier): { execute: (input: any[]) => any } {
    // Create a list accelerator
    const accelerator = new ListAccelerator({
      thresholds: {
        // Enable adaptive thresholds if specified
        adaptive: this.options.useAdaptiveThresholds,
        adaptiveConfig: this.options.adaptiveConfig,
      },
    });

    // Create a wrapper that forces the specified tier
    return {
      execute: (input: any[]) => {
        // Override the determineTier method to always return the specified tier
        const originalDetermineTier = accelerator.determineTier;
        accelerator.determineTier = () => tier;

        // Execute the operation
        let result;

        switch (this.operation) {
          case 'map':
            if (this.elementType === 'number') {
              result = accelerator.map(input, x => x * 2);
            } else if (this.elementType === 'string') {
              result = accelerator.map(input, x => x + '-mapped');
            } else {
              result = accelerator.map(input, x => ({ ...x, mapped: true }));
            }
            break;
          case 'filter':
            if (this.elementType === 'number') {
              result = accelerator.filter(input, x => x > 0.5);
            } else if (this.elementType === 'string') {
              result = accelerator.filter(input, x => x.length > 6);
            } else {
              result = accelerator.filter(input, x => x.value > 0.5);
            }
            break;
          case 'reduce':
            if (this.elementType === 'number') {
              result = accelerator.reduce(input, (acc, x) => acc + x, 0);
            } else if (this.elementType === 'string') {
              result = accelerator.reduce(input, (acc, x) => acc + x.length, 0);
            } else {
              result = accelerator.reduce(input, (acc, x) => acc + x.value, 0);
            }
            break;
          case 'sort':
            if (this.elementType === 'number') {
              result = accelerator.sort(input);
            } else if (this.elementType === 'string') {
              result = accelerator.sort(input);
            } else {
              result = accelerator.sort(input, (a, b) => a.value - b.value);
            }
            break;
          case 'mapFilter':
            if (this.elementType === 'number') {
              result = accelerator.mapFilter(input, x => x * 2, x => x > 1);
            } else if (this.elementType === 'string') {
              result = accelerator.mapFilter(input, x => x + '-mapped', x => x.length > 10);
            } else {
              result = accelerator.mapFilter(input, x => ({ ...x, mapped: true }), x => x.value > 0.5);
            }
            break;
          case 'mapReduce':
            if (this.elementType === 'number') {
              result = accelerator.mapReduce(input, x => x * 2, (acc, x) => acc + x, 0);
            } else if (this.elementType === 'string') {
              result = accelerator.mapReduce(input, x => x + '-mapped', (acc, x) => acc + x.length, 0);
            } else {
              result = accelerator.mapReduce(input, x => ({ ...x, mapped: true }), (acc, x) => acc + x.value, 0);
            }
            break;
          case 'filterReduce':
            if (this.elementType === 'number') {
              result = accelerator.filterReduce(input, x => x > 0.5, (acc, x) => acc + x, 0);
            } else if (this.elementType === 'string') {
              result = accelerator.filterReduce(input, x => x.length > 6, (acc, x) => acc + x.length, 0);
            } else {
              result = accelerator.filterReduce(input, x => x.value > 0.5, (acc, x) => acc + x.value, 0);
            }
            break;
          case 'mapFilterReduce':
            if (this.elementType === 'number') {
              result = accelerator.mapFilterReduce(input, x => x * 2, x => x > 1, (acc, x) => acc + x, 0);
            } else if (this.elementType === 'string') {
              result = accelerator.mapFilterReduce(input, x => x + '-mapped', x => x.length > 10, (acc, x) => acc + x.length, 0);
            } else {
              result = accelerator.mapFilterReduce(input, x => ({ ...x, mapped: true }), x => x.value > 0.5, (acc, x) => acc + x.value, 0);
            }
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
  protected executeNative(input: any[]): any {
    switch (this.operation) {
      case 'map':
        if (this.elementType === 'number') {
          return input.map(x => x * 2);
        } else if (this.elementType === 'string') {
          return input.map(x => x + '-mapped');
        } else {
          return input.map(x => ({ ...x, mapped: true }));
        }
      case 'filter':
        if (this.elementType === 'number') {
          return input.filter(x => x > 0.5);
        } else if (this.elementType === 'string') {
          return input.filter(x => x.length > 6);
        } else {
          return input.filter(x => x.value > 0.5);
        }
      case 'reduce':
        if (this.elementType === 'number') {
          return input.reduce((acc, x) => acc + x, 0);
        } else if (this.elementType === 'string') {
          return input.reduce((acc, x) => acc + x.length, 0);
        } else {
          return input.reduce((acc, x) => acc + x.value, 0);
        }
      case 'sort':
        if (this.elementType === 'number') {
          return [...input].sort();
        } else if (this.elementType === 'string') {
          return [...input].sort();
        } else {
          return [...input].sort((a, b) => a.value - b.value);
        }
      case 'mapFilter':
        if (this.elementType === 'number') {
          return input.map(x => x * 2).filter(x => x > 1);
        } else if (this.elementType === 'string') {
          return input.map(x => x + '-mapped').filter(x => x.length > 10);
        } else {
          return input.map(x => ({ ...x, mapped: true })).filter(x => x.value > 0.5);
        }
      case 'mapReduce':
        if (this.elementType === 'number') {
          return input.map(x => x * 2).reduce((acc, x) => acc + x, 0);
        } else if (this.elementType === 'string') {
          return input.map(x => x + '-mapped').reduce((acc, x) => acc + x.length, 0);
        } else {
          return input.map(x => ({ ...x, mapped: true })).reduce((acc, x) => acc + x.value, 0);
        }
      case 'filterReduce':
        if (this.elementType === 'number') {
          return input.filter(x => x > 0.5).reduce((acc, x) => acc + x, 0);
        } else if (this.elementType === 'string') {
          return input.filter(x => x.length > 6).reduce((acc, x) => acc + x.length, 0);
        } else {
          return input.filter(x => x.value > 0.5).reduce((acc, x) => acc + x.value, 0);
        }
      case 'mapFilterReduce':
        if (this.elementType === 'number') {
          return input.map(x => x * 2).filter(x => x > 1).reduce((acc, x) => acc + x, 0);
        } else if (this.elementType === 'string') {
          return input.map(x => x + '-mapped').filter(x => x.length > 10).reduce((acc, x) => acc + x.length, 0);
        } else {
          return input.map(x => ({ ...x, mapped: true })).filter(x => x.value > 0.5).reduce((acc, x) => acc + x.value, 0);
        }
      default:
        throw new Error(`Unsupported operation: ${this.operation}`);
    }
  }
}
