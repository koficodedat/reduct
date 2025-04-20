import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * Numeric array operations accelerator
 *
 * Provides optimized implementations of common numeric array operations
 * using WebAssembly.
 */
export class NumericArrayAccelerator extends WasmAccelerator {
  /**
   * Create a new numeric array accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'numeric', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Execute the accelerated operation
   * @param _input The input for the operation
   * @returns The result of the operation
   */
  public execute(_input: any): any {
    throw new Error('Method not implemented. Use specific operation methods instead.');
  }

  /**
   * Get the performance profile of the numeric array accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 3.0,
      effectiveInputSize: 500,
    };
  }
  /**
   * Map operation for numeric arrays
   *
   * @param array The input array
   * @param mapFn The mapping function
   * @returns The mapped array
   */
  public map<T extends number, U extends number>(
    array: T[],
    mapFn: (value: T, index: number) => U
  ): U[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.map(mapFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.map(mapFn);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      const result = module.numeric_map_f64(typedArray, mapFn);

      // Convert back to regular array
      return Array.from(result as Float64Array) as U[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.map(mapFn);
    }
  }

  /**
   * Filter operation for numeric arrays
   *
   * @param array The input array
   * @param filterFn The filter function
   * @returns The filtered array
   */
  public filter<T extends number>(
    array: T[],
    filterFn: (value: T, index: number) => boolean
  ): T[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.filter(filterFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.filter(filterFn);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      const result = module.numeric_filter_f64(typedArray, filterFn);

      // Convert back to regular array
      return Array.from(result as Float64Array) as T[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.filter(filterFn);
    }
  }

  /**
   * Reduce operation for numeric arrays
   *
   * @param array The input array
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  public reduce<T extends number, U>(
    array: T[],
    reduceFn: (accumulator: U, value: T, index: number) => U,
    initialValue: U
  ): U {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.reduce(reduceFn, initialValue);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.reduce(reduceFn, initialValue);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_reduce_f64(typedArray, reduceFn, initialValue) as U;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.reduce(reduceFn, initialValue);
    }
  }

  /**
   * Sort operation for numeric arrays
   *
   * @param array The input array
   * @param compareFn The compare function
   * @returns The sorted array
   */
  public sort<T extends number>(
    array: T[],
    compareFn?: (a: T, b: T) => number
  ): T[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return [...array].sort(compareFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return [...array].sort(compareFn);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      const result = module.numeric_sort_f64(typedArray, compareFn);

      // Convert back to regular array
      return Array.from(result as Float64Array) as T[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return [...array].sort(compareFn);
    }
  }

  /**
   * Map-filter operation for numeric arrays (optimized chain)
   *
   * @param array The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @returns The mapped and filtered array
   */
  public mapFilter<T extends number, U extends number>(
    array: T[],
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): U[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.map(mapFn).filter(filterFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.map(mapFn).filter(filterFn);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      const result = module.numeric_map_filter_f64(typedArray, mapFn, filterFn);

      // Convert back to regular array
      return Array.from(result as Float64Array) as U[];
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.map(mapFn).filter(filterFn);
    }
  }

  /**
   * Sum operation for numeric arrays
   *
   * @param array The input array
   * @returns The sum of all elements
   */
  public sum(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.reduce((sum, value) => sum + value, 0);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.reduce((sum, value) => sum + value, 0);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_sum_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.reduce((sum, value) => sum + value, 0);
    }
  }

  /**
   * Average operation for numeric arrays
   *
   * @param array The input array
   * @returns The average of all elements
   */
  public average(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.length === 0 ? 0 : array.reduce((sum, value) => sum + value, 0) / array.length;
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.length === 0 ? 0 : array.reduce((sum, value) => sum + value, 0) / array.length;
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_average_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.length === 0 ? 0 : array.reduce((sum, value) => sum + value, 0) / array.length;
    }
  }

  /**
   * Min operation for numeric arrays
   *
   * @param array The input array
   * @returns The minimum value
   */
  public min(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.length === 0 ? NaN : Math.min(...array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.length === 0 ? NaN : Math.min(...array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_min_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.length === 0 ? NaN : Math.min(...array);
    }
  }

  /**
   * Max operation for numeric arrays
   *
   * @param array The input array
   * @returns The maximum value
   */
  public max(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return array.length === 0 ? NaN : Math.max(...array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return array.length === 0 ? NaN : Math.max(...array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_max_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return array.length === 0 ? NaN : Math.max(...array);
    }
  }

  /**
   * Check if an array contains only numbers
   *
   * @param array The array to check
   * @returns True if the array contains only numbers
   */
  private isNumericArray(array: any[]): boolean {
    return array.every(value => typeof value === 'number');
  }
}
