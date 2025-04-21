import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions, AcceleratorTier } from '../accelerator';
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
      // Default tiering strategy for numeric operations
      tiering: {
        // Tier 1: Always use WebAssembly for arrays over 100,000 elements
        [AcceleratorTier.HIGH_VALUE]: (array: number[]) => {
          return Array.isArray(array) && array.length >= 100000;
        },
        // Tier 2: Use WebAssembly for arrays over 10,000 elements
        [AcceleratorTier.CONDITIONAL]: (array: number[]) => {
          return Array.isArray(array) && array.length >= 10000;
        },
        // Tier 3: Use JavaScript for everything else
        [AcceleratorTier.JS_PREFERRED]: () => true,
      },
      // Default thresholds for numeric operations
      thresholds: {
        minArraySize: 10000,
      },
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
   * Execute the operation using WebAssembly
   * @param _input The input for the operation
   * @returns The result of the operation
   */
  protected executeWasm(_input: any): any {
    throw new Error('Method not implemented. Use specific operation methods instead.');
  }

  /**
   * Execute the operation using JavaScript
   * @param _input The input for the operation
   * @returns The result of the operation
   */
  protected executeJs(_input: any): any {
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
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.mapJs(array, mapFn);
    } else {
      return this.mapWasm(array, mapFn);
    }
  }

  /**
   * Map operation using WebAssembly
   *
   * @param array The input array
   * @param mapFn The mapping function
   * @returns The mapped array
   */
  private mapWasm<T extends number, U extends number>(
    array: T[],
    mapFn: (value: T, index: number) => U
  ): U[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.mapJs(array, mapFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.mapJs(array, mapFn);
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
      return this.mapJs(array, mapFn);
    }
  }

  /**
   * Map operation using JavaScript
   *
   * @param array The input array
   * @param mapFn The mapping function
   * @returns The mapped array
   */
  private mapJs<T extends number, U extends number>(
    array: T[],
    mapFn: (value: T, index: number) => U
  ): U[] {
    return array.map(mapFn);
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
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.filterJs(array, filterFn);
    } else {
      return this.filterWasm(array, filterFn);
    }
  }

  /**
   * Filter operation using WebAssembly
   *
   * @param array The input array
   * @param filterFn The filter function
   * @returns The filtered array
   */
  private filterWasm<T extends number>(
    array: T[],
    filterFn: (value: T, index: number) => boolean
  ): T[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.filterJs(array, filterFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.filterJs(array, filterFn);
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
      return this.filterJs(array, filterFn);
    }
  }

  /**
   * Filter operation using JavaScript
   *
   * @param array The input array
   * @param filterFn The filter function
   * @returns The filtered array
   */
  private filterJs<T extends number>(
    array: T[],
    filterFn: (value: T, index: number) => boolean
  ): T[] {
    return array.filter(filterFn);
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
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.reduceJs(array, reduceFn, initialValue);
    } else {
      return this.reduceWasm(array, reduceFn, initialValue);
    }
  }

  /**
   * Reduce operation using WebAssembly
   *
   * @param array The input array
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  private reduceWasm<T extends number, U>(
    array: T[],
    reduceFn: (accumulator: U, value: T, index: number) => U,
    initialValue: U
  ): U {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.reduceJs(array, reduceFn, initialValue);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.reduceJs(array, reduceFn, initialValue);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_reduce_f64(typedArray, reduceFn, initialValue) as U;
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.reduceJs(array, reduceFn, initialValue);
    }
  }

  /**
   * Reduce operation using JavaScript
   *
   * @param array The input array
   * @param reduceFn The reduce function
   * @param initialValue The initial value
   * @returns The reduced value
   */
  private reduceJs<T extends number, U>(
    array: T[],
    reduceFn: (accumulator: U, value: T, index: number) => U,
    initialValue: U
  ): U {
    return array.reduce(reduceFn, initialValue);
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
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.sortJs(array, compareFn);
    } else {
      return this.sortWasm(array, compareFn);
    }
  }

  /**
   * Sort operation using WebAssembly
   *
   * @param array The input array
   * @param compareFn The compare function
   * @returns The sorted array
   */
  private sortWasm<T extends number>(
    array: T[],
    compareFn?: (a: T, b: T) => number
  ): T[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.sortJs(array, compareFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.sortJs(array, compareFn);
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
      return this.sortJs(array, compareFn);
    }
  }

  /**
   * Sort operation using JavaScript
   *
   * @param array The input array
   * @param compareFn The compare function
   * @returns The sorted array
   */
  private sortJs<T extends number>(
    array: T[],
    compareFn?: (a: T, b: T) => number
  ): T[] {
    return [...array].sort(compareFn);
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
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.mapFilterJs(array, mapFn, filterFn);
    } else {
      return this.mapFilterWasm(array, mapFn, filterFn);
    }
  }

  /**
   * Map-filter operation using WebAssembly
   *
   * @param array The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @returns The mapped and filtered array
   */
  private mapFilterWasm<T extends number, U extends number>(
    array: T[],
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): U[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.mapFilterJs(array, mapFn, filterFn);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.mapFilterJs(array, mapFn, filterFn);
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
      return this.mapFilterJs(array, mapFn, filterFn);
    }
  }

  /**
   * Map-filter operation using JavaScript
   *
   * @param array The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @returns The mapped and filtered array
   */
  private mapFilterJs<T extends number, U extends number>(
    array: T[],
    mapFn: (value: T, index: number) => U,
    filterFn: (value: U, index: number) => boolean
  ): U[] {
    return array.map(mapFn).filter(filterFn);
  }

  /**
   * Sum operation for numeric arrays
   *
   * @param array The input array
   * @returns The sum of all elements
   */
  public sum(array: number[]): number {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.sumJs(array);
    } else {
      return this.sumWasm(array);
    }
  }

  /**
   * Sum operation using WebAssembly
   *
   * @param array The input array
   * @returns The sum of all elements
   */
  private sumWasm(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.sumJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.sumJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_sum_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.sumJs(array);
    }
  }

  /**
   * Sum operation using JavaScript
   *
   * @param array The input array
   * @returns The sum of all elements
   */
  private sumJs(array: number[]): number {
    return array.reduce((sum, value) => sum + value, 0);
  }

  /**
   * Average operation for numeric arrays
   *
   * @param array The input array
   * @returns The average of all elements
   */
  public average(array: number[]): number {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.averageJs(array);
    } else {
      return this.averageWasm(array);
    }
  }

  /**
   * Average operation using WebAssembly
   *
   * @param array The input array
   * @returns The average of all elements
   */
  private averageWasm(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.averageJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.averageJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_average_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.averageJs(array);
    }
  }

  /**
   * Average operation using JavaScript
   *
   * @param array The input array
   * @returns The average of all elements
   */
  private averageJs(array: number[]): number {
    return array.length === 0 ? 0 : this.sumJs(array) / array.length;
  }

  /**
   * Min operation for numeric arrays
   *
   * @param array The input array
   * @returns The minimum value
   */
  public min(array: number[]): number {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.minJs(array);
    } else {
      return this.minWasm(array);
    }
  }

  /**
   * Min operation using WebAssembly
   *
   * @param array The input array
   * @returns The minimum value
   */
  private minWasm(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.minJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.minJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_min_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.minJs(array);
    }
  }

  /**
   * Min operation using JavaScript
   *
   * @param array The input array
   * @returns The minimum value
   */
  private minJs(array: number[]): number {
    return array.length === 0 ? NaN : Math.min(...array);
  }

  /**
   * Max operation for numeric arrays
   *
   * @param array The input array
   * @returns The maximum value
   */
  public max(array: number[]): number {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(array);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.maxJs(array);
    } else {
      return this.maxWasm(array);
    }
  }

  /**
   * Max operation using WebAssembly
   *
   * @param array The input array
   * @returns The maximum value
   */
  private maxWasm(array: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.maxJs(array);
    }

    try {
      // Check if the array contains only numbers
      if (!this.isNumericArray(array)) {
        return this.maxJs(array);
      }

      // Convert to Float64Array for better performance
      const typedArray = new Float64Array(array);

      // Call the WebAssembly implementation
      return module.numeric_max_f64(typedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.maxJs(array);
    }
  }

  /**
   * Max operation using JavaScript
   *
   * @param array The input array
   * @returns The maximum value
   */
  private maxJs(array: number[]): number {
    return array.length === 0 ? NaN : Math.max(...array);
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
