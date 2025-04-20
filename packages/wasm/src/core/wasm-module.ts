/**
 * WebAssembly module loader and initialization
 */
import { isWebAssemblySupported } from './feature-detection';
import { WasmNotSupportedError, WasmLoadError } from './error-handling';

/**
 * WebAssembly module interface
 */
export interface WasmModule {
  // Core functions
  init_panic_hook(): void;
  greet(name: string): string;
  get_version(): string;

  // List operations
  vector_map(input: any, mapFn: Function): any;
  vector_filter(input: any, filterFn: Function): any;
  vector_reduce(input: any, reduceFn: Function, initial: any): any;
  vector_sort(input: any, compareFn: Function): any;
  vector_map_filter(input: any, mapFn: Function, filterFn: Function): any;
  vector_map_reduce(input: any, mapFn: Function, reduceFn: Function, initial: any): any;
  vector_filter_reduce(input: any, filterFn: Function, reduceFn: Function, initial: any): any;
  vector_map_filter_reduce(input: any, mapFn: Function, filterFn: Function, reduceFn: Function, initial: any): any;

  // Numeric operations
  numeric_map_f64(input: any, mapFn: Function): any;
  numeric_filter_f64(input: any, filterFn: Function): any;
  numeric_reduce_f64(input: any, reduceFn: Function, initial: any): any;
  numeric_sort_f64(input: any, compareFn?: Function): any;
  numeric_map_filter_f64(input: any, mapFn: Function, filterFn: Function): any;
  numeric_sum_f64(input: any): number;
  numeric_average_f64(input: any): number;
  numeric_min_f64(input: any): number;
  numeric_max_f64(input: any): number;

  // Statistical operations
  numeric_median_f64(input: any): number;
  numeric_std_dev_f64(input: any): number;
  numeric_correlation_f64(x: any, y: any): number;
  numeric_percentile_f64(input: any, percentile: number): number;

  // Sorting algorithms
  specialized_sort_f64(input: any): any;
  radix_sort_u32(input: any): any;
  counting_sort_u8(input: any): any;
}

/**
 * WebAssembly module loader
 */
export class WasmModuleLoader {
  private static instance: WasmModuleLoader;
  private module: WasmModule | null = null;
  private loading: Promise<WasmModule> | null = null;

  /**
   * Get the singleton instance of the WebAssembly module loader
   * @returns The WebAssembly module loader instance
   */
  public static getInstance(): WasmModuleLoader {
    if (!WasmModuleLoader.instance) {
      WasmModuleLoader.instance = new WasmModuleLoader();
    }
    return WasmModuleLoader.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   * @throws WasmNotSupportedError if WebAssembly is not supported
   * @throws WasmLoadError if the module fails to load
   */
  public async loadModule(): Promise<WasmModule> {
    // If the module is already loaded, return it
    if (this.module) {
      return this.module;
    }

    // If the module is already loading, return the loading promise
    if (this.loading) {
      return this.loading;
    }

    // Check if WebAssembly is supported
    if (!isWebAssemblySupported()) {
      throw new WasmNotSupportedError();
    }

    // Load the module
    this.loading = this.loadModuleInternal();

    try {
      this.module = await this.loading;
      return this.module;
    } catch (error) {
      // Clear the loading promise
      this.loading = null;

      // Throw a WasmLoadError
      throw new WasmLoadError(
        `Failed to load WebAssembly module: ${error}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Internal method to load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   */
  private async loadModuleInternal(): Promise<WasmModule> {
    try {
      // Import the WebAssembly module
      // Use a dynamic import with a string literal to avoid TypeScript errors
      const wasmModulePath = '../../../dist/wasm/reduct_wasm.js';
      const wasmModule = await (Function('return import("' + wasmModulePath + '")')() as Promise<any>);

      // Initialize the module
      wasmModule.init_panic_hook();

      return wasmModule as unknown as WasmModule;
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error);
      throw error;
    }
  }

  /**
   * Check if the WebAssembly module is loaded
   * @returns True if the module is loaded, false otherwise
   */
  public isLoaded(): boolean {
    return this.module !== null;
  }

  /**
   * Get the WebAssembly module
   * @returns The WebAssembly module, or null if not loaded
   */
  public getModule(): WasmModule | null {
    return this.module;
  }

  /**
   * Clear the loaded module
   */
  public clearModule(): void {
    this.module = null;
    this.loading = null;
  }
}
