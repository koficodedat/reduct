/**
 * WebAssembly module loader
 */
import { WasmBatchProcessor } from './wasm-batch-processor';
import { WasmMemoryPool } from './wasm-memory-pool';
import { WasmModule } from './wasm-module';

/**
 * WebAssembly module loader configuration
 */
export interface WasmModuleLoaderConfig {
  /** The memory pool to use */
  memoryPool?: WasmMemoryPool;
  /** Whether to use batch processing */
  useBatchProcessing?: boolean;
  /** The maximum batch size */
  maxBatchSize?: number;
  /** The maximum batch delay (in milliseconds) */
  maxBatchDelay?: number;
  /** The WebAssembly module path */
  modulePath?: string;
}

/**
 * Default WebAssembly module loader configuration
 */
const DEFAULT_CONFIG: Required<WasmModuleLoaderConfig> = {
  memoryPool: WasmMemoryPool.getInstance(),
  useBatchProcessing: true,
  maxBatchSize: 100,
  maxBatchDelay: 10,
  modulePath: '../../../dist/wasm/reduct_wasm.js'
};

/**
 * WebAssembly module loader
 *
 * Handles loading and caching the WebAssembly module
 */
export class WasmModuleLoader {
  /**
   * The WebAssembly module
   */
  private module: WasmModule | null = null;

  /**
   * Promise for the loading operation
   */
  private loading: Promise<WasmModule | null> | null = null;

  /**
   * The memory pool
   */
  private memoryPool: WasmMemoryPool;

  /**
   * The batch processor
   */
  private batchProcessor: WasmBatchProcessor<any, any> | null = null;

  /**
   * The module loader configuration
   */
  private config: Required<WasmModuleLoaderConfig>;

  /**
   * Create a new WebAssembly module loader
   *
   * @param config The module loader configuration
   */
  constructor(config: WasmModuleLoaderConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryPool = this.config.memoryPool;

    // Create the batch processor if batch processing is enabled
    if (this.config.useBatchProcessing) {
      this.batchProcessor = new WasmBatchProcessor({
        maxBatchSize: this.config.maxBatchSize,
        maxBatchDelay: this.config.maxBatchDelay,
        memoryPool: this.memoryPool
      });
    }
  }

  /**
   * Load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   */
  public async loadModule(): Promise<WasmModule | null> {
    // If the module is already loaded, return it
    if (this.module) {
      return this.module;
    }

    // If the module is already being loaded, return the loading promise
    if (this.loading) {
      return this.loading;
    }

    // Load the module
    this.loading = this.loadModuleInternal();

    try {
      // Wait for the module to load
      this.module = await this.loading;
      return this.module;
    } catch (error) {
      // Clear the loading promise on error
      this.loading = null;
      throw error;
    }
  }

  /**
   * Internal method to load the WebAssembly module
   * @returns A promise that resolves to the WebAssembly module
   */
  private async loadModuleInternal(): Promise<WasmModule | null> {
    try {
      // Import the WebAssembly module
      // Use a dynamic import with a string literal to avoid TypeScript errors
      const wasmModulePath = this.config.modulePath;
      const wasmModule = await (Function('return import("' + wasmModulePath + '")')() as Promise<any>);

      // Initialize the module
      wasmModule.init_panic_hook();

      // Initialize the module with the memory pool
      if (wasmModule.__wbg_set_memory) {
        // Get memory from the pool
        const memory = this.memoryPool.getMemory(1024 * 1024); // 1MB initial size
        wasmModule.__wbg_set_memory(memory);
      }

      return wasmModule as unknown as WasmModule;
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error);
      return null;
    }
  }

  /**
   * Get the WebAssembly module
   * @returns The WebAssembly module, or null if not loaded
   */
  public getModule(): WasmModule | null {
    return this.module;
  }

  /**
   * Check if the WebAssembly module is loaded
   * @returns True if the module is loaded, false otherwise
   */
  public isModuleLoaded(): boolean {
    return this.module !== null;
  }

  /**
   * Clear the loaded module
   */
  public clearModule(): void {
    this.module = null;
    this.loading = null;
  }

  /**
   * Execute an operation with batch processing
   *
   * @param input The input for the operation
   * @param operation The operation to perform
   * @returns A promise that resolves with the result of the operation
   */
  public async executeBatch<T, R>(input: T, operation: (input: T) => R): Promise<R> {
    // If batch processing is disabled, execute the operation directly
    if (!this.config.useBatchProcessing || !this.batchProcessor) {
      return operation(input);
    }

    // Add the operation to the batch processor
    return this.batchProcessor.add(input, operation);
  }

  /**
   * Flush the batch processor
   *
   * @returns A promise that resolves when the batch has been processed
   */
  public async flushBatch(): Promise<void> {
    if (this.batchProcessor) {
      await this.batchProcessor.flush();
    }
  }

  /**
   * Get the memory pool
   *
   * @returns The memory pool
   */
  public getMemoryPool(): WasmMemoryPool {
    return this.memoryPool;
  }
}
