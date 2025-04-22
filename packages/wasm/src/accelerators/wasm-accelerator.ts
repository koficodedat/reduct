/**
 * Base class for WebAssembly accelerators
 */
import { BaseAccelerator, PerformanceProfile, AcceleratorOptions, AcceleratorTier } from './accelerator';
import { WasmModule } from '../core/wasm-module';
import { WasmModuleLoader, WasmModuleLoaderConfig } from '../core/wasm-module-loader';
import { WasmMemoryPool } from '../core/wasm-memory-pool';

/**
 * Base class for WebAssembly accelerators
 */
export abstract class WasmAccelerator extends BaseAccelerator<any, any> {
  /**
   * The WebAssembly module loader
   */
  private static moduleLoader: WasmModuleLoader | null = null;

  /**
   * The memory pool
   */
  private static memoryPool: WasmMemoryPool = WasmMemoryPool.getInstance();

  /**
   * Create a new WebAssembly accelerator
   * @param domain The domain of the accelerator
   * @param type The type of the accelerator
   * @param operation The operation to accelerate
   * @param options Options for the accelerator
   */
  constructor(
    domain: string,
    type: string,
    operation: string,
    options: AcceleratorOptions = {}
  ) {
    super(domain, type, operation, options);

    // Initialize the module loader if not already initialized
    if (!WasmAccelerator.moduleLoader) {
      // Create module loader configuration
      const moduleLoaderConfig: WasmModuleLoaderConfig = {
        memoryPool: WasmAccelerator.memoryPool,
        useBatchProcessing: true,
        maxBatchSize: 100,
        maxBatchDelay: 10
      };

      // Create the module loader
      WasmAccelerator.moduleLoader = new WasmModuleLoader(moduleLoaderConfig);
    }
  }

  /**
   * Get the WebAssembly module
   * @returns The WebAssembly module, or null if not loaded
   */
  protected getModule(): WasmModule | null {
    if (!WasmAccelerator.moduleLoader) {
      return null;
    }

    return WasmAccelerator.moduleLoader.getModule();
  }

  /**
   * Load the WebAssembly module
   * @returns A promise that resolves when the module is loaded
   */
  protected async loadModule(): Promise<WasmModule | null> {
    if (!WasmAccelerator.moduleLoader) {
      return null;
    }

    return WasmAccelerator.moduleLoader.loadModule();
  }

  /**
   * Check if the WebAssembly module is loaded
   * @returns True if the module is loaded, false otherwise
   */
  protected isModuleLoaded(): boolean {
    if (!WasmAccelerator.moduleLoader) {
      return false;
    }

    return WasmAccelerator.moduleLoader.isModuleLoaded();
  }

  /**
   * Execute the operation using the appropriate implementation for the given tier
   * @param input The input for the operation
   * @param tier The tier to use
   * @returns The result of the operation
   */
  protected executeWithTier(input: any, tier: AcceleratorTier): any {
    // Default implementation for WebAssembly accelerators
    // HIGH_VALUE and CONDITIONAL tiers use WebAssembly
    // JS_PREFERRED tier uses JavaScript fallback

    if (tier === AcceleratorTier.JS_PREFERRED) {
      // Use JavaScript fallback for JS_PREFERRED tier
      return this.executeJs(input);
    }

    // Use WebAssembly for HIGH_VALUE and CONDITIONAL tiers
    return this.executeWasm(input);
  }

  /**
   * Execute the operation using WebAssembly
   * @param input The input for the operation
   * @returns The result of the operation
   */
  protected abstract executeWasm(input: any): any;

  /**
   * Execute the operation using JavaScript
   * @param input The input for the operation
   * @returns The result of the operation
   */
  protected abstract executeJs(input: any): any;

  /**
   * Get the performance profile of the accelerator
   * @returns The performance profile
   */
  public abstract getPerformanceProfile(): PerformanceProfile;

  /**
   * Execute an operation with batch processing
   *
   * @param input The input for the operation
   * @param operation The operation to perform
   * @returns A promise that resolves with the result of the operation
   */
  protected async executeBatch<T, R>(input: T, operation: (input: T) => R): Promise<R> {
    if (!WasmAccelerator.moduleLoader) {
      return operation(input);
    }

    return WasmAccelerator.moduleLoader.executeBatch(input, operation);
  }

  /**
   * Flush the batch processor
   *
   * @returns A promise that resolves when the batch has been processed
   */
  protected async flushBatch(): Promise<void> {
    if (WasmAccelerator.moduleLoader) {
      await WasmAccelerator.moduleLoader.flushBatch();
    }
  }

  /**
   * Get the memory pool
   *
   * @returns The memory pool
   */
  protected getMemoryPool(): WasmMemoryPool {
    return WasmAccelerator.memoryPool;
  }
}
