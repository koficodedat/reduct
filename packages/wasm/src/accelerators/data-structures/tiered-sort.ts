/**
 * Tiered sort accelerator
 *
 * This is a sample implementation of a tiered accelerator for array sorting.
 * It demonstrates how to use the tiered optimization framework to automatically
 * switch between JavaScript and WebAssembly based on input characteristics.
 */
import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions, AcceleratorTier } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * Input for the sort operation
 */
export interface SortInput<T> {
  /**
   * The array to sort
   */
  array: T[];

  /**
   * Optional comparison function
   */
  compareFn?: (a: T, b: T) => number;
}

/**
 * Tiered sort accelerator
 *
 * Provides optimized implementation of array sorting using WebAssembly
 * with automatic tiering based on input characteristics.
 */
export class TieredSortAccelerator<T> extends WasmAccelerator {
  /**
   * Create a new tiered sort accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'tiered-sort', 'sort', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
      // Default tiering strategy for sorting
      tiering: {
        // Tier 1: Always use WebAssembly for numeric arrays over 100,000 elements
        [AcceleratorTier.HIGH_VALUE]: (input: SortInput<T>) => {
          return this.isNumericArray(input.array) && input.array.length >= 100000;
        },
        // Tier 2: Use WebAssembly for arrays over 10,000 elements
        [AcceleratorTier.CONDITIONAL]: (input: SortInput<T>) => {
          return input.array.length >= 10000;
        },
        // Tier 3: Use JavaScript for everything else
        [AcceleratorTier.JS_PREFERRED]: () => true,
      },
      // Default thresholds for sorting
      thresholds: {
        minArraySize: 10000,
      },
    });
  }

  /**
   * Execute the sort operation using WebAssembly
   * @param input The input for the sort operation
   * @returns The sorted array
   */
  protected executeWasm(input: SortInput<T>): T[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.executeJs(input);
    }

    try {
      // Get the array and comparison function
      const { array } = input;

      // Check if the array is a numeric array
      if (this.isNumericArray(array)) {
        // Use the specialized numeric sort function
        const result = module.numeric_sort_f64(array as unknown as number[]);
        return Array.from(result) as unknown as T[];
      }

      // For non-numeric arrays, use the generic sort function
      // In a real implementation, we would have different WebAssembly functions
      // for different array types

      // For now, fall back to JavaScript
      return this.executeJs(input);
    } catch (error) {
      // Fall back to JavaScript implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.executeJs(input);
    }
  }

  /**
   * Execute the sort operation using JavaScript
   * @param input The input for the sort operation
   * @returns The sorted array
   */
  protected executeJs(input: SortInput<T>): T[] {
    const { array, compareFn } = input;

    // Create a copy of the array to avoid modifying the original
    const result = [...array];

    // Sort the array
    if (compareFn) {
      result.sort(compareFn);
    } else {
      result.sort();
    }

    return result;
  }

  /**
   * Get the performance profile of the sort accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 2.0,
      effectiveInputSize: 10000,
    };
  }

  /**
   * Check if an array contains only numbers
   * @param array The array to check
   * @returns True if the array contains only numbers
   */
  private isNumericArray(array: any[]): boolean {
    return array.length > 0 && array.every(value => typeof value === 'number');
  }
}
