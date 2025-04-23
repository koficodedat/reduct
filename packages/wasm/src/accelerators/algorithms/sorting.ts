import { WebAssemblyFeature } from '../../core/feature-detection';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WasmAccelerator } from '../wasm-accelerator';

/**
 * Sorting algorithm accelerator
 *
 * Provides optimized implementations of sorting algorithms using WebAssembly.
 */
export class SortingAccelerator extends WasmAccelerator {
  /**
   * Create a new sorting accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('algorithms', 'sorting', 'sort', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Sort a numeric array using specialized algorithms
   *
   * This method automatically selects the best algorithm based on the array type:
   * - For Float64Array: Uses specialized_sort_f64
   * - For Uint32Array: Uses radix_sort_u32
   * - For Uint8Array: Uses counting_sort_u8
   * - For other arrays: Falls back to JavaScript sort
   *
   * @param array The array to sort
   * @param compareFn Optional comparison function
   * @returns The sorted array
   */
  public sort<T>(array: T[] | Float64Array | Uint32Array | Uint8Array, compareFn?: (a: any, b: any) => number): T[] | Float64Array | Uint32Array | Uint8Array {
    // If a comparison function is provided, use JavaScript sort
    if (compareFn) {
      if (array instanceof Float64Array) {
        const result = new Float64Array(array.length);
        const sorted = Array.from(array).sort(compareFn);
        sorted.forEach((val, i) => result[i] = val);
        return result;
      } else if (array instanceof Uint32Array) {
        const result = new Uint32Array(array.length);
        const sorted = Array.from(array).sort(compareFn);
        sorted.forEach((val, i) => result[i] = val);
        return result;
      } else if (array instanceof Uint8Array) {
        const result = new Uint8Array(array.length);
        const sorted = Array.from(array).sort(compareFn);
        sorted.forEach((val, i) => result[i] = val);
        return result;
      } else {
        return [...array as T[]].sort(compareFn);
      }
    }

    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      if (array instanceof Float64Array || array instanceof Uint32Array || array instanceof Uint8Array) {
        const result = this.sortTypedArray(array);
        return result;
      } else {
        return [...array as T[]].sort((a: any, b: any) => a - b);
      }
    }

    try {
      // Check array type and use the appropriate algorithm
      if (array instanceof Float64Array) {
        // For Float64Array, use specialized_sort_f64
        const result = module.specialized_sort_f64(array);
        return result as Float64Array;
      } else if (this.isNumericArray(array as T[])) {
        // For numeric arrays, use specialized_sort_f64
        const typedArray = new Float64Array(array as unknown as number[]);
        const result = module.specialized_sort_f64(typedArray);
        return Array.from(new Float64Array(result as any)) as unknown as T[];
      } else if (array instanceof Uint32Array) {
        // For Uint32Array, use radix_sort_u32
        return module.radix_sort_u32(array) as Uint32Array;
      } else if (array instanceof Uint8Array) {
        // For Uint8Array, use counting_sort_u8
        return module.counting_sort_u8(array) as Uint8Array;
      } else {
        // For other arrays, use JavaScript sort
        return [...array as T[]].sort((a: any, b: any) => a - b);
      }
    } catch (error) {
      // Fall back to JavaScript sort
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      if (array instanceof Float64Array || array instanceof Uint32Array || array instanceof Uint8Array) {
        const result = this.sortTypedArray(array);
        return result;
      } else {
        return [...array as T[]].sort((a: any, b: any) => a - b);
      }
    }
  }

  /**
   * Execute the accelerated operation
   * @param input The input for the operation
   * @returns The result of the operation
   */
  public execute(input: any): any {
    const { array, compareFn } = input;
    return this.sort(array, compareFn);
  }

  /**
   * Get the performance profile of the sorting accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 3.0,
      effectiveInputSize: 1000,
    };
  }

  /**
   * Sort a typed array using JavaScript
   *
   * @param array The typed array to sort
   * @returns The sorted typed array
   */
  private sortTypedArray<T extends Float64Array | Uint32Array | Uint8Array>(array: T): T {
    if (array instanceof Float64Array) {
      const result = new Float64Array(array.length);
      const sorted = Array.from(array).sort((a, b) => a - b);
      sorted.forEach((val, i) => result[i] = val);
      return result as T;
    } else if (array instanceof Uint32Array) {
      const result = new Uint32Array(array.length);
      const sorted = Array.from(array).sort((a, b) => a - b);
      sorted.forEach((val, i) => result[i] = val);
      return result as T;
    } else {
      const result = new Uint8Array(array.length);
      const sorted = Array.from(array).sort((a, b) => a - b);
      sorted.forEach((val, i) => result[i] = val);
      return result as T;
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
