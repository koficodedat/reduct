/**
 * Adapters for data structures
 */
import { Accelerator, AcceleratorOptions } from '../accelerators/accelerator';
import { MapAccelerator, FilterAccelerator, ReduceAccelerator, SortAccelerator } from '../accelerators/data-structures/list';

/**
 * Get an accelerator for a list operation
 * @param operation The operation to accelerate
 * @param options Options for the accelerator
 * @returns The accelerator
 */
export function getListAccelerator<T, R>(
  operation: string,
  options: AcceleratorOptions = {}
): Accelerator<any, any> {
  switch (operation) {
    case 'map':
      return new MapAccelerator<T, R>(options);
    case 'filter':
      return new FilterAccelerator<T>(options);
    case 'reduce':
      return new ReduceAccelerator<T, R>(options);
    case 'sort':
      return new SortAccelerator<T>(options);
    default:
      throw new Error(`Unsupported list operation: ${operation}`);
  }
}

/**
 * Adapter for list operations
 */
export class ListAdapter {
  /**
   * Map operation with WebAssembly acceleration
   * @param data The data to map
   * @param fn The mapping function
   * @param options Options for the accelerator
   * @returns The mapped array
   */
  public static map<T, R>(
    data: T[],
    fn: (value: T, index: number) => R,
    options: AcceleratorOptions = {}
  ): R[] {
    const accelerator = getListAccelerator<T, R>('map', options);
    
    if (accelerator.isAvailable() && data.length >= 1000) {
      return accelerator.execute({ data, fn });
    }
    
    // Fall back to JavaScript implementation
    return data.map(fn);
  }
  
  /**
   * Filter operation with WebAssembly acceleration
   * @param data The data to filter
   * @param fn The filter function
   * @param options Options for the accelerator
   * @returns The filtered array
   */
  public static filter<T>(
    data: T[],
    fn: (value: T, index: number) => boolean,
    options: AcceleratorOptions = {}
  ): T[] {
    const accelerator = getListAccelerator<T, T>('filter', options);
    
    if (accelerator.isAvailable() && data.length >= 1000) {
      return accelerator.execute({ data, fn });
    }
    
    // Fall back to JavaScript implementation
    return data.filter(fn);
  }
  
  /**
   * Reduce operation with WebAssembly acceleration
   * @param data The data to reduce
   * @param fn The reduce function
   * @param initial The initial value
   * @param options Options for the accelerator
   * @returns The reduced value
   */
  public static reduce<T, R>(
    data: T[],
    fn: (accumulator: R, value: T, index: number) => R,
    initial: R,
    options: AcceleratorOptions = {}
  ): R {
    const accelerator = getListAccelerator<T, R>('reduce', options);
    
    if (accelerator.isAvailable() && data.length >= 1000) {
      return accelerator.execute({ data, fn, initial });
    }
    
    // Fall back to JavaScript implementation
    return data.reduce(fn, initial);
  }
  
  /**
   * Sort operation with WebAssembly acceleration
   * @param data The data to sort
   * @param compareFn The compare function
   * @param options Options for the accelerator
   * @returns The sorted array
   */
  public static sort<T>(
    data: T[],
    compareFn?: (a: T, b: T) => number,
    options: AcceleratorOptions = {}
  ): T[] {
    const accelerator = getListAccelerator<T, T>('sort', options);
    
    if (accelerator.isAvailable() && data.length >= 1000) {
      return accelerator.execute({ data, compareFn });
    }
    
    // Fall back to JavaScript implementation
    const result = [...data];
    return compareFn ? result.sort(compareFn) : result.sort();
  }
}
