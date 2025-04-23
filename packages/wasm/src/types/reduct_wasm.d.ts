/**
 * Type declarations for the WebAssembly module
 */

declare module '../../../dist/wasm/reduct_wasm.js' {
  /**
   * Initialize the panic hook for better error messages
   */
  export function init_panic_hook(): void;

  /**
   * Get a greeting message
   * @param name The name to greet
   * @returns The greeting message
   */
  export function greet(name: string): string;

  /**
   * Get the version of the WebAssembly module
   * @returns The version string
   */
  export function get_version(): string;

  /**
   * Map operation for arrays
   * @param input The input array
   * @param mapFn The mapping function
   * @returns The mapped array
   */
  export function vector_map(input: any[], mapFn: (value: any, index: number) => any): any[];

  /**
   * Filter operation for arrays
   * @param input The input array
   * @param filterFn The filter function
   * @returns The filtered array
   */
  export function vector_filter(input: any[], filterFn: (value: any, index: number) => boolean): any[];

  /**
   * Reduce operation for arrays
   * @param input The input array
   * @param reduceFn The reduce function
   * @param initial The initial value
   * @returns The reduced value
   */
  export function vector_reduce(input: any[], reduceFn: (accumulator: any, value: any, index: number) => any, initial: any): any;

  /**
   * Sort operation for arrays
   * @param input The input array
   * @param compareFn The compare function
   * @returns The sorted array
   */
  export function vector_sort(input: any[], compareFn: (a: any, b: any) => number): any[];

  /**
   * Map-filter operation for arrays (optimized chain)
   * @param input The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @returns The mapped and filtered array
   */
  export function vector_map_filter(input: any[], mapFn: (value: any, index: number) => any, filterFn: (value: any, index: number) => boolean): any[];

  /**
   * Map-reduce operation for arrays (optimized chain)
   * @param input The input array
   * @param mapFn The mapping function
   * @param reduceFn The reduce function
   * @param initial The initial value
   * @returns The reduced value
   */
  export function vector_map_reduce(input: any[], mapFn: (value: any, index: number) => any, reduceFn: (accumulator: any, value: any, index: number) => any, initial: any): any;

  /**
   * Filter-reduce operation for arrays (optimized chain)
   * @param input The input array
   * @param filterFn The filter function
   * @param reduceFn The reduce function
   * @param initial The initial value
   * @returns The reduced value
   */
  export function vector_filter_reduce(input: any[], filterFn: (value: any, index: number) => boolean, reduceFn: (accumulator: any, value: any, index: number) => any, initial: any): any;

  /**
   * Map-filter-reduce operation for arrays (optimized chain)
   * @param input The input array
   * @param mapFn The mapping function
   * @param filterFn The filter function
   * @param reduceFn The reduce function
   * @param initial The initial value
   * @returns The reduced value
   */
  export function vector_map_filter_reduce(input: any[], mapFn: (value: any, index: number) => any, filterFn: (value: any, index: number) => boolean, reduceFn: (accumulator: any, value: any, index: number) => any, initial: any): any;
}
